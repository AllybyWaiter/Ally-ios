import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Send, 
  Loader2, 
  Sparkles, 
  Plus, 
  History, 
  Fish,
  ArrowLeft,
  Camera,
  X,
  Mic,
  Square
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VirtualizedConversationList } from "@/components/chat/VirtualizedConversationList";
import { VirtualizedMessageList } from "@/components/chat/VirtualizedMessageList";
import { useStreamingResponse } from "@/hooks/useStreamingResponse";
import { useConversationManager } from "@/hooks/useConversationManager";
import { compressImage, validateImageFile } from "@/lib/imageCompression";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { useTTS } from "@/hooks/useTTS";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  id?: string;
  aquariumContext?: string | null;
  aquariumName?: string;
  imageUrl?: string;
}

const quickQuestions = [
  "What are ideal water parameters?",
  "Help with cloudy water",
  "Fish compatibility check",
  "Equipment recommendations",
];

const AllyChat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");
  const [pendingPhoto, setPendingPhoto] = useState<{ file: File; preview: string } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isStreaming, streamResponse } = useStreamingResponse();
  const conversationManager = useConversationManager(userId);
  const { isRecording, isProcessing, startRecording, stopRecording } = useVoiceRecording();
  const { isSpeaking, isGenerating: isGeneratingTTS, speakingMessageId, speak, stop: stopSpeaking } = useTTS();

  const handleMicClick = async () => {
    if (isRecording) {
      const text = await stopRecording();
      if (text) {
        setInput(prev => prev ? `${prev} ${text}` : text);
      }
    } else {
      await startRecording();
    }
  };

  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);
    await conversationManager.fetchAquariums();
    await conversationManager.fetchConversations();
    setMessages(conversationManager.startNewConversation());
  };

  const handleLoadConversation = useCallback(async (id: string) => {
    const loadedMessages = await conversationManager.loadConversation(id);
    setMessages(loadedMessages);
  }, [conversationManager]);

  const handleStartNewConversation = useCallback(() => {
    setMessages(conversationManager.startNewConversation());
  }, [conversationManager]);

  const handleDeleteConversation = useCallback(async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const shouldReset = await conversationManager.deleteConversation(conversationId);
    if (shouldReset) {
      setMessages(conversationManager.startNewConversation());
    }
  }, [conversationManager]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file, 10); // 10MB max before compression
    if (!validation.isValid) {
      toast({
        title: "Invalid image",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setIsCompressing(true);
    try {
      const compressedFile = await compressImage(file, 1, 1920, 0.8);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPendingPhoto({
          file: compressedFile,
          preview: reader.result as string,
        });
        setIsCompressing(false);
      };
      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to process image",
          variant: "destructive",
        });
        setIsCompressing(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Compression error:", error);
      toast({
        title: "Error",
        description: "Failed to compress image",
        variant: "destructive",
      });
      setIsCompressing(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePendingPhoto = () => {
    setPendingPhoto(null);
  };

  const sendMessage = async () => {
    if ((!input.trim() && !pendingPhoto) || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input || (pendingPhoto ? "Please analyze this photo" : ""),
      timestamp: new Date(),
      imageUrl: pendingPhoto?.preview,
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setPendingPhoto(null);
    setIsLoading(true);

    const currentAquariumName = conversationManager.getSelectedAquariumName();
    const currentAquariumContext = conversationManager.selectedAquarium;

    try {
      const fullContent = await streamResponse(
        [...messages, userMessage],
        conversationManager.getAquariumIdForApi(),
        {
          onStreamStart: () => {
            setMessages(prev => [...prev, {
              role: "assistant",
              content: "",
              timestamp: new Date(),
              aquariumContext: currentAquariumContext,
              aquariumName: currentAquariumName
            }]);
          },
          onToken: (content) => {
            setMessages(prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = {
                role: "assistant",
                content,
                timestamp: new Date(),
                aquariumContext: currentAquariumContext,
                aquariumName: currentAquariumName
              };
              return newMessages;
            });
          },
          onStreamEnd: async (content) => {
            const finalAssistantMessage = {
              role: "assistant" as const,
              content,
              timestamp: new Date()
            };
            await conversationManager.saveConversation(userMessage, finalAssistantMessage);
          },
          onError: (error) => {
            console.error("Stream error:", error);
          }
        }
      );
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setMessages(prev => prev.slice(0, -1));
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

  const copyMessage = useCallback(async (content: string, index: number) => {
    await navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  const startEditMessage = useCallback((index: number, content: string) => {
    setEditingIndex(index);
    setEditingContent(content);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingIndex(null);
    setEditingContent("");
  }, []);

  const saveEdit = useCallback(async () => {
    if (editingIndex === null || !editingContent.trim()) return;

    const updatedMessages = [...messages];
    const messageToEdit = updatedMessages[editingIndex];

    if (!messageToEdit || messageToEdit.role !== "user") return;

    // Update local state
    messageToEdit.content = editingContent.trim();

    // Remove all messages after the edited one
    const newMessages = updatedMessages.slice(0, editingIndex + 1);
    setMessages(newMessages);

    // Update in database
    await conversationManager.updateMessageInDb(editingIndex, editingContent.trim());

    // Clear editing state
    setEditingIndex(null);
    setEditingContent("");

    // Regenerate assistant response
    setIsLoading(true);

    const currentAquariumName = conversationManager.getSelectedAquariumName();
    const currentAquariumContext = conversationManager.selectedAquarium;

    try {
      await streamResponse(
        newMessages,
        conversationManager.getAquariumIdForApi(),
        {
          onStreamStart: () => {
            setMessages(prev => [...prev, {
              role: "assistant",
              content: "",
              timestamp: new Date()
            }]);
          },
          onToken: (content) => {
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content
              };
              return updated;
            });
          },
          onStreamEnd: async (content) => {
            if (conversationManager.currentConversationId) {
              await conversationManager.saveAssistantMessage(content);
            } else {
              const lastUserMessage = newMessages[newMessages.length - 1];
              await conversationManager.saveConversation(
                lastUserMessage,
                { role: "assistant", content, timestamp: new Date() }
              );
              await conversationManager.fetchConversations();
            }
          },
          onError: (error) => {
            console.error("Regeneration error:", error);
          }
        }
      );
    } catch (error) {
      console.error("Error regenerating response:", error);
      toast({
        title: "Error",
        description: "Failed to regenerate response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [editingIndex, editingContent, messages, conversationManager, streamResponse, toast]);

  const handleRegenerateResponse = useCallback((index: number) => {
    // Find the user message and regenerate from there
    if (messages[index]?.role === "user") {
      startEditMessage(index, messages[index].content);
      // Then immediately save to trigger regeneration
      setTimeout(() => saveEdit(), 0);
    }
  }, [messages, startEditMessage, saveEdit]);

  return (
    <TooltipProvider>
      <div className="h-[100dvh] flex flex-col bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
        <div className="hidden lg:block">
          <AppHeader />
        </div>

        <main className="flex-1 lg:container lg:mx-auto lg:px-4 lg:py-8 lg:pt-28 lg:max-w-7xl overflow-hidden">
          <div className="flex gap-4 h-full lg:h-[calc(100vh-12rem)]">
            {/* Desktop Sidebar */}
            <Card className="hidden lg:block w-80 shadow-lg">
              <div className="p-6 border-b bg-gradient-to-br from-primary/10 to-primary/5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleStartNewConversation}
                      className="w-full gap-2"
                      size="lg"
                    >
                      <Plus className="h-4 w-4" />
                      New Conversation
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Start a fresh conversation with Ally</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="h-[calc(100%-8rem)] p-4">
                <h3 className="text-sm font-semibold text-muted-foreground px-2 mb-3">
                  Recent Conversations
                </h3>
                <VirtualizedConversationList
                  conversations={conversationManager.conversations}
                  currentConversationId={conversationManager.currentConversationId}
                  onLoadConversation={handleLoadConversation}
                  onDeleteConversation={handleDeleteConversation}
                />
              </div>
            </Card>

            {/* Main Chat Area */}
            <Card className="flex-1 shadow-lg flex flex-col rounded-none lg:rounded-lg border-0 lg:border">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary via-primary to-primary/90 p-3 lg:p-6 pt-safe border-b flex-shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Mobile Back Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden text-primary-foreground hover:bg-primary-foreground/10 flex-shrink-0"
                      onClick={() => navigate('/dashboard')}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>

                    {/* Mobile History Button */}
                    <Sheet>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SheetTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="lg:hidden text-primary-foreground hover:bg-primary-foreground/10 flex-shrink-0"
                            >
                              <History className="h-5 w-5" />
                            </Button>
                          </SheetTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View chat history</p>
                        </TooltipContent>
                      </Tooltip>
                      <SheetContent side="left" className="w-80">
                        <SheetHeader>
                          <SheetTitle>Chat History</SheetTitle>
                        </SheetHeader>
                        <div className="h-[calc(100vh-10rem)] mt-6">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={handleStartNewConversation}
                                className="w-full gap-2 mb-4"
                              >
                                <Plus className="h-4 w-4" />
                                New Conversation
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Start a fresh conversation with Ally</p>
                            </TooltipContent>
                          </Tooltip>
                          <VirtualizedConversationList
                            conversations={conversationManager.conversations}
                            currentConversationId={conversationManager.currentConversationId}
                            onLoadConversation={handleLoadConversation}
                            onDeleteConversation={handleDeleteConversation}
                          />
                        </div>
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
                  {conversationManager.aquariums.length > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Select
                            value={conversationManager.selectedAquarium}
                            onValueChange={conversationManager.setSelectedAquarium}
                          >
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
                              {conversationManager.aquariums.map((aq) => (
                                <SelectItem key={aq.id} value={aq.id}>
                                  <span className="flex items-center gap-2">
                                    <Fish className="h-4 w-4" />
                                    {aq.name} ({aq.type})
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Get advice specific to your aquarium</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {/* Mobile aquarium selector */}
                {conversationManager.aquariums.length > 0 && (
                  <div className="mt-3 sm:hidden">
                    <p className="text-xs text-primary-foreground/70 mb-1">Current context:</p>
                    <Select
                      value={conversationManager.selectedAquarium}
                      onValueChange={conversationManager.setSelectedAquarium}
                    >
                      <SelectTrigger className="w-full bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20">
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
                        {conversationManager.aquariums.map((aq) => (
                          <SelectItem key={aq.id} value={aq.id}>
                            <span className="flex items-center gap-2">
                              <Fish className="h-4 w-4" />
                              {aq.name} ({aq.type})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Messages - Using VirtualizedMessageList */}
              <div className="flex-1 overflow-hidden">
                <VirtualizedMessageList
                  messages={messages}
                  isLoading={isLoading}
                  isStreaming={isStreaming}
                  copiedIndex={copiedIndex}
                  editingIndex={editingIndex}
                  editingContent={editingContent}
                  onCopy={copyMessage}
                  onStartEdit={startEditMessage}
                  onCancelEdit={cancelEdit}
                  onSaveEdit={saveEdit}
                  onRegenerateResponse={handleRegenerateResponse}
                  onEditingContentChange={setEditingContent}
                  onSpeak={speak}
                  onStopSpeaking={stopSpeaking}
                  speakingMessageId={speakingMessageId}
                  isSpeaking={isSpeaking}
                  isGeneratingTTS={isGeneratingTTS}
                />
              </div>

              {/* Quick Questions */}
              {messages.length <= 2 && !isLoading && (
                <div className="px-4 lg:px-6 pb-3 lg:pb-4 flex flex-wrap gap-2 max-w-3xl mx-auto w-full flex-shrink-0">
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
              <div className="p-3 lg:p-6 border-t bg-muted/30 flex-shrink-0 pb-safe">
                <div className="max-w-3xl mx-auto space-y-2">
                  {/* Recording Status Indicator */}
                  {(isRecording || isProcessing) && (
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
                      isRecording 
                        ? "bg-destructive/10 text-destructive" 
                        : "bg-primary/10 text-primary"
                    )}>
                      {isRecording ? (
                        <>
                          <div className="h-2 w-2 rounded-full bg-destructive recording-pulse" />
                          Recording... Tap mic to stop
                        </>
                      ) : (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Transcribing...
                        </>
                      )}
                    </div>
                  )}

                  {/* Photo Preview */}
                  {pendingPhoto && (
                    <div className="relative inline-block">
                      <img
                        src={pendingPhoto.preview}
                        alt="Pending upload"
                        className="h-20 w-20 object-cover rounded-lg border border-border"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={removePendingPhoto}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex gap-2 items-end">
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handlePhotoSelect}
                    />
                    
                    {/* Photo button */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-12 w-12 flex-shrink-0"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isLoading || isCompressing || isRecording || isProcessing}
                        >
                          {isCompressing ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Camera className="h-5 w-5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Attach photo for analysis</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Microphone button */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isRecording ? "destructive" : "outline"}
                          size="icon"
                          className={cn(
                            "h-12 w-12 flex-shrink-0",
                            isRecording && "recording-pulse"
                          )}
                          onClick={handleMicClick}
                          disabled={isLoading || isProcessing}
                        >
                          {isProcessing ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : isRecording ? (
                            <Square className="h-5 w-5" />
                          ) : (
                            <Mic className="h-5 w-5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isRecording ? "Stop recording" : "Voice input"}</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={pendingPhoto ? "Add a message or send photo..." : "Ask Ally anything about your aquarium..."}
                      disabled={isLoading}
                      className="flex-1 min-h-[44px] max-h-[120px] lg:max-h-[200px] resize-none text-base"
                      rows={1}
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={sendMessage}
                          disabled={(!input.trim() && !pendingPhoto) || isLoading}
                          size="icon"
                          className="h-12 w-12"
                        >
                          {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Send className="h-5 w-5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Send message</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
};

export default AllyChat;
