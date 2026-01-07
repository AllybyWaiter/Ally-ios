import { useRef, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
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

interface StreamingCallbacks {
  onStreamStart: () => void;
  onToken: (fullContent: string) => void;
  onStreamEnd: (fullContent: string) => void;
  onError: (error: Error) => void;
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
    callbacks: StreamingCallbacks
  ): Promise<string> => {
    // Check authentication
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

    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ally-chat`;

    // Cancel any in-flight request and clear existing timeout
    abortControllerRef.current?.abort();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    abortControllerRef.current = new AbortController();

    // Format messages for API - convert imageUrl to proper format
    const formattedMessages = messages.map(msg => {
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
        Authorization: `Bearer ${session.data.session.access_token}`,
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
      throw new Error("Failed to get response");
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
      const now = Date.now();
      // Throttle updates to ~60fps to avoid excessive re-renders
      if (now - lastUpdateRef.current >= UPDATE_INTERVAL) {
        assistantMessageRef.current += content;
        lastUpdateRef.current = now;
        callbacks.onToken(assistantMessageRef.current);
      } else {
        // Buffer very rapid tokens
        assistantMessageRef.current += content;
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
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
  }, []);

  return {
    isStreaming,
    streamResponse,
    abort,
  };
}
