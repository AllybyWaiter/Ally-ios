import { useRef, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  id?: string;
  aquariumContext?: string | null;
  aquariumName?: string;
  imageUrl?: string;
}

export interface ToolExecution {
  toolName: string;
  success: boolean;
  message: string;
}

interface StreamingCallbacks {
  onStreamStart: () => void;
  onToken: (fullContent: string) => void;
  onStreamEnd: (fullContent: string) => void;
  onError: (error: Error) => void;
  onToolExecution?: (executions: ToolExecution[]) => void;
}

type ModelType = 'standard' | 'thinking';

const UPDATE_INTERVAL = 16; // ~60fps for smooth typewriter effect
const STREAM_TIMEOUT_MS = 60000; // 60 second timeout for streaming

export function useStreamingResponse() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Accumulated content ref
  const assistantMessageRef = useRef<string>("");
  const lastUpdateRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const streamResponse = useCallback(async (
    messages: Message[],
    aquariumId: string | null,
    model: ModelType = 'standard',
    callbacks: StreamingCallbacks,
    retryToken?: string // Token to use for retry after refresh
  ): Promise<string> => {
    // Get access token - use retry token if provided, otherwise get from session
    let accessToken = retryToken;
    if (!accessToken) {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to chat with Ally",
          variant: "destructive",
        });
        navigate("/auth");
        throw new Error("Authentication required");
      }
      accessToken = session.data.session.access_token;
    }

    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ally-chat`;

    // Cancel any in-flight request and clear existing timeout
    abortControllerRef.current?.abort();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    abortControllerRef.current = new AbortController();

    // Format messages for API - convert imageUrl to proper format
    // Filter out initial greeting to prevent AI confusion about identity
    const filteredMessages = messages.filter((msg, index) => {
      // Skip the first assistant message if it's the default greeting
      // This prevents the AI from seeing "Hi! I'm Ally" and getting confused about roles
      if (index === 0 && msg.role === 'assistant' && msg.content.includes("I'm Ally")) {
        return false;
      }
      return true;
    });

    const formattedMessages = filteredMessages.map(msg => {
      if (msg.imageUrl && msg.imageUrl.startsWith('data:image')) {
        return {
          role: msg.role,
          content: msg.content,
          imageUrl: msg.imageUrl,
        };
      }
      return {
        role: msg.role,
        content: msg.content,
      };
    });

    // Set up timeout
    timeoutRef.current = window.setTimeout(() => {
      abortControllerRef.current?.abort();
      callbacks.onError(new Error('Request timed out after 60 seconds'));
    }, STREAM_TIMEOUT_MS);

    const response = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messages: formattedMessages,
        aquariumId,
        model, // Pass model selection to backend
      }),
      signal: abortControllerRef.current.signal,
    });

    if (!response.ok || !response.body) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      // Handle 401 - try to refresh session and retry automatically (once)
      if (response.status === 401 && !retryToken) {
        console.log('Session expired, attempting refresh and retry...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        console.log('Refresh result:', {
          hasSession: !!refreshData?.session,
          error: refreshError?.message,
          tokenPreview: refreshData?.session?.access_token?.slice(0, 20) + '...'
        });
        if (refreshError || !refreshData.session) {
          console.error('Session refresh failed:', refreshError);
          toast({
            title: "Session expired",
            description: "Please sign in again to continue.",
            variant: "destructive",
          });
          navigate("/auth");
          throw new Error("Session expired. Please sign in again.");
        }
        // Session refreshed - retry with the NEW token directly
        console.log('Session refreshed, retrying with new token...');
        return streamResponse(messages, aquariumId, model, callbacks, refreshData.session.access_token);
      }

      // If retry also failed with 401, user needs to fully re-authenticate
      if (response.status === 401 && retryToken) {
        console.error('Retry with refreshed token still got 401 - forcing re-auth');
        toast({
          title: "Authentication error",
          description: "Please sign out and sign in again.",
          variant: "destructive",
        });
        navigate("/auth");
        throw new Error("Authentication failed. Please sign in again.");
      }

      // Parse error response for specific messages
      let errorMessage = `Failed to get response (${response.status})`;
      try {
        const errorData = await response.json();
        if (response.status === 429) {
          errorMessage = errorData.error || "Rate limit exceeded. Please wait a moment and try again.";
        } else if (response.status === 402) {
          errorMessage = errorData.error || "AI service temporarily unavailable. Please try again later.";
        } else if (response.status === 502 || response.status === 503) {
          errorMessage = errorData.error || "AI service is temporarily unavailable. Please try again.";
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // Use generic message with status code if parsing fails
        console.warn('Failed to parse error response:', response.status, response.statusText);
      }

      throw new Error(errorMessage);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    // Reset state
    lastUpdateRef.current = Date.now();
    assistantMessageRef.current = "";
    setIsStreaming(true);
    callbacks.onStreamStart();

    // Update function - sends tokens immediately for smooth typewriter
    const updateContent = (content: string) => {
      // Sanitize content to prevent XSS using DOMPurify
      const sanitized = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'blockquote', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
        ALLOWED_ATTR: ['href'],
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
      });

      const now = Date.now();
      // Throttle updates to ~60fps to avoid excessive re-renders
      if (now - lastUpdateRef.current >= UPDATE_INTERVAL) {
        assistantMessageRef.current += sanitized;
        lastUpdateRef.current = now;
        callbacks.onToken(assistantMessageRef.current);
      } else {
        // Buffer very rapid tokens
        assistantMessageRef.current += sanitized;
      }
    };

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);

          // Handle tool execution feedback events
          if (parsed.type === 'tool_executions' && parsed.executions) {
            callbacks.onToolExecution?.(parsed.executions as ToolExecution[]);
            continue;
          }

          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            updateContent(content);
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Clear timeout on successful completion
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Final update to ensure all content is sent
    callbacks.onToken(assistantMessageRef.current);
    setIsStreaming(false);
    
    const finalContent = assistantMessageRef.current;
    callbacks.onStreamEnd(finalContent);
    
    return finalContent;
  }, [navigate, toast]);

  const abort = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
    // Reset accumulated content to prevent stale data on next stream
    assistantMessageRef.current = "";
  }, []);

  return {
    isStreaming,
    streamResponse,
    abort,
  };
}
