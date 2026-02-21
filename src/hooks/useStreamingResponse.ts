import { useRef, useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import { FeatureArea, logApiFailure, logMonitoringEvent, logSlowOperation } from "@/lib/sentry";

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

export interface DataCardParameter {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
  sparkline?: number[];
  change?: number;
}

export interface DataCardPayload {
  card_type: 'latest_test' | 'parameter_trend' | 'tank_summary';
  title: string;
  aquarium_name: string;
  timestamp: string;
  test_count?: number;
  parameters: DataCardParameter[];
}

interface StreamingCallbacks {
  onStreamStart: () => void;
  onToken: (fullContent: string) => void;
  onStreamEnd: (fullContent: string) => void;
  onError: (error: Error) => void;
  onToolExecution?: (executions: ToolExecution[]) => void;
  onDataCard?: (card: DataCardPayload) => void;
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
  // Track current request ID to prevent stale cleanup
  const currentRequestIdRef = useRef<number>(0);

  const streamResponse = useCallback(async (
    messages: Message[],
    aquariumId: string | null,
    model: ModelType = 'standard',
    callbacks: StreamingCallbacks,
    retryToken?: string, // Token to use for retry after refresh
    conversationHint?: string | null, // Hint for system prompt context (e.g. 'volume-calculator')
    userAquariums?: Array<{ id: string; name: string; type: string }> // User's aquarium list for context when no aquarium selected
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

    // Generate unique request ID for this request
    const requestId = ++currentRequestIdRef.current;

    // Cancel any in-flight request and clear existing timeout
    abortControllerRef.current?.abort();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Create new AbortController for this specific request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

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

    // Set up timeout for this specific request
    let timeoutTriggered = false;
    timeoutRef.current = window.setTimeout(() => {
      // Only abort if this is still the current request
      if (currentRequestIdRef.current === requestId) {
        timeoutTriggered = true;
        logApiFailure(
          {
            endpoint: 'ally-chat',
            method: 'POST',
            statusCode: 408,
            operation: 'chat_stream',
            reason: 'client_timeout_60s',
          },
          FeatureArea.CHAT
        );
        abortController.abort();
        callbacks.onError(new Error('Request timed out after 60 seconds'));
      }
    }, STREAM_TIMEOUT_MS);

    const requestStartedAt = performance.now();
    let response: Response;
    try {
      response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messages: formattedMessages,
          aquariumId,
          model, // Pass model selection to backend
          ...(conversationHint ? { conversationHint } : {}),
          ...(!aquariumId && userAquariums && userAquariums.length > 0 ? { userAquariums } : {}),
        }),
        signal: abortController.signal,
      });
    } catch (error) {
      const durationMs = performance.now() - requestStartedAt;
      if (!timeoutTriggered) {
        logApiFailure(
          {
            endpoint: 'ally-chat',
            method: 'POST',
            durationMs,
            operation: 'chat_stream',
            reason: error instanceof Error ? error.message : 'network_error',
          },
          FeatureArea.CHAT
        );
      }
      throw error;
    }

    const responseLatencyMs = performance.now() - requestStartedAt;
    logSlowOperation(
      'ally-chat_response_headers',
      responseLatencyMs,
      4000,
      FeatureArea.CHAT,
      { model }
    );

    // Check if request was superseded before processing response
    if (currentRequestIdRef.current !== requestId) {
      return "";
    }

    if (!response.ok || !response.body) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      logApiFailure(
        {
          endpoint: 'ally-chat',
          method: 'POST',
          statusCode: response.status,
          durationMs: responseLatencyMs,
          operation: 'chat_stream',
          reason: !response.body ? 'missing_response_body' : 'http_error',
        },
        FeatureArea.CHAT
      );

      // Handle 401 - try to refresh session and retry automatically (once)
      if (response.status === 401 && !retryToken) {
        logger.log('Session expired, attempting refresh and retry...');
        try {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          logger.log('Refresh result:', {
            hasSession: !!refreshData?.session,
            error: refreshError?.message,
          });
          if (refreshError || !refreshData.session) {
            logger.error('Session refresh failed:', refreshError);
            toast({
              title: "Session expired",
              description: "Please sign in again to continue.",
              variant: "destructive",
            });
            navigate("/auth");
            throw new Error("Session expired. Please sign in again.");
          }
          // Session refreshed - abort the old controller before retrying with new token
          logger.log('Session refreshed, retrying with new token...');
          abortController.abort();
          return streamResponse(messages, aquariumId, model, callbacks, refreshData.session.access_token, conversationHint, userAquariums);
        } catch (refreshErr) {
          // Re-throw our own errors, but catch unexpected refreshSession failures
          if (refreshErr instanceof Error && refreshErr.message.includes("Session expired")) {
            throw refreshErr;
          }
          logger.error('Unexpected error during session refresh:', refreshErr);
          toast({
            title: "Session expired",
            description: "Please sign in again to continue.",
            variant: "destructive",
          });
          navigate("/auth");
          throw new Error("Session expired. Please sign in again.");
        }
      }

      // If retry also failed with 401, user needs to fully re-authenticate
      if (response.status === 401 && retryToken) {
        logger.error('Retry with refreshed token still got 401 - forcing re-auth');
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
        logger.warn('Failed to parse error response:', response.status, response.statusText);
      }

      throw new Error(errorMessage);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;
    let hadError = false;

    // Reset state
    lastUpdateRef.current = Date.now();
    assistantMessageRef.current = "";
    setIsStreaming(true);
    callbacks.onStreamStart();

    // Update function - sends tokens immediately for smooth typewriter
    // Content is raw markdown from SSE stream; react-markdown handles sanitization at render time
    const updateContent = (content: string) => {
      const now = Date.now();
      assistantMessageRef.current += content;
      // Throttle updates to ~60fps to avoid excessive re-renders
      if (now - lastUpdateRef.current >= UPDATE_INTERVAL) {
        lastUpdateRef.current = now;
        callbacks.onToken(assistantMessageRef.current);
      } else {
        // Schedule a render for buffered tokens so final tokens don't visually jump
        requestAnimationFrame(() => {
          callbacks.onToken(assistantMessageRef.current);
        });
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

          // Handle data card events
          if (parsed.type === 'data_card' && parsed.card) {
            callbacks.onDataCard?.(parsed.card as DataCardPayload);
            continue;
          }

          // Check for error responses from the server
          if (parsed.error) {
            logger.warn('Stream returned error payload:', parsed.error);
            logMonitoringEvent(
              'chat_stream_payload_error',
              'error',
              FeatureArea.CHAT,
              { model }
            );
            hadError = true;
            callbacks.onError(new Error(typeof parsed.error === 'string' ? parsed.error : parsed.error.message || 'Server error'));
            streamDone = true;
            break;
          }

          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            updateContent(content);
          }
        } catch {
          // Lines extracted from the inner loop are always newline-delimited (complete).
          // If JSON.parse fails, the line is genuinely malformed — skip it.
          logger.warn('Skipping malformed SSE line:', jsonStr.substring(0, 100));
          continue;
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
    // Don't call onStreamEnd if onError already fired — prevents double handling
    // (partial conversation save, false success haptic, TTS of error content)
    if (!hadError) {
      callbacks.onStreamEnd(finalContent);
    }

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

  // Cleanup on unmount: abort any in-flight stream and clear timeout
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, []);

  return {
    isStreaming,
    streamResponse,
    abort,
  };
}
