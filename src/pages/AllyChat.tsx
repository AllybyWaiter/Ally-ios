import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MentionInput, parseMentions, type MentionItem, type MentionInputRef } from "@/components/chat/MentionInput";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Send, 
  Loader2, 
  Sparkles, 
  Plus, 
  History, 
  Fish,
  Camera,
  X,
  Mic,
  Square,
  ChevronDown,
  Lock,
  Brain,
  Zap,
  ArrowLeft,
  RotateCcw,
  StopCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ChatHistorySidebar } from "@/components/chat/ChatHistorySidebar";
import { VirtualizedMessageList } from "@/components/chat/VirtualizedMessageList";
import { ConversationStarters } from "@/components/chat/ConversationStarters";
import { useStreamingResponse, type ToolExecution } from "@/hooks/useStreamingResponse";
import { useConversationManager } from "@/hooks/useConversationManager";
import { useSuggestedQuestions } from "@/hooks/useSuggestedQuestions";
import { compressImage, validateImageFile } from "@/lib/imageCompression";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { useTTS } from "@/hooks/useTTS";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { copyToClipboard } from "@/lib/clipboard";
import { triggerHaptic } from "@/hooks/useHaptics";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  id?: string;
  aquariumContext?: string | null;
  aquariumName?: string;
  imageUrl?: string;
  toolExecutions?: ToolExecution[];
}

import { MODEL_OPTIONS, type ModelType, type ModelOption } from '@/lib/constants';

// Persist last conversation ID for session continuity (user-scoped)
const getLastConversationKey = (userId: string) => `ally_last_conversation_${userId}`;

const AllyChat = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [wasVoiceInput, setWasVoiceInput] = useState(false);
  const [autoSendPending, setAutoSendPending] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>('standard');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [lastError, setLastError] = useState<{ message: string; userMessage: Message } | null>(null);
  const [streamStartTime, setStreamStartTime] = useState<number | null>(null);
  const inputRef = useRef<MentionInputRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingToolExecutionsRef = useRef<ToolExecution[]>([]);

  const { isStreaming, streamResponse, abort } = useStreamingResponse();
  const conversationManager = useConversationManager(userId);

  // Convert aquariums to mention items (must be after conversationManager is declared)
  const mentionItems: MentionItem[] = conversationManager.aquariums.map(aq => ({
    id: aq.id,
    name: aq.name,
    type: "aquarium" as const,
    subtitle: `${aq.volume_gallons ? `${aq.volume_gallons} gal` : ''} ${aq.type || ''}`.trim(),
    icon: aq.type?.includes('pool') || aq.type?.includes('spa') ? 'waves' as const :
          aq.type?.includes('salt') || aq.type?.includes('reef') ? 'water' as const : 'fish' as const,
  }));
  const { isRecording, isProcessing, startRecording, stopRecording } = useVoiceRecording();
  const { isSpeaking, isGenerating: isGeneratingTTS, speakingMessageId, speak, stop: stopSpeaking } = useTTS();
  const { limits } = usePlanLimits();
  
  // Context-aware suggested questions
  const { suggestions, hasAlerts } = useSuggestedQuestions({
    selectedAquariumId: conversationManager.selectedAquarium === 'general' ? null : conversationManager.selectedAquarium,
    aquariums: conversationManager.aquariums,
    hasMessages: messages.length > 1,
  });

  const canUseThinking = limits.hasReasoningModel;

  const handleModelSelect = (modelId: ModelType) => {
    if (modelId === 'thinking' && !canUseThinking) {
      toast({
        title: "Gold membership required",
        description: "Upgrade to Gold to access Ally 1.0 Thinking with deep reasoning capabilities.",
      });
      return;
    }
    setSelectedModel(modelId);
  };

  const selectedModelOption = MODEL_OPTIONS.find(m => m.id === selectedModel) || MODEL_OPTIONS[0];

  const handleMicClick = async () => {
    if (isRecording) {
      const text = await stopRecording();
      if (text) {
        setInput(prev => prev ? `${prev} ${text}` : text);
        setWasVoiceInput(true);
        setAutoSendPending(true);
      }
    } else {
      await startRecording();
    }
  };

  useEffect(() => {
    if (autoSendPending && input.trim() && !isLoading) {
      setAutoSendPending(false);
      sendMessage();
    }
    // Deps: sendMessage is intentionally excluded to prevent re-running when it changes.
    // We only want to trigger send when autoSendPending becomes true with valid input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSendPending, input, isLoading]);

  // Cleanup auto-send pending state on unmount
  useEffect(() => {
    return () => {
      setAutoSendPending(false);
    };
  }, []);

  // Deps: initializeChat contains navigation and state setup that should only run once on mount.
  // Adding it as a dependency would cause infinite loops as it updates state it depends on.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    initializeChat();
  }, []);

  // Handle prefilled messages from navigation (e.g., "Ask Ally" from alerts)
  useEffect(() => {
    const state = location.state as { prefillMessage?: string; context?: Record<string, unknown> } | null;
    if (state?.prefillMessage && !input) {
      setInput(state.prefillMessage);
      // Clear the state so it doesn't persist on refresh
      window.history.replaceState({}, document.title);
      // Auto-send after a brief delay
      setTimeout(() => setAutoSendPending(true), 300);
    }
  }, [location.state, input]);

  const initializeChat = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);
    await conversationManager.fetchAquariums();
    await conversationManager.fetchConversations();
    
    // Restore last conversation if available
    const lastConvoId = localStorage.getItem(getLastConversationKey(user.id));
    if (lastConvoId && conversationManager.conversations.some(c => c.id === lastConvoId)) {
      const loadedMessages = await conversationManager.loadConversation(lastConvoId);
      if (loadedMessages && loadedMessages.length > 0) {
        setMessages(loadedMessages);
      } else {
        setMessages(conversationManager.startNewConversation());
      }
    } else {
      setMessages(conversationManager.startNewConversation());
    }
  };

  const handleLoadConversation = useCallback(async (id: string) => {
    const loadedMessages = await conversationManager.loadConversation(id);
    setMessages(loadedMessages);
    // Persist for session continuity
    if (userId) {
      localStorage.setItem(getLastConversationKey(userId), id);
    }
  }, [conversationManager, userId]);

  const handleStartNewConversation = useCallback(() => {
    setMessages(conversationManager.startNewConversation());
    setLastError(null);
    if (userId) {
      localStorage.removeItem(getLastConversationKey(userId));
    }
  }, [conversationManager, userId]);

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

    const validation = validateImageFile(file, 10);
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
      toast({
        title: "Error",
        description: "Failed to compress image",
        variant: "destructive",
      });
      setIsCompressing(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePendingPhoto = () => {
    setPendingPhoto(null);
  };

  // Stop generating handler
  const handleStopGenerating = useCallback(() => {
    abort();
    setIsLoading(false);
    setStreamStartTime(null);
    toast({
      title: "Stopped",
      description: "Response generation was stopped.",
    });
  }, [abort, toast]);

  // Retry last failed message
  const handleRetry = useCallback(async () => {
    if (!lastError) return;
    
    const userMessage = lastError.userMessage;
    setLastError(null);
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setStreamStartTime(Date.now());

    const currentAquariumName = conversationManager.getSelectedAquariumName();
    const currentAquariumContext = conversationManager.selectedAquarium;

    try {
      await streamResponse(
        [...messages, userMessage],
        conversationManager.getAquariumIdForApi(),
        selectedModel,
        {
          onStreamStart: () => {
            triggerHaptic('light'); // Haptic on first token
            pendingToolExecutionsRef.current = []; // Reset tool executions
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
                aquariumName: currentAquariumName,
                toolExecutions: pendingToolExecutionsRef.current.length > 0
                  ? [...pendingToolExecutionsRef.current]
                  : undefined
              };
              return newMessages;
            });
          },
          onStreamEnd: async (content) => {
            triggerHaptic('success'); // Haptic on completion
            setStreamStartTime(null);
            const finalAssistantMessage = {
              role: "assistant" as const,
              content,
              timestamp: new Date()
            };
            const savedId = await conversationManager.saveConversation(userMessage, finalAssistantMessage);
            if (savedId && userId) {
              localStorage.setItem(getLastConversationKey(userId), savedId);
            }
          },
          onError: (error) => {
            console.error("Stream error:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to get response";
            setLastError({ message: errorMessage, userMessage });
            toast({
              title: "Error",
              description: errorMessage,
              variant: "destructive",
            });
          },
          onToolExecution: (executions) => {
            pendingToolExecutionsRef.current = executions;
            triggerHaptic('light');
            setMessages(prev => {
              const newMessages = [...prev];
              if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
                newMessages[newMessages.length - 1] = {
                  ...newMessages[newMessages.length - 1],
                  toolExecutions: executions
                };
              }
              return newMessages;
            });
          }
        }
      );
    } catch (error) {
      console.error("Retry error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to send message";
      setLastError({ message: errorMessage, userMessage });
      setMessages(prev => prev.slice(0, -1));
      triggerHaptic('error');
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setStreamStartTime(null);
    }
  }, [lastError, messages, conversationManager, streamResponse, selectedModel, toast]);

  const sendMessage = async () => {
    if ((!input.trim() && !pendingPhoto) || isLoading) return;

    // Clear any previous error
    setLastError(null);

    // Parse @mentions to auto-select tank context
    const mentions = parseMentions(input);
    if (mentions.length > 0) {
      // Use the first mentioned tank as context
      const mentionedTank = mentionItems.find(item => item.id === mentions[0].id);
      if (mentionedTank) {
        conversationManager.setSelectedAquarium(mentionedTank.id);
      }
    }

    const userMessage: Message = {
      role: "user",
      content: input || (pendingPhoto ? "Please analyze this photo" : ""),
      timestamp: new Date(),
      imageUrl: pendingPhoto?.preview,
    };
    const shouldAutoPlay = wasVoiceInput;
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    // Reset input height after clearing
    inputRef.current?.resetHeight();
    setPendingPhoto(null);
    setWasVoiceInput(false);
    setIsLoading(true);
    setStreamStartTime(Date.now());

    const currentAquariumName = conversationManager.getSelectedAquariumName();
    const currentAquariumContext = conversationManager.selectedAquarium;

    try {
      const fullContent = await streamResponse(
        [...messages, userMessage],
        conversationManager.getAquariumIdForApi(),
        selectedModel,
        {
          onStreamStart: () => {
            triggerHaptic('light'); // Haptic on first token
            pendingToolExecutionsRef.current = []; // Reset tool executions
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
                aquariumName: currentAquariumName,
                toolExecutions: pendingToolExecutionsRef.current.length > 0
                  ? [...pendingToolExecutionsRef.current]
                  : undefined
              };
              return newMessages;
            });
          },
          onStreamEnd: async (content) => {
            triggerHaptic('success'); // Haptic on completion
            setStreamStartTime(null);
            const finalAssistantMessage = {
              role: "assistant" as const,
              content,
              timestamp: new Date()
            };
            const savedId = await conversationManager.saveConversation(userMessage, finalAssistantMessage);
            if (savedId && userId) {
              localStorage.setItem(getLastConversationKey(userId), savedId);
            }

            if (shouldAutoPlay && content) {
              const messageId = `auto-${Date.now()}`;
              speak(content, messageId);
            }
          },
          onError: (error) => {
            console.error("Stream error:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to get response";
            setLastError({ message: errorMessage, userMessage });
            toast({
              title: "Error",
              description: errorMessage,
              variant: "destructive",
            });
          },
          onToolExecution: (executions) => {
            // Store tool executions and update the current message
            pendingToolExecutionsRef.current = executions;
            triggerHaptic('light'); // Haptic feedback for tool execution
            setMessages(prev => {
              const newMessages = [...prev];
              if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
                newMessages[newMessages.length - 1] = {
                  ...newMessages[newMessages.length - 1],
                  toolExecutions: executions
                };
              }
              return newMessages;
            });
          }
        }
      );
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to send message";
      
      // Store error for retry
      setLastError({ message: errorMessage, userMessage });
      triggerHaptic('error');
      
      // Show specific toast for rate limits or payment issues
      if (errorMessage.includes("rate limit") || errorMessage.includes("Rate limit")) {
        toast({
          title: "Please slow down",
          description: "You're sending messages too quickly. Please wait a moment.",
        });
      } else if (errorMessage.includes("402") || errorMessage.includes("temporarily unavailable")) {
        toast({
          title: "Service temporarily unavailable",
          description: "Please try again later.",
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      setStreamStartTime(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyMessage = useCallback(async (content: string, index: number) => {
    const success = await copyToClipboard(content);
    if (success) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
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

    messageToEdit.content = editingContent.trim();

    const newMessages = updatedMessages.slice(0, editingIndex + 1);
    setMessages(newMessages);

    await conversationManager.updateMessageInDb(editingIndex, editingContent.trim());

    setEditingIndex(null);
    setEditingContent("");

    setIsLoading(true);

    const currentAquariumName = conversationManager.getSelectedAquariumName();
    const currentAquariumContext = conversationManager.selectedAquarium;

    try {
      await streamResponse(
        newMessages,
        conversationManager.getAquariumIdForApi(),
        selectedModel,
        {
          onStreamStart: () => {
            pendingToolExecutionsRef.current = [];
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
                content,
                toolExecutions: pendingToolExecutionsRef.current.length > 0
                  ? [...pendingToolExecutionsRef.current]
                  : undefined
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
            const errorMessage = error instanceof Error ? error.message : "Failed to regenerate response";
            toast({
              title: "Error",
              description: errorMessage,
              variant: "destructive",
            });
          },
          onToolExecution: (executions) => {
            pendingToolExecutionsRef.current = executions;
            setMessages(prev => {
              const updated = [...prev];
              if (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  toolExecutions: executions
                };
              }
              return updated;
            });
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
  }, [editingIndex, editingContent, messages, conversationManager, streamResponse, toast, selectedModel]);

  const handleRegenerateResponse = useCallback((index: number) => {
    if (messages[index]?.role === "user") {
      const messageContent = messages[index].content;
      startEditMessage(index, messageContent);
      // Use setTimeout with 0ms to ensure state updates are processed before saveEdit
      // This avoids the stale closure issue with requestAnimationFrame
      setTimeout(() => {
        // Trigger save by directly calling the edit flow
        saveEdit();
      }, 0);
    }
  }, [messages, startEditMessage, saveEdit]);

  return (
    <TooltipProvider>
      <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
        {/* Minimal Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-safe">
          {/* Left: Back + History */}
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Sheet open={historyOpen} onOpenChange={async (open) => {
              setHistoryOpen(open);
              if (open) {
                setIsLoadingConversations(true);
                await conversationManager.fetchConversations();
                setIsLoadingConversations(false);
              }
            }}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <History className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0 pt-safe" aria-describedby="chat-history-description">
                <VisuallyHidden>
                  <SheetTitle>Chat History</SheetTitle>
                  <SheetDescription id="chat-history-description">
                    Browse and manage your previous conversations
                  </SheetDescription>
                </VisuallyHidden>
                <ChatHistorySidebar
                  conversations={conversationManager.conversations}
                  currentConversationId={conversationManager.currentConversationId}
                  onLoadConversation={(id) => {
                    handleLoadConversation(id);
                    setHistoryOpen(false);
                  }}
                  onDeleteConversation={handleDeleteConversation}
                  onNewChat={() => {
                    handleStartNewConversation();
                    setHistoryOpen(false);
                  }}
                  onPinConversation={conversationManager.pinConversation}
                  onRenameConversation={conversationManager.renameConversation}
                  onBulkDelete={conversationManager.bulkDeleteConversations}
                  onExportConversation={conversationManager.exportConversation}
                  aquariums={conversationManager.aquariums}
                  isLoading={isLoadingConversations}
                />
              </SheetContent>
            </Sheet>
          </div>

          {/* Center: Model Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 font-medium">
                <selectedModelOption.icon className="h-4 w-4" />
                {selectedModelOption.name}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56">
              {MODEL_OPTIONS.map((model) => {
                const isLocked = model.requiresGold && !canUseThinking;
                return (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => handleModelSelect(model.id)}
                    className={cn(
                      "flex items-start gap-3 p-3 cursor-pointer",
                      selectedModel === model.id && "bg-accent"
                    )}
                  >
                    <model.icon className={cn(
                      "h-5 w-5 mt-0.5",
                      isLocked && "opacity-50"
                    )} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-medium",
                          isLocked && "opacity-50"
                        )}>
                          {model.name}
                        </span>
                        {isLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                        {model.requiresGold && (
                          <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">
                            Gold
                          </span>
                        )}
                      </div>
                      <p className={cn(
                        "text-xs text-muted-foreground",
                        isLocked && "opacity-50"
                      )}>
                        {model.description}
                      </p>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Right: New Chat */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={handleStartNewConversation}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </header>

        {/* Messages Area */}
        <main className="flex-1 overflow-hidden">
          <VirtualizedMessageList
            messages={messages}
            isLoading={isLoading}
            isStreaming={isStreaming}
            isThinking={isLoading && !isStreaming && selectedModel === 'thinking'}
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
            onSelectSuggestion={(template) => {
              setInput(template);
              inputRef.current?.focus();
            }}
            aquariumId={conversationManager.selectedAquarium === 'general' ? null : conversationManager.selectedAquarium}
          />
        </main>

        {/* Conversation Starters */}
        <AnimatePresence>
          {!messages.some(m => m.role === 'user') && !isLoading && (
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <ConversationStarters
                suggestions={suggestions}
                hasAquariums={conversationManager.aquariums.length > 0}
                hasAlerts={hasAlerts}
                onSelectQuestion={(question) => {
                  setInput(question);
                  setTimeout(() => sendMessage(), 100);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="border-t bg-background p-4 pb-safe">
          <div className="max-w-3xl mx-auto space-y-3">
            {/* Recording Status */}
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
                  alt="Photo to send"
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

            {/* Aquarium Context Chip + @ Hint */}
            {conversationManager.aquariums.length > 0 && (
              <div className="flex items-center gap-2">
                <Select
                  value={conversationManager.selectedAquarium}
                  onValueChange={conversationManager.setSelectedAquarium}
                >
                  <SelectTrigger className="w-fit h-8 text-xs gap-2 bg-muted/50 border-0">
                    <Fish className="h-3 w-3" />
                    <SelectValue placeholder="Context" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3" />
                        General Advice
                      </span>
                    </SelectItem>
                    {conversationManager.aquariums.map((aq) => (
                      <SelectItem key={aq.id} value={aq.id}>
                        <span className="flex items-center gap-2">
                          <Fish className="h-3 w-3" />
                          {aq.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">
                  or type <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">@</kbd>
                </span>
              </div>
            )}
            
            {/* Input Row */}
            <div className="flex gap-2 items-end">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoSelect}
              />
              
              <div className="flex-1 flex items-end gap-2 bg-muted/50 rounded-2xl p-2 pl-4">
                <MentionInput
                  ref={inputRef}
                  value={input}
                  onChange={(value) => {
                    setInput(value);
                    if (wasVoiceInput) setWasVoiceInput(false);
                  }}
                  onKeyDown={handleKeyPress}
                  placeholder="Message Ally... (type @ to mention a tank)"
                  disabled={isLoading}
                  mentionItems={mentionItems}
                  onMentionSelect={(item) => {
                    // Auto-select the mentioned tank as context
                    conversationManager.setSelectedAquarium(item.id);
                    triggerHaptic('light');
                  }}
                />
                
                {/* Inline Actions */}
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading || isCompressing || isRecording || isProcessing}
                      >
                        {isCompressing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Attach photo</p></TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isRecording ? "destructive" : "ghost"}
                        size="icon"
                        className={cn(
                          "h-8 w-8 rounded-full",
                          isRecording && "recording-pulse"
                        )}
                        onClick={handleMicClick}
                        disabled={isLoading || isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isRecording ? (
                          <Square className="h-4 w-4" />
                        ) : (
                          <Mic className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{isRecording ? "Stop" : "Voice"}</p></TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Send / Stop Button */}
              {isStreaming ? (
                <Button
                  onClick={handleStopGenerating}
                  size="icon"
                  variant="destructive"
                  className="h-10 w-10 rounded-full"
                >
                  <StopCircle className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={sendMessage}
                  disabled={(!input.trim() && !pendingPhoto) || isLoading}
                  size="icon"
                  className="h-10 w-10 rounded-full"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            
            {/* Retry Button on Error */}
            {lastError && !isLoading && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-sm">
                <span className="flex-1">{lastError.message}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRetry}
                  className="gap-1 h-7"
                >
                  <RotateCcw className="h-3 w-3" />
                  Retry
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default AllyChat;
