import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MentionInput, parseMentions, type MentionItem, type MentionInputRef } from "@/components/chat/MentionInput";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
  ArrowLeft,
  RotateCcw,
  StopCircle,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ChatHistorySidebar } from "@/components/chat/ChatHistorySidebar";
import { VirtualizedMessageList } from "@/components/chat/VirtualizedMessageList";
import { ConversationStarters } from "@/components/chat/ConversationStarters";
import { useStreamingResponse, type ToolExecution, type DataCardPayload } from "@/hooks/useStreamingResponse";
import { useConversationManager } from "@/hooks/useConversationManager";
import { useSuggestedQuestions } from "@/hooks/useSuggestedQuestions";
import { compressImage, validateImageFile } from "@/lib/imageCompression";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { useTTS } from "@/hooks/useTTS";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useVAD } from "@/hooks/useVAD";
import { useWakeLock } from "@/hooks/useWakeLock";
import { playListeningChime, playConfirmationTone } from "@/lib/audioUtils";
import { copyToClipboard } from "@/lib/clipboard";
import { triggerHaptic } from "@/hooks/useHaptics";
import { logger } from "@/lib/logger";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  id?: string;
  aquariumContext?: string | null;
  aquariumName?: string;
  imageUrl?: string;
  toolExecutions?: ToolExecution[];
  dataCards?: DataCardPayload[];
}

import { MODEL_OPTIONS, type ModelType } from '@/lib/constants';

// Persist last conversation ID for session continuity (user-scoped)
const getLastConversationKey = (userId: string) => `ally_last_conversation_${userId}`;

function parseVoiceCommand(text: string): 'stop' | 'cancel' | 'repeat' | 'new_chat' | null {
  const n = text.toLowerCase().trim();
  if (/^(stop|exit|quit|end conversation|goodbye|bye)[.!,]?$/.test(n)) return 'stop';
  if (/^(cancel|never ?mind|forget it)[.!,]?$/.test(n)) return 'cancel';
  if (/^(repeat that|say that again|what did you say)[.!,]?$/.test(n)) return 'repeat';
  if (/^(new chat|start over|new conversation)[.!,]?$/.test(n)) return 'new_chat';
  return null;
}

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
  const [, setStreamStartTime] = useState<number | null>(null);
  const [conversationMode, setConversationMode] = useState(false);
  const inputRef = useRef<MentionInputRef>(null);
  const conversationModeRef = useRef(false);
  const isRecordingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingToolExecutionsRef = useRef<ToolExecution[]>([]);
  const pendingDataCardsRef = useRef<DataCardPayload[]>([]);
  const isSubmittingRef = useRef(false); // Prevent double submission

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
  const { request: requestWakeLock, release: releaseWakeLock } = useWakeLock();

  // VAD silence handler ref — defined below, used by useVAD
  const handleVADSilenceRef = useRef<() => void>(() => {});

  const { hasSpeechStarted, startMonitoring, stopMonitoring } = useVAD(
    { silenceThreshold: 12, silenceDuration: 1500, minRecordingDuration: 500 },
    { onSilenceDetected: () => handleVADSilenceRef.current() }
  );

  // Context-aware suggested questions
  const { suggestions, hasAlerts } = useSuggestedQuestions({
    selectedAquariumId: conversationManager.selectedAquarium === 'general' ? null : conversationManager.selectedAquarium,
    aquariums: conversationManager.aquariums,
    hasMessages: messages.length > 1,
  });

  const canUseThinking = limits.hasReasoningModel;

  // Wake lock: keep screen on during conversation mode
  useEffect(() => {
    if (conversationMode) requestWakeLock();
    else releaseWakeLock();
  }, [conversationMode, requestWakeLock, releaseWakeLock]);

  // Start recording with VAD monitoring and audio cue
  const startRecordingWithVAD = useCallback(async () => {
    await startRecording((stream) => {
      playListeningChime();
      startMonitoring(stream);
    });
  }, [startRecording, startMonitoring]);

  // Execute voice commands detected via VAD
  const executeVoiceCommand = useCallback((command: 'stop' | 'cancel' | 'repeat' | 'new_chat') => {
    switch (command) {
      case 'stop':
        setConversationMode(false);
        stopSpeaking();
        break;
      case 'cancel':
        // Cancel — just restart listening without sending
        if (conversationModeRef.current) startRecordingWithVAD();
        break;
      case 'repeat': {
        // Re-read the last assistant message
        const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
        if (lastAssistant?.content) {
          speak(lastAssistant.content, `repeat-${Date.now()}`, () => {
            if (conversationModeRef.current && !isRecordingRef.current && !isProcessingRef.current) {
              startRecordingWithVAD();
            }
          });
        } else if (conversationModeRef.current) {
          startRecordingWithVAD();
        }
        break;
      }
      case 'new_chat':
        setMessages(conversationManager.startNewConversation());
        setLastError(null);
        if (userId) localStorage.removeItem(getLastConversationKey(userId));
        if (conversationModeRef.current) startRecordingWithVAD();
        break;
    }
  }, [stopSpeaking, messages, speak, startRecordingWithVAD, conversationManager, userId]);

  // VAD silence handler — auto-stops recording when user pauses speaking
  const handleVADSilence = useCallback(async () => {
    if (!isRecordingRef.current) return;
    stopMonitoring();
    playConfirmationTone();

    const text = await stopRecording();
    if (text) {
      const command = parseVoiceCommand(text);
      if (command) {
        executeVoiceCommand(command);
        return;
      }
      setInput(prev => prev ? `${prev} ${text}` : text);
      setWasVoiceInput(true);
      setAutoSendPending(true);
    } else {
      // Empty transcription — restart listening if still in conversation mode
      if (conversationModeRef.current) startRecordingWithVAD();
    }
  }, [stopRecording, stopMonitoring, startRecordingWithVAD, executeVoiceCommand]);

  // Keep handleVADSilence ref in sync
  useEffect(() => {
    handleVADSilenceRef.current = handleVADSilence;
  }, [handleVADSilence]);

  // Factory for streaming callbacks — eliminates duplication across send, retry, and edit flows
  const createStreamCallbacks = useCallback((options: {
    aquariumContext?: string;
    aquariumName?: string;
    onStreamEnd: (content: string) => Promise<void> | void;
    onError: (error: Error) => void;
  }) => ({
    onStreamStart: () => {
      triggerHaptic('light');
      pendingToolExecutionsRef.current = [];
      pendingDataCardsRef.current = [];
      setMessages(prev => [...prev, {
        role: "assistant" as const,
        content: "",
        timestamp: new Date(),
        ...(options.aquariumContext && { aquariumContext: options.aquariumContext }),
        ...(options.aquariumName && { aquariumName: options.aquariumName }),
      }]);
    },
    onToken: (content: string) => {
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          ...newMessages[newMessages.length - 1],
          content,
          toolExecutions: pendingToolExecutionsRef.current.length > 0
            ? [...pendingToolExecutionsRef.current]
            : undefined,
          dataCards: pendingDataCardsRef.current.length > 0
            ? [...pendingDataCardsRef.current]
            : undefined,
        };
        return newMessages;
      });
    },
    onStreamEnd: options.onStreamEnd,
    onError: options.onError,
    onToolExecution: (executions: ToolExecution[]) => {
      pendingToolExecutionsRef.current = executions;
      triggerHaptic('light');
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            toolExecutions: executions,
          };
        }
        return newMessages;
      });
    },
    onDataCard: (card: DataCardPayload) => {
      pendingDataCardsRef.current = [...pendingDataCardsRef.current, card];
      triggerHaptic('light');
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            dataCards: [...pendingDataCardsRef.current],
          };
        }
        return newMessages;
      });
    },
  }), []);

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

  // Use ref to avoid stale closure when auto-sending after voice input
  const sendMessageRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (autoSendPending && input.trim() && !isLoading) {
      setAutoSendPending(false);
      // Use ref to get latest sendMessage function, avoiding stale closure
      sendMessageRef.current();
    }
  }, [autoSendPending, input, isLoading]);

  // Cleanup auto-send pending state on unmount
  useEffect(() => {
    return () => {
      setAutoSendPending(false);
    };
  }, []);

  // Keep refs in sync with state for use in callbacks
  useEffect(() => {
    conversationModeRef.current = conversationMode;
  }, [conversationMode]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  // Deps: initializeChat contains navigation and state setup that should only run once on mount.
  // Adding it as a dependency would cause infinite loops as it updates state it depends on.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    initializeChat();
  }, []);

  // Handle prefilled messages from navigation (e.g., "Ask Ally" from alerts)
  useEffect(() => {
    const state = location.state as { prefillMessage?: string; context?: Record<string, unknown> } | null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if (state?.prefillMessage && !input) {
      setInput(state.prefillMessage);
      // Clear the state so it doesn't persist on refresh
      window.history.replaceState({}, document.title);
      // Auto-send after a brief delay
      timeoutId = setTimeout(() => setAutoSendPending(true), 300);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [location.state, input]);

  const initializeChat = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user.id);
      await conversationManager.fetchAquariums();
      const conversations = await conversationManager.fetchConversations();

      // Restore last conversation if available
      // Use the fresh conversations array returned by fetchConversations
      // instead of conversationManager.conversations which may be stale
      const lastConvoId = localStorage.getItem(getLastConversationKey(user.id));
      if (lastConvoId && conversations.some(c => c.id === lastConvoId)) {
        const loadedMessages = await conversationManager.loadConversation(lastConvoId);
        if (loadedMessages && loadedMessages.length > 0) {
          setMessages(loadedMessages);
        } else {
          setMessages(conversationManager.startNewConversation());
        }
      } else {
        setMessages(conversationManager.startNewConversation());
      }
    } catch (error) {
      logger.error('Failed to initialize chat:', error);
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
    } catch {
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
    if (conversationMode) {
      setConversationMode(false);
      stopMonitoring();
      stopSpeaking();
      if (isRecording) stopRecording();
    }
    toast({
      title: "Stopped",
      description: "Response generation was stopped.",
    });
  }, [abort, toast, conversationMode, stopMonitoring, stopSpeaking, isRecording, stopRecording]);

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
        createStreamCallbacks({
          aquariumContext: currentAquariumContext,
          aquariumName: currentAquariumName,
          onStreamEnd: async (content) => {
            triggerHaptic('success');
            setStreamStartTime(null);
            const finalAssistantMessage = { role: "assistant" as const, content, timestamp: new Date() };
            const savedId = await conversationManager.saveConversation(userMessage, finalAssistantMessage);
            if (savedId && userId) {
              localStorage.setItem(getLastConversationKey(userId), savedId);
            }
          },
          onError: (error) => {
            logger.error("Stream error:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to get response";
            setLastError({ message: errorMessage, userMessage });
            if (conversationModeRef.current) {
              setConversationMode(false);
              stopMonitoring();
              stopSpeaking();
            }
            toast({ title: "Error", description: errorMessage, variant: "destructive" });
          },
        })
      );
    } catch (error) {
      logger.error("Retry error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to send message";
      setLastError({ message: errorMessage, userMessage });
      setMessages(prev => prev.slice(0, -1));
      if (conversationModeRef.current) {
        setConversationMode(false);
        stopMonitoring();
        stopSpeaking();
      }
      triggerHaptic('error');
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
      setStreamStartTime(null);
    }
  }, [lastError, messages, conversationManager, streamResponse, selectedModel, toast, createStreamCallbacks, stopMonitoring, stopSpeaking, userId]);

  const sendMessage = async () => {
    // Guard against double submission - check ref first (sync), then state
    if (isSubmittingRef.current) return;
    if ((!input.trim() && !pendingPhoto) || isLoading) return;

    // Set ref immediately to prevent double-click before state updates
    isSubmittingRef.current = true;

    // Validate input length to prevent memory issues
    const MAX_INPUT_LENGTH = 10000;
    if (input.length > MAX_INPUT_LENGTH) {
      toast({
        title: "Message too long",
        description: `Please keep messages under ${MAX_INPUT_LENGTH.toLocaleString()} characters.`,
        variant: "destructive",
      });
      isSubmittingRef.current = false;
      return;
    }

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
    const shouldAutoPlay = wasVoiceInput || conversationMode;
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
      await streamResponse(
        [...messages, userMessage],
        conversationManager.getAquariumIdForApi(),
        selectedModel,
        createStreamCallbacks({
          aquariumContext: currentAquariumContext,
          aquariumName: currentAquariumName,
          onStreamEnd: async (content) => {
            triggerHaptic('success');
            setStreamStartTime(null);
            const finalAssistantMessage = { role: "assistant" as const, content, timestamp: new Date() };
            const savedId = await conversationManager.saveConversation(userMessage, finalAssistantMessage);
            if (savedId && userId) {
              localStorage.setItem(getLastConversationKey(userId), savedId);
            }

            if (shouldAutoPlay && content) {
              const messageId = `auto-${Date.now()}`;
              speak(content, messageId, () => {
                if (conversationModeRef.current && !isRecordingRef.current && !isProcessingRef.current) {
                  startRecordingWithVAD();
                }
              });
            }
          },
          onError: (error) => {
            logger.error("Stream error:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to get response";
            setLastError({ message: errorMessage, userMessage });
            if (conversationModeRef.current) {
              setConversationMode(false);
              stopMonitoring();
              stopSpeaking();
            }
            toast({ title: "Error", description: errorMessage, variant: "destructive" });
          },
        })
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send message";
      logger.error("Chat error:", errorMessage, error);

      // Store error for retry
      setLastError({ message: errorMessage, userMessage });
      if (conversationModeRef.current) {
        setConversationMode(false);
        stopMonitoring();
        stopSpeaking();
      }
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
      isSubmittingRef.current = false; // Reset double-submission guard
    }
  };

  // Keep sendMessage ref up to date to avoid stale closures in auto-send
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copyMessage = useCallback(async (content: string, index: number) => {
    const success = await copyToClipboard(content);
    if (success) {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      setCopiedIndex(index);
      copyTimeoutRef.current = setTimeout(() => setCopiedIndex(null), 2000);
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

    try {
      await streamResponse(
        newMessages,
        conversationManager.getAquariumIdForApi(),
        selectedModel,
        createStreamCallbacks({
          aquariumContext: conversationManager.selectedAquarium,
          aquariumName: conversationManager.getSelectedAquariumName(),
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
            logger.error("Regeneration error:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to regenerate response";
            toast({ title: "Error", description: errorMessage, variant: "destructive" });
          },
        })
      );
    } catch (error) {
      logger.error("Error regenerating response:", error);
      toast({
        title: "Error",
        description: "Failed to regenerate response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [editingIndex, editingContent, messages, conversationManager, streamResponse, toast, selectedModel]);

  const handleRegenerateResponse = useCallback(async (index: number) => {
    if (messages[index]?.role !== "user") return;

    const messageContent = messages[index].content;

    // Directly truncate and re-send instead of going through edit state,
    // which caused a stale closure bug (saveEdit would read null editingIndex)
    const newMessages = messages.slice(0, index + 1);
    setMessages(newMessages);

    await conversationManager.updateMessageInDb(index, messageContent);

    setIsLoading(true);

    try {
      await streamResponse(
        newMessages,
        conversationManager.getAquariumIdForApi(),
        selectedModel,
        createStreamCallbacks({
          onStreamEnd: async (content) => {
            if (conversationManager.currentConversationId) {
              await conversationManager.saveAssistantMessage(content);
            } else {
              const lastUserMessage = newMessages[newMessages.length - 1];
              await conversationManager.saveConversation(
                lastUserMessage,
                { role: "assistant", content, timestamp: new Date() }
              );
            }
          },
        }),
      );
    } catch (error) {
      logger.error("Failed to regenerate response:", error);
      toast({
        title: "Error",
        description: "Failed to regenerate response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, conversationManager, streamResponse, toast, selectedModel, createStreamCallbacks]);

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
                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Open chat history">
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
            aria-label="New conversation"
            onClick={handleStartNewConversation}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </header>

        {/* Aquarium Context Banner */}
        {conversationManager.selectedAquarium !== 'general' && conversationManager.aquariums.length > 0 && (
          <div className="flex-shrink-0 px-4 py-2 bg-primary/5 border-b border-primary/10">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Fish className="h-3 w-3 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Talking about</p>
                  <p className="text-sm font-medium -mt-0.5">{conversationManager.getSelectedAquariumName()}</p>
                </div>
              </div>
              <Select
                value={conversationManager.selectedAquarium}
                onValueChange={conversationManager.setSelectedAquarium}
              >
                <SelectTrigger className="w-fit h-7 text-xs gap-1 border-primary/20 bg-background">
                  <span>Switch</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-3 w-3" />
                      Aquatics Advice
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
            </div>
          </div>
        )}

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
                  setTimeout(() => sendMessageRef.current(), 100);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="border-t bg-background p-4 pb-safe">
          <div className="max-w-3xl mx-auto space-y-3">
            {/* Conversation Mode Banner */}
            {conversationMode && !isRecording && !isProcessing && (
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 animate-pulse" />
                  Hands-free conversation active
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    setConversationMode(false);
                    stopMonitoring();
                    stopSpeaking();
                    if (isRecording) stopRecording();
                  }}
                >
                  Exit
                </Button>
              </div>
            )}

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
                    {conversationMode
                      ? (hasSpeechStarted ? "Hearing you... will send when you pause" : "Listening... speak when ready")
                      : "Recording... Tap mic to stop"}
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
                        Aquatics Advice
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
                  placeholder="Message Ally... (type @ to mention an aquatic space)"
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

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={conversationMode ? "default" : "ghost"}
                        size="icon"
                        className={cn(
                          "h-12 w-12 rounded-full relative",
                          conversationMode && "bg-primary text-primary-foreground"
                        )}
                        onClick={() => {
                          if (!limits.hasConversationMode) {
                            toast({ title: "Plus membership required", description: "Upgrade to use hands-free conversation mode." });
                            return;
                          }
                          if (conversationMode) {
                            setConversationMode(false);
                            stopMonitoring();
                            stopSpeaking();
                            if (isRecording) stopRecording();
                          } else {
                            setConversationMode(true);
                            setWasVoiceInput(true);
                            startRecordingWithVAD();
                          }
                        }}
                        disabled={isLoading || isProcessing}
                      >
                        <MessageSquare className={cn(
                          "h-5 w-5",
                          conversationMode && "animate-pulse"
                        )} />
                        {!limits.hasConversationMode && (
                          <Lock className="h-3 w-3 absolute -top-0.5 -right-0.5 text-muted-foreground" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{conversationMode ? "Exit hands-free" : "Hands-free mode"}</p>
                    </TooltipContent>
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
