import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Send, 
  Loader2, 
  Sparkles, 
  Plus, 
  History, 
  Copy, 
  Check,
  MoreVertical,
  Trash2,
  MessageSquare,
  Fish
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TypingIndicator } from "@/components/TypingIndicator";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

interface Aquarium {
  id: string;
  name: string;
  type: string;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  aquarium_id: string | null;
}

const AllyChat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aquariums, setAquariums] = useState<Aquarium[]>([]);
  const [selectedAquarium, setSelectedAquarium] = useState<string>("general");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);
    await fetchAquariums();
    await fetchConversations();
    startNewConversation();
  };

  const fetchAquariums = async () => {
    const { data } = await supabase
      .from('aquariums')
      .select('id, name, type')
      .order('created_at', { ascending: false });
    
    if (data) {
      setAquariums(data);
    }
  };

  const fetchConversations = async () => {
    const { data } = await supabase
      .from('chat_conversations')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (data) {
      setConversations(data);
    }
  };

  const loadConversation = async (conversationId: string) => {
    const { data: messagesData } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (messagesData) {
      setMessages(messagesData.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: new Date(msg.created_at)
      })));
      setCurrentConversationId(conversationId);
      
      // Update selected aquarium
      const conv = conversations.find(c => c.id === conversationId);
      if (conv) {
        setSelectedAquarium(conv.aquarium_id || "general");
      }
    }
  };

  const startNewConversation = async () => {
    setMessages([{
      role: "assistant",
      content: "Hi! I'm Ally, your aquarium assistant. I can help you with water parameters, fish care, equipment, and everything aquarium-related. What would you like to know?",
      timestamp: new Date()
    }]);
    setCurrentConversationId(null);
  };

  const deleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const { error } = await supabase
      .from('chat_conversations')
      .delete()
      .eq('id', conversationId);

    if (!error) {
      toast({
        title: "Success",
        description: "Conversation deleted",
      });
      await fetchConversations();
      if (currentConversationId === conversationId) {
        startNewConversation();
      }
    }
  };

  const saveConversation = async (userMessage: Message, assistantMessage: Message) => {
    if (!userId) return;

    let conversationId = currentConversationId;

    // Create new conversation if needed
    if (!conversationId) {
      const title = userMessage.content.slice(0, 50) + (userMessage.content.length > 50 ? "..." : "");
      const { data: newConv, error: convError } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: userId,
          aquarium_id: selectedAquarium === "general" ? null : selectedAquarium,
          title
        })
        .select()
        .single();

      if (convError || !newConv) return;
      
      conversationId = newConv.id;
      setCurrentConversationId(conversationId);
      await fetchConversations();
    }

    // Save messages
    await supabase
      .from('chat_messages')
      .insert([
        {
          conversation_id: conversationId,
          role: userMessage.role,
          content: userMessage.content
        },
        {
          conversation_id: conversationId,
          role: assistantMessage.role,
          content: assistantMessage.content
        }
      ]);

    // Update conversation timestamp
    await supabase
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { 
      role: "user", 
      content: input,
      timestamp: new Date()
    };
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

      setMessages((prev) => [...prev, { role: "assistant", content: "", timestamp: new Date() }]);

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
                  timestamp: new Date()
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

      // Save conversation
      const finalAssistantMessage = {
        role: "assistant" as const,
        content: assistantMessage,
        timestamp: new Date()
      };
      await saveConversation(userMessage, finalAssistantMessage);
      
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

  const copyMessage = async (content: string, index: number) => {
    await navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
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
    return aquarium ? `${aquarium.name}` : "General Advice";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8 pt-24 max-w-7xl">
        <div className="flex gap-4 h-[calc(100vh-12rem)]">
          {/* Desktop Sidebar */}
          <Card className="hidden lg:block w-80 shadow-lg">
            <div className="p-6 border-b bg-gradient-to-br from-primary/10 to-primary/5">
              <Button 
                onClick={startNewConversation} 
                className="w-full gap-2"
                size="lg"
              >
                <Plus className="h-4 w-4" />
                New Conversation
              </Button>
            </div>
            
            <ScrollArea className="h-[calc(100%-8rem)]">
              <div className="p-4 space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground px-2 mb-3">
                  Recent Conversations
                </h3>
                {conversations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No conversations yet
                  </p>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={cn(
                        "group relative flex items-center gap-2 p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors",
                        currentConversationId === conv.id && "bg-accent"
                      )}
                      onClick={() => loadConversation(conv.id)}
                    >
                      <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{conv.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(conv.updated_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 h-8 w-8"
                        onClick={(e) => deleteConversation(conv.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>

          {/* Main Chat Area */}
          <Card className="flex-1 shadow-lg flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary via-primary to-primary/90 p-6 border-b flex-shrink-0">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Mobile History Button */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="lg:hidden text-primary-foreground hover:bg-primary-foreground/10 flex-shrink-0"
                      >
                        <History className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80">
                      <SheetHeader>
                        <SheetTitle>Chat History</SheetTitle>
                      </SheetHeader>
                      <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
                        <div className="space-y-2">
                          <Button 
                            onClick={startNewConversation} 
                            className="w-full gap-2 mb-4"
                          >
                            <Plus className="h-4 w-4" />
                            New Conversation
                          </Button>
                          {conversations.map((conv) => (
                            <div
                              key={conv.id}
                              className={cn(
                                "group relative flex items-center gap-2 p-3 rounded-lg cursor-pointer hover:bg-accent",
                                currentConversationId === conv.id && "bg-accent"
                              )}
                              onClick={() => loadConversation(conv.id)}
                            >
                              <MessageSquare className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{conv.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(conv.updated_at), "MMM d, h:mm a")}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 h-8 w-8"
                                onClick={(e) => deleteConversation(conv.id, e)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </SheetContent>
                  </Sheet>

                  <div className="h-12 w-12 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-bold text-primary-foreground truncate">Chat with Ally</h1>
                    <p className="text-sm text-primary-foreground/80 truncate">Your AI Aquarium Expert</p>
                  </div>
                </div>
                
                {/* Aquarium Selector */}
                {aquariums.length > 0 && (
                  <Select value={selectedAquarium} onValueChange={setSelectedAquarium}>
                    <SelectTrigger className="w-[200px] bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 hidden sm:flex">
                      <Fish className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Select aquarium" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">
                        <span className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          General Advice
                        </span>
                      </SelectItem>
                      {aquariums.map((aq) => (
                        <SelectItem key={aq.id} value={aq.id}>
                          <span className="flex items-center gap-2">
                            <Fish className="h-4 w-4" />
                            {aq.name} ({aq.type})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              {/* Mobile aquarium display */}
              {aquariums.length > 0 && (
                <div className="mt-3 sm:hidden">
                  <p className="text-xs text-primary-foreground/70 mb-1">Current context:</p>
                  <div className="text-sm text-primary-foreground bg-primary-foreground/10 px-3 py-2 rounded flex items-center gap-2">
                    <Fish className="h-4 w-4" />
                    {getSelectedAquariumName()}
                  </div>
                </div>
              )}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6 max-w-3xl mx-auto">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-3 group animate-fade-in",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    
                    <div className={cn(
                      "flex-1 max-w-[80%] space-y-2",
                      message.role === "user" && "flex flex-col items-end"
                    )}>
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-3 relative",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted border"
                        )}
                      >
                        {message.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        )}
                        
                        {message.role === "assistant" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -right-10 top-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                            onClick={() => copyMessage(message.content, index)}
                          >
                            {copiedIndex === index ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                      
                      {message.timestamp && (
                        <p className={cn(
                          "text-xs text-muted-foreground px-2",
                          message.role === "user" && "text-right"
                        )}>
                          {format(message.timestamp, "h:mm a")}
                        </p>
                      )}
                    </div>
                    
                    {message.role === "user" && (
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary-foreground">You</span>
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && messages[messages.length - 1]?.content === "" && (
                  <div className="flex gap-3 animate-fade-in">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-2xl px-4 py-3 border">
                      <TypingIndicator />
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Quick Questions */}
            {messages.length <= 2 && !isLoading && (
              <div className="px-6 pb-4 flex flex-wrap gap-2 max-w-3xl mx-auto w-full">
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    onClick={() => {
                      setInput(question);
                      setTimeout(() => sendMessage(), 100);
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs hover-scale"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-6 border-t bg-muted/30 flex-shrink-0">
              <div className="max-w-3xl mx-auto">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask Ally anything about your aquarium..."
                    disabled={isLoading}
                    className="flex-1 h-12"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className="h-12 w-12"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AllyChat;