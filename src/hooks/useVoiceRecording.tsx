import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Detects the best supported audio MIME type for the current browser.
 * iOS Safari requires audio/mp4, while Chrome/Firefox prefer audio/webm.
 */
function getSupportedMimeType(): { mimeType: string; extension: string } {
  const types = [
    { mimeType: 'audio/mp4', extension: 'm4a' },      // iOS Safari native
    { mimeType: 'audio/webm', extension: 'webm' },    // Chrome/Firefox
    { mimeType: 'audio/ogg', extension: 'ogg' },      // Firefox fallback
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type.mimeType)) {
      return type;
    }
  }

  // Fallback - let browser pick default
  return { mimeType: '', extension: 'wav' };
}

export const useVoiceRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const isAbortedRef = useRef(false); // Track if component unmounted
  const isStartingRef = useRef(false); // Prevent concurrent startRecording calls
  const mimeTypeRef = useRef<{ mimeType: string; extension: string } | null>(null);

  // Cleanup function to stop all media tracks
  useEffect(() => {
    // Reset abort flag on mount
    isAbortedRef.current = false;

    return () => {
      // Mark as aborted to prevent state updates after unmount
      isAbortedRef.current = true;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const startRecording = useCallback(async (onStreamReady?: (stream: MediaStream) => void) => {
    // Guard against being called while already recording — prevents orphaned streams
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      return;
    }
    // Guard against concurrent calls during async getUserMedia
    if (isStartingRef.current) {
      return;
    }
    isStartingRef.current = true;

    try {
      // Check for browser support
      if (!navigator.mediaDevices?.getUserMedia) {
        isStartingRef.current = false;
        toast.error('Voice recording not supported in this browser');
        return;
      }
      if (!window.MediaRecorder) {
        isStartingRef.current = false;
        toast.error('MediaRecorder not supported');
        return;
      }

      // Detect supported format before starting
      const formatInfo = getSupportedMimeType();
      mimeTypeRef.current = formatInfo;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: { ideal: 16000 },  // Use 'ideal' - iOS rejects 'exact'
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      // Store stream reference for cleanup
      streamRef.current = stream;

      // Notify caller (e.g. VAD) that the stream is ready
      onStreamReady?.(stream);

      // Build MediaRecorder options with detected format
      const options: MediaRecorderOptions = {};
      if (formatInfo.mimeType) {
        options.mimeType = formatInfo.mimeType;
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      isStartingRef.current = false;
      toast.success('Recording started');
    } catch (error) {
      isStartingRef.current = false;
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording. Please check microphone permissions.');
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        resolve(null);
        return;
      }

      // Capture this session's stream locally so the onstop handler doesn't
      // accidentally kill a new stream started via a subsequent startRecording call
      const sessionStream = streamRef.current;

      // Track if promise was already settled to prevent double resolution
      let promiseSettled = false;

      // Add error handler for media recorder
      mediaRecorderRef.current.onerror = () => {
        if (promiseSettled) return;
        promiseSettled = true;
        if (!isAbortedRef.current) {
          setIsRecording(false);
          setIsProcessing(false);
        }
        reject(new Error('MediaRecorder error'));
      };

      mediaRecorderRef.current.onstop = async () => {
        // Prevent handling if error already rejected the promise
        if (promiseSettled) return;
        promiseSettled = true;
        // Check if component unmounted before updating state
        if (isAbortedRef.current) {
          resolve(null);
          return;
        }

        setIsRecording(false);
        setIsProcessing(true);

        try {
          const audioMimeType = mimeTypeRef.current?.mimeType || 'audio/webm';
          const audioBlob = new Blob(chunksRef.current, { type: audioMimeType });

          // Convert blob to base64 with timeout safeguard
          const reader = new FileReader();
          let readerSettled = false;

          // Timeout safeguard - ensure promise settles even if FileReader hangs
          const readerTimeout = setTimeout(() => {
            if (!readerSettled) {
              readerSettled = true;
              console.error('FileReader timeout');
              if (!isAbortedRef.current) {
                setIsProcessing(false);
                toast.error('Audio processing timed out');
              }
              resolve(null);
            }
          }, 30000); // 30 second timeout

          reader.onerror = () => {
            if (readerSettled) return;
            readerSettled = true;
            clearTimeout(readerTimeout);
            console.error('FileReader error:', reader.error);
            if (!isAbortedRef.current) {
              setIsProcessing(false);
              resolve(null);
            }
          };

          reader.onabort = () => {
            if (readerSettled) return;
            readerSettled = true;
            clearTimeout(readerTimeout);
            if (!isAbortedRef.current) {
              setIsProcessing(false);
              resolve(null);
            }
          };

          reader.onloadend = async () => {
            if (readerSettled) return;
            readerSettled = true;
            clearTimeout(readerTimeout);

            if (isAbortedRef.current) return;

            const resultString = reader.result as string;
            const splitResult = resultString.split(',');
            if (splitResult.length < 2) {
              console.error('Invalid data URL format');
              if (!isAbortedRef.current) {
                setIsProcessing(false);
              }
              resolve(null);
              return;
            }
            const base64Audio = splitResult[1];

            try {
              const { data, error } = await supabase.functions.invoke('transcribe-audio', {
                body: {
                  audio: base64Audio,
                  format: mimeTypeRef.current?.extension || 'webm'
                }
              });

              if (isAbortedRef.current) return;
              if (error) throw error;

              setIsProcessing(false);
              toast.success('Transcription complete');
              resolve(data.text);
            } catch (error) {
              if (isAbortedRef.current) return;
              console.error('Transcription error:', error);
              toast.error('Failed to transcribe audio');
              setIsProcessing(false);
              resolve(null);
            }
          };

          reader.readAsDataURL(audioBlob);
        } catch (error) {
          if (isAbortedRef.current) return;
          console.error('Error processing audio:', error);
          toast.error('Failed to process audio');
          setIsProcessing(false);
          resolve(null);
        }

        // Stop all tracks for THIS session's stream (captured locally to avoid
        // killing a new stream that may have been started via startRecording)
        if (sessionStream) {
          sessionStream.getTracks().forEach(track => track.stop());
          if (streamRef.current === sessionStream) {
            streamRef.current = null;
          }
        }
      };

      mediaRecorderRef.current.stop();
    });
  }, []);

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
  };
};
