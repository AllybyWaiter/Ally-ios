import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useVoiceRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const isAbortedRef = useRef(false); // Track if component unmounted

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

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        } 
      });
      
      // Store stream reference for cleanup
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
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

      // Track if promise was already settled to prevent double resolution
      let promiseSettled = false;

      // Add error handler for media recorder
      mediaRecorderRef.current.onerror = () => {
        if (promiseSettled) return;
        promiseSettled = true;
        setIsRecording(false);
        setIsProcessing(false);
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
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

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

            if (isAbortedRef.current) {
              resolve(null);
              return;
            }

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
                body: { audio: base64Audio }
              });

              if (isAbortedRef.current) {
                resolve(null);
                return;
              }
              if (error) throw error;

              setIsProcessing(false);
              toast.success('Transcription complete');
              resolve(data.text);
            } catch (error) {
              if (isAbortedRef.current) {
                resolve(null);
                return;
              }
              console.error('Transcription error:', error);
              toast.error('Failed to transcribe audio');
              setIsProcessing(false);
              resolve(null);
            }
          };

          reader.readAsDataURL(audioBlob);
        } catch (error) {
          if (isAbortedRef.current) {
            resolve(null);
            return;
          }
          console.error('Error processing audio:', error);
          toast.error('Failed to process audio');
          setIsProcessing(false);
          resolve(null);
        }

        // Stop all tracks and clear stream ref
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
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
