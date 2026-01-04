import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "Hi! I'm Ally, your aquarium assistant. I can help you with water parameters, fish care, equipment, and everything aquarium-related. What would you like to know?",
  timestamp: new Date()
};

export function useConversationManager(userId: string | null) {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [aquariums, setAquariums] = useState<Aquarium[]>([]);
  const [selectedAquarium, setSelectedAquarium] = useState<string>("general");

  const fetchAquariums = useCallback(async () => {
    if (!userId) return;
    
    const { data } = await supabase
      .from('aquariums')
      .select('id, name, type')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      setAquariums(data);
    }
  }, [userId]);

  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    
    const { data } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (data) {
      setConversations(data);
    }
  }, [userId]);

  const loadConversation = useCallback(async (conversationId: string): Promise<Message[]> => {
    const { data: messagesData } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesData) {
      const messages = messagesData.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: new Date(msg.created_at)
      }));
      
      setCurrentConversationId(conversationId);

      // Update selected aquarium from conversation
      const conv = conversations.find(c => c.id === conversationId);
      if (conv) {
        setSelectedAquarium(conv.aquarium_id || "general");
      }
      
      return messages;
    }
    
    return [INITIAL_MESSAGE];
  }, [conversations]);

  const startNewConversation = useCallback((): Message[] => {
    setCurrentConversationId(null);
    return [INITIAL_MESSAGE];
  }, []);

  const deleteConversation = useCallback(async (conversationId: string) => {
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
        setCurrentConversationId(null);
        return true; // Signal to reset messages
      }
    }
    return false;
  }, [currentConversationId, toast, fetchConversations]);

  const saveConversation = useCallback(async (
    userMessage: Message,
    assistantMessage: Message
  ): Promise<string | null> => {
    if (!userId) return null;

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

      if (convError || !newConv) return null;

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

    return conversationId;
  }, [userId, currentConversationId, selectedAquarium, fetchConversations]);

  const saveAssistantMessage = useCallback(async (content: string) => {
    if (!currentConversationId) return;

    await supabase
      .from('chat_messages')
      .insert({
        conversation_id: currentConversationId,
        role: "assistant",
        content
      });

    await supabase
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', currentConversationId);
  }, [currentConversationId]);

  const updateMessageInDb = useCallback(async (
    messageIndex: number,
    newContent: string
  ) => {
    if (!currentConversationId) return;

    const { data: existingMessages } = await supabase
      .from('chat_messages')
      .select('id, created_at')
      .eq('conversation_id', currentConversationId)
      .order('created_at', { ascending: true });

    if (existingMessages && existingMessages.length > messageIndex) {
      const messageToUpdate = existingMessages[messageIndex];

      // Update the edited message
      await supabase
        .from('chat_messages')
        .update({ content: newContent })
        .eq('id', messageToUpdate.id);

      // Delete subsequent messages
      const messagesToDelete = existingMessages.slice(messageIndex + 1);
      if (messagesToDelete.length > 0) {
        await supabase
          .from('chat_messages')
          .delete()
          .in('id', messagesToDelete.map(m => m.id));
      }
    }
  }, [currentConversationId]);

  const getSelectedAquariumName = useCallback(() => {
    if (selectedAquarium === "general") return "General Advice";
    const aquarium = aquariums.find(aq => aq.id === selectedAquarium);
    return aquarium ? aquarium.name : "General Advice";
  }, [selectedAquarium, aquariums]);

  const getAquariumIdForApi = useCallback(() => {
    return selectedAquarium === "general" ? null : selectedAquarium;
  }, [selectedAquarium]);

  return {
    conversations,
    currentConversationId,
    aquariums,
    selectedAquarium,
    setSelectedAquarium,
    fetchAquariums,
    fetchConversations,
    loadConversation,
    startNewConversation,
    deleteConversation,
    saveConversation,
    saveAssistantMessage,
    updateMessageInDb,
    getSelectedAquariumName,
    getAquariumIdForApi,
  };
}
