import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Send, Loader2, MessageSquare, Sparkles, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TypingIndicator } from "@/components/TypingIndicator";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Aquarium {
  id: string;
  name: string;
  type: string;
}

const AllyChat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm Ally, your aquarium assistant. I can help you with water parameters, fish care, equipment, and everything aquarium-related. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aquariums, setAquariums] = useState<Aquarium[]>([]);
  const [selectedAquarium, setSelectedAquarium] = useState<string>("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAquariums();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const fetchAquariums = async () => {
    const { data } = await supabase
      .from('aquariums')
      .select('id, name, type')
      .order('created_at', { ascending: false });
    
    if (data && data.length > 0) {
      setAquariums(data);
      setSelectedAquarium("general");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to chat with Ally",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ally-chat`;
      
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.data.session.access_token}`,
        },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          aquariumId: selectedAquarium === "general" ? null : selectedAquarium
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

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

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
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
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

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw || raw.startsWith(":") || !raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantMessage += content;
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantMessage,
                };
                return newMessages;
              });
            }
          } catch {}
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    "What are ideal water parameters?",
    "Help with cloudy water",
    "Fish compatibility check",
    "Equipment recommendations",
  ];

  const getSelectedAquariumName = () => {
    if (selectedAquarium === "general") return "General Advice";
    const aquarium = aquariums.find(aq => aq.id === selectedAquarium);
    return aquarium ? `${aquarium.name} (${aquarium.type})` : "General Advice";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
        <Card className="shadow-lg">
          {/* Header */}
          <div className="bg-gradient-primary p-6 border-b">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="h-12 w-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-primary-foreground">Chat with Ally</h1>
                  <p className="text-sm text-primary-foreground/80">Your AI Aquarium Expert</p>
                </div>
              </div>
              
              {/* Desktop Selector */}
              {aquariums.length > 0 && (
                <Select value={selectedAquarium} onValueChange={setSelectedAquarium}>
                  <SelectTrigger className="w-[200px] bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 hidden md:flex">
                    <SelectValue placeholder="Select aquarium" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Advice</SelectItem>
                    {aquariums.map((aq) => (
                      <SelectItem key={aq.id} value={aq.id}>
                        {aq.name} ({aq.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Mobile Drawer Trigger */}
              {aquariums.length > 0 && (
                <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                  <DrawerTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="md:hidden text-primary-foreground hover:bg-primary-foreground/10"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Select Aquarium</DrawerTitle>
                      <DrawerDescription>
                        Choose which aquarium you want to discuss with Ally
                      </DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 pb-4">
                      <div className="space-y-2">
                        <Button
                          variant={selectedAquarium === "general" ? "default" : "outline"}
                          className="w-full justify-start"
                          onClick={() => {
                            setSelectedAquarium("general");
                            setDrawerOpen(false);
                          }}
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          General Advice
                        </Button>
                        {aquariums.map((aq) => (
                          <Button
                            key={aq.id}
                            variant={selectedAquarium === aq.id ? "default" : "outline"}
                            className="w-full justify-start"
                            onClick={() => {
                              setSelectedAquarium(aq.id);
                              setDrawerOpen(false);
                            }}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            {aq.name} ({aq.type})
                          </Button>
                        ))}
                      </div>
                    </div>
                    <DrawerFooter>
                      <DrawerClose asChild>
                        <Button variant="outline">Close</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              )}
            </div>
            
            {/* Mobile: Show selected aquarium below header */}
            {aquariums.length > 0 && (
              <div className="mt-3 md:hidden">
                <p className="text-xs text-primary-foreground/70 mb-1">Current context:</p>
                <div className="text-sm text-primary-foreground bg-primary-foreground/10 px-3 py-2 rounded">
                  {getSelectedAquariumName()}
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-background">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-3",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground border"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.content === "" && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-3 border">
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 2 && !isLoading && (
            <div className="px-6 pb-4 flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <Button
                  key={index}
                  onClick={() => {
                    setInput(question);
                    setTimeout(() => sendMessage(), 100);
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  {question}
                </Button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-6 border-t bg-muted/30">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Ally anything about your aquarium..."
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
      </main>
    </div>
  );
};

export default AllyChat;
