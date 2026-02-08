import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// Minimal silent WAV (44 bytes) used to activate the iOS audio session during a
// user gesture so that later programmatic audio.play() calls are not blocked.
const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

export const useTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const unlockedRef = useRef(false);
  // Refs to avoid dependency array issues while still accessing current state
  const isSpeakingRef = useRef(isSpeaking);
  const speakingMessageIdRef = useRef(speakingMessageId);

  // Keep refs in sync with state
  isSpeakingRef.current = isSpeaking;
  speakingMessageIdRef.current = speakingMessageId;

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

  // Call during a user gesture (e.g. mic button tap) to activate the iOS audio
  // session. Without this, programmatic audio.play() after an async gap is blocked.
  const unlock = useCallback(() => {
    if (unlockedRef.current) return;
    try {
      const audio = new Audio(SILENT_WAV);
      audio.volume = 0.01;
      const p = audio.play();
      if (p) p.then(() => { audio.pause(); unlockedRef.current = true; }).catch(() => {});
    } catch {
      // Silently fail — non-critical
    }
  }, []);

  const speak = useCallback(async (text: string, messageId: string, onEnded?: () => void) => {
    // Prevent double-fire of onEnded across multiple error/completion paths
    let onEndedCalled = false;
    const safeOnEnded = () => {
      if (!onEndedCalled) {
        onEndedCalled = true;
        onEnded?.();
      }
    };

    // If already speaking this message, stop it (use refs to avoid stale closure)
    if (speakingMessageIdRef.current === messageId && isSpeakingRef.current) {
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
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!session?.access_token) {
        throw new Error('Authentication required for text-to-speech');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
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
        safeOnEnded();
      };

      audio.onerror = (e) => {
        logger.error('Audio playback error:', e);
        toast.error('Failed to play audio');
        setIsSpeaking(false);
        setIsGenerating(false);
        setSpeakingMessageId(null);
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
        safeOnEnded();
      };

      setIsGenerating(false);
      setIsSpeaking(true);

      try {
        await audio.play();
      } catch (playError) {
        logger.error('Audio play() error:', playError);
        toast.error('Audio playback failed - try tapping again');
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
        safeOnEnded();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('TTS error:', errorMessage, error);
      toast.error(errorMessage || 'Failed to generate speech');
      setIsGenerating(false);
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      safeOnEnded();
    }
  }, [stop]);

  // Clean up audio and blob URL on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, []);

  return {
    isSpeaking,
    isGenerating,
    speakingMessageId,
    speak,
    stop,
    unlock,
  };
};
