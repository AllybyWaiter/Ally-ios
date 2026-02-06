import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Loader2, Mail, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { SupportEmailDialog } from "./SupportEmailDialog";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// Generate unique message ID
let messageIdCounter = 0;
const generateMessageId = () => `msg-${Date.now()}-${++messageIdCounter}`;

const AllySupportChat = () => {
  const { userName } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Set initial greeting based on user name
  useEffect(() => {
    const greeting = userName
      ? `Hi ${userName}! I'm Ally Support. How can I help you today?`
      : "Hi! I'm Ally Support. How can I help you learn about our aquarium management platform today?";

    setMessages([{
      id: generateMessageId(),
      role: "assistant",
      content: greeting,
    }]);
  }, [userName]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Shared streaming response handler
  const processStreamResponse = useCallback(async (userMessage: Message, currentMessages: Message[]) => {
    setIsLoading(true);
    const assistantMsgId = generateMessageId();
    setMessages(prev => [...prev, userMessage, { id: assistantMsgId, role: "assistant", content: "" }]);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-support`;

      // Support chat is public-facing, no auth required
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...currentMessages, userMessage],
          userName: userName || undefined
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to get response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let textBuffer = "";
      let streamDone = false;

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
              assistantMessage += content;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                newMessages[newMessages.length - 1] = {
                  ...lastMsg,
                  role: "assistant",
                  content: assistantMessage,
                };
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (const raw of textBuffer.split("\n")) {
          if (!raw || raw.startsWith(":") || !raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantMessage += content;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                newMessages[newMessages.length - 1] = {
                  ...lastMsg,
                  role: "assistant",
                  content: assistantMessage,
                };
                return newMessages;
              });
            }
          } catch {
            // Ignore parsing errors in final flush
          }
        }
      }
    } catch {
      // Remove the empty assistant message and show error
      setError("Failed to get response. Please try again.");
      setMessages(prev => [
        ...prev.slice(0, -1),
        {
          id: generateMessageId(),
          role: "assistant",
          content: "Sorry, I'm having trouble connecting right now. Please try again or use our contact form.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [userName]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    setError(null); // Clear any previous error
    const userMessage: Message = { id: generateMessageId(), role: "user", content: input };
    const currentMessages = [...messages];
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    await processStreamResponse(userMessage, currentMessages);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Memoize quick replies to avoid recreating on every render
  const quickReplies = useMemo(() => [
    "What is Ally?",
    "How does water testing work?",
    "What features are included?",
    "Is there a mobile app?",
  ], []);

  const handleQuickReply = useCallback((reply: string) => {
    if (isLoading) return;

    const userMessage: Message = { id: generateMessageId(), role: "user", content: reply };
    const currentMessages = [...messages];
    setInput("");

    processStreamResponse(userMessage, currentMessages);
  }, [messages, isLoading, processStreamResponse]);

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-[380px] h-[600px] flex flex-col shadow-2xl z-50 border-border">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-primary">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary-foreground" />
              <h3 className="font-semibold text-primary-foreground">Ally Support</h3>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.content === "" && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 2 && !isLoading && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {quickReplies.map((reply) => (
                <Button
                  key={reply}
                  onClick={() => handleQuickReply(reply)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  {reply}
                </Button>
              ))}
            </div>
          )}

          {/* Error retry banner */}
          {error && !isLoading && (
            <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="h-7 gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Dismiss
              </Button>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border bg-background">
            <div className="flex gap-2 mb-2">
              <Button
                onClick={() => setShowEmailDialog(true)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Mail className="h-3 w-3 mr-1" />
                Email Support
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
      
      <SupportEmailDialog 
        open={showEmailDialog} 
        onOpenChange={setShowEmailDialog}
      />
    </>
  );
};

export default AllySupportChat;
