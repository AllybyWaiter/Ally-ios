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
const MAX_STREAM_RETRY_ATTEMPTS = 2;
const STREAM_RETRY_BASE_MS = 600;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelayMs(attempt: number): number {
  return Math.min(STREAM_RETRY_BASE_MS * (2 ** Math.max(0, attempt - 1)) + Math.floor(Math.random() * 200), 4000);
}

function isRecoverableTransportError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('timeout') ||
    msg.includes('network') ||
    msg.includes('failed to fetch') ||
    msg.includes('fetch') ||
    msg.includes('abort') ||
    msg.includes('truncated')
  );
}

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
    retryToken?: string,
    conversationHint?: string | null,
    userAquariums?: Array<{ id: string; name: string; type: string }>
  ): Promise<string> => {
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
    const requestId = ++currentRequestIdRef.current;

    abortControllerRef.current?.abort();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const filteredMessages = messages.filter((msg, index) => {
      if (index === 0 && msg.role === 'assistant' && msg.content.includes("I'm Ally")) {
        return false;
      }
      return true;
    });

    const formattedMessages = filteredMessages.map((msg) => {
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

    const updateContent = (content: string) => {
      const now = Date.now();
      assistantMessageRef.current += content;
      if (now - lastUpdateRef.current >= UPDATE_INTERVAL) {
        lastUpdateRef.current = now;
        callbacks.onToken(assistantMessageRef.current);
      } else {
        requestAnimationFrame(() => {
          callbacks.onToken(assistantMessageRef.current);
        });
      }
    };

    const maxAttempts = MAX_STREAM_RETRY_ATTEMPTS + 1;
    let hasStartedStream = false;
    let lastFailure: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      let timeoutTriggered = false;
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        if (currentRequestIdRef.current === requestId) {
          timeoutTriggered = true;
          abortController.abort();
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
            model,
            ...(conversationHint ? { conversationHint } : {}),
            ...(!aquariumId && userAquariums && userAquariums.length > 0 ? { userAquariums } : {}),
          }),
          signal: abortController.signal,
        });
      } catch (error) {
        const durationMs = performance.now() - requestStartedAt;
        const finalError = timeoutTriggered
          ? new Error('Request timed out after 60 seconds')
          : error instanceof Error
            ? error
            : new Error('Network error');

        logApiFailure(
          {
            endpoint: 'ally-chat',
            method: 'POST',
            durationMs,
            statusCode: timeoutTriggered ? 408 : undefined,
            operation: 'chat_stream',
            reason: finalError.message,
            retryAttempt: attempt + 1,
          },
          FeatureArea.CHAT
        );

        if (attempt < maxAttempts - 1 && isRecoverableTransportError(finalError)) {
          const delayMs = getRetryDelayMs(attempt + 1);
          logMonitoringEvent('chat_stream_retry', 'warning', FeatureArea.CHAT, {
            reason: finalError.message,
            retry_attempt: attempt + 1,
            delay_ms: delayMs,
            model,
          });
          await wait(delayMs);
          continue;
        }

        lastFailure = finalError;
        break;
      }

      const responseLatencyMs = performance.now() - requestStartedAt;
      logSlowOperation(
        'ally-chat_response_headers',
        responseLatencyMs,
        4000,
        FeatureArea.CHAT,
        { model, retry_attempt: attempt + 1 }
      );

      if (currentRequestIdRef.current !== requestId) {
        return "";
      }

      if (!response.ok || !response.body) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        logApiFailure(
          {
            endpoint: 'ally-chat',
            method: 'POST',
            statusCode: response.status,
            durationMs: responseLatencyMs,
            operation: 'chat_stream',
            reason: !response.body ? 'missing_response_body' : 'http_error',
            retryAttempt: attempt + 1,
          },
          FeatureArea.CHAT
        );

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
            abortController.abort();
            return streamResponse(messages, aquariumId, model, callbacks, refreshData.session.access_token, conversationHint, userAquariums);
          } catch (refreshErr) {
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

        let errorMessage = `Failed to get response (${response.status})`;
        try {
          const errorData = await response.json();
          if (response.status === 429) {
            errorMessage = errorData.error || "Rate limit exceeded. Please wait a moment and try again.";
          } else if (response.status === 402) {
            errorMessage = errorData.error || "AI service temporarily unavailable. Please try again later.";
          } else if (response.status === 502 || response.status === 503 || response.status === 504) {
            errorMessage = errorData.error || "AI service is temporarily unavailable. Please try again.";
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          logger.warn('Failed to parse error response:', response.status, response.statusText);
        }

        const httpError = new Error(errorMessage);
        lastFailure = httpError;
        break;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;
      let hadError = false;
      let sawDoneMarker = false;
      let sawFinishReason = false;

      lastUpdateRef.current = Date.now();
      assistantMessageRef.current = "";
      setIsStreaming(true);

      if (!hasStartedStream) {
        hasStartedStream = true;
        callbacks.onStreamStart();
      } else {
        callbacks.onToken("");
      }

      try {
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
              sawDoneMarker = true;
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);

              if (parsed.type === 'meta') {
                if (parsed.requestId || parsed.model) {
                  logMonitoringEvent('chat_stream_meta', 'info', FeatureArea.CHAT, {
                    request_id: String(parsed.requestId || ''),
                    model: String(parsed.model || model),
                    upstream_retried: Boolean(parsed.degraded?.upstreamRetried),
                  });
                }
                continue;
              }

              if (parsed.type === 'tool_executions' && parsed.executions) {
                callbacks.onToolExecution?.(parsed.executions as ToolExecution[]);
                continue;
              }

              if (parsed.type === 'data_card' && parsed.card) {
                callbacks.onDataCard?.(parsed.card as DataCardPayload);
                continue;
              }

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

              const finishReason = parsed.choices?.[0]?.finish_reason as string | null | undefined;
              if (typeof finishReason === 'string' && finishReason.length > 0) {
                sawFinishReason = true;
              }

              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                updateContent(content);
              }
            } catch {
              logger.warn('Skipping malformed SSE line:', jsonStr.substring(0, 100));
              continue;
            }
          }
        }
      } catch (error) {
        const streamError = error instanceof Error ? error : new Error('Stream read error');
        if (attempt < maxAttempts - 1 && isRecoverableTransportError(streamError)) {
          const delayMs = getRetryDelayMs(attempt + 1);
          logMonitoringEvent('chat_stream_retry', 'warning', FeatureArea.CHAT, {
            reason: streamError.message,
            retry_attempt: attempt + 1,
            delay_ms: delayMs,
            model,
          });
          await wait(delayMs);
          continue;
        }

        lastFailure = streamError;
        break;
      } finally {
        if (typeof reader.releaseLock === 'function') {
          reader.releaseLock();
        }
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (!hadError && !sawDoneMarker) {
        const truncatedError = new Error('Stream truncated before completion');
        logMonitoringEvent('chat_stream_truncated', 'warning', FeatureArea.CHAT, {
          model,
          retry_attempt: attempt + 1,
          finish_reason_seen: sawFinishReason,
        });

        if (attempt < maxAttempts - 1) {
          const delayMs = getRetryDelayMs(attempt + 1);
          logMonitoringEvent('chat_stream_retry', 'warning', FeatureArea.CHAT, {
            reason: 'truncated_stream',
            retry_attempt: attempt + 1,
            delay_ms: delayMs,
            model,
          });
          await wait(delayMs);
          continue;
        }

        lastFailure = truncatedError;
        break;
      }

      callbacks.onToken(assistantMessageRef.current);
      setIsStreaming(false);

      const finalContent = assistantMessageRef.current;
      if (!hadError) {
        callbacks.onStreamEnd(finalContent);
      }
      return finalContent;
    }

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsStreaming(false);
    const finalError = lastFailure ?? new Error('Failed to complete stream');
    callbacks.onError(finalError);
    throw finalError;
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
