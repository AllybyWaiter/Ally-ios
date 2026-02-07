import { useRef, useState, useCallback, useEffect } from 'react';
import { getOrCreateAudioContext } from '@/lib/audioUtils';

interface VADConfig {
  silenceThreshold?: number;    // RMS below this = silence (default: 12, scale 0-128)
  silenceDuration?: number;     // ms of silence before triggering (default: 1500)
  minRecordingDuration?: number; // ms before VAD activates (default: 500)
}

interface VADCallbacks {
  onSilenceDetected: () => void;
  onSpeechStart?: () => void;
}

export function useVAD(config: VADConfig, callbacks: VADCallbacks) {
  const [hasSpeechStarted, setHasSpeechStarted] = useState(false);
  const volumeLevelRef = useRef(0);

  const speechStartedRef = useRef(false);
  const silenceStartTimeRef = useRef<number | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const callbacksRef = useRef(callbacks);
  const firedRef = useRef(false); // Prevent repeated onSilenceDetected firing

  // Keep callbacks ref fresh to avoid stale closures
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    analyserRef.current = null;
    speechStartedRef.current = false;
    silenceStartTimeRef.current = null;
    recordingStartTimeRef.current = null;
    firedRef.current = false;
    setHasSpeechStarted(false);
    volumeLevelRef.current = 0;
  }, []);

  const startMonitoring = useCallback((stream: MediaStream) => {
    // Clean up any previous monitoring
    stopMonitoring();

    const threshold = config.silenceThreshold ?? 12;
    const silenceDur = config.silenceDuration ?? 1500;
    const minRecording = config.minRecordingDuration ?? 500;

    try {
      const audioContext = getOrCreateAudioContext();

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      recordingStartTimeRef.current = Date.now();
      firedRef.current = false;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      intervalRef.current = setInterval(() => {
        if (!analyserRef.current || firedRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        // Compute RMS
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length);
        volumeLevelRef.current = rms;

        const now = Date.now();
        const elapsed = now - (recordingStartTimeRef.current ?? now);

        if (rms > threshold) {
          // Speech detected
          if (!speechStartedRef.current) {
            speechStartedRef.current = true;
            setHasSpeechStarted(true);
            callbacksRef.current.onSpeechStart?.();
          }
          silenceStartTimeRef.current = null;
        } else {
          // Silence detected
          if (speechStartedRef.current && elapsed > minRecording) {
            if (!silenceStartTimeRef.current) {
              silenceStartTimeRef.current = now;
            } else if (now - silenceStartTimeRef.current >= silenceDur) {
              // Silence duration exceeded — fire callback once
              firedRef.current = true;
              callbacksRef.current.onSilenceDetected();
            }
          }
        }
      }, 50);
    } catch (error) {
      console.error('Failed to start VAD monitoring:', error);
    }
  }, [config.silenceThreshold, config.silenceDuration, config.minRecordingDuration, stopMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
    };
  }, []);

  return { hasSpeechStarted, volumeLevel: volumeLevelRef.current, startMonitoring, stopMonitoring };
}
