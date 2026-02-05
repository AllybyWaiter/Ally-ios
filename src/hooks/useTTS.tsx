import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export const useTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setIsSpeaking(false);
    setSpeakingMessageId(null);
  }, []);

  const speak = useCallback(async (text: string, messageId: string) => {
    // If already speaking this message, stop it
    if (speakingMessageId === messageId && isSpeaking) {
      stop();
      return;
    }

    // Stop any current playback
    stop();

    // Clean text for TTS (remove markdown, code blocks, etc.)
    const cleanText = text
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`[^`]+`/g, '') // Remove inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to just text
      .replace(/[*_~]+/g, '') // Remove markdown formatting
      .replace(/#+\s/g, '') // Remove headers
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();

    if (!cleanText) {
      toast.error('No speakable content in this message');
      return;
    }

    // Limit text length for TTS
    const truncatedText = cleanText.slice(0, 4000);
    if (cleanText.length > 4000) {
      toast.info('Message truncated for speech (max 4000 characters)');
    }

    setIsGenerating(true);
    setSpeakingMessageId(messageId);

    try {
      // Get the user's session for authenticated TTS requests
      const { data: session } = await import('@/integrations/supabase/client')
        .then(m => m.supabase.auth.getSession());

      if (!session?.session?.access_token) {
        throw new Error('Authentication required for text-to-speech');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({ text: truncatedText }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
      };

      audio.onerror = () => {
        toast.error('Failed to play audio');
        setIsSpeaking(false);
        setIsGenerating(false);
        setSpeakingMessageId(null);
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
      };

      setIsGenerating(false);
      setIsSpeaking(true);
      await audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate speech');
      setIsGenerating(false);
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }
  }, [speakingMessageId, isSpeaking, stop]);

  return {
    isSpeaking,
    isGenerating,
    speakingMessageId,
    speak,
    stop,
  };
};
