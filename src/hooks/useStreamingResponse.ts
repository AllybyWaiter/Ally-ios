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

const UPDATE_INTERVAL = 30; // ms between state updates

export function useStreamingResponse() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Token batching refs for smoother streaming
  const tokenBufferRef = useRef<string>("");
  const lastUpdateRef = useRef<number>(0);
  const assistantMessageRef = useRef<string>("");

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
    });

    if (!response.ok || !response.body) {
      throw new Error("Failed to get response");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    // Reset token batching
    tokenBufferRef.current = "";
    lastUpdateRef.current = Date.now();
    assistantMessageRef.current = "";
    setIsStreaming(true);
    callbacks.onStreamStart();

    // Batched update function
    const flushTokenBuffer = (forceFlush = false) => {
      const now = Date.now();
      if (forceFlush || now - lastUpdateRef.current >= UPDATE_INTERVAL) {
        if (tokenBufferRef.current) {
          assistantMessageRef.current += tokenBufferRef.current;
          tokenBufferRef.current = "";
          lastUpdateRef.current = now;
          callbacks.onToken(assistantMessageRef.current);
        }
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
            tokenBufferRef.current += content;
            flushTokenBuffer();
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush to ensure all tokens are rendered
    flushTokenBuffer(true);
    setIsStreaming(false);
    
    const finalContent = assistantMessageRef.current;
    callbacks.onStreamEnd(finalContent);
    
    return finalContent;
  }, [navigate, toast]);

  return {
    isStreaming,
    streamResponse,
  };
}
