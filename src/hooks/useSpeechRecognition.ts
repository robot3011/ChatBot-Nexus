import { useState, useCallback, useRef, useEffect } from "react";

interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string) => void;
  onInterimResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  lang?: string;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

// Extend Window interface for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onspeechend: (() => void) | null;
  onnomatch: (() => void) | null;
}

// Check if speech recognition is supported
const getSpeechRecognition = () => {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export function useSpeechRecognition({
  onResult,
  onInterimResult,
  onError,
  lang = "en-US",
}: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(() => !!getSpeechRecognition());
  const [interimTranscript, setInterimTranscript] = useState("");
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onResultRef = useRef(onResult);
  const onInterimResultRef = useRef(onInterimResult);
  const onErrorRef = useRef(onError);
  const isListeningRef = useRef(false);

  // Keep refs updated
  useEffect(() => {
    onResultRef.current = onResult;
    onInterimResultRef.current = onInterimResult;
    onErrorRef.current = onError;
  }, [onResult, onInterimResult, onError]);

  // Initialize recognition on mount
  useEffect(() => {
    const SpeechRecognitionAPI = getSpeechRecognition();
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false; // Stop after speech ends
    recognition.interimResults = true; // Show results while speaking
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log("Speech recognition started");
      isListeningRef.current = true;
      setIsListening(true);
      setInterimTranscript("");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        
        if (result.isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      // Update interim transcript for live feedback
      if (interim) {
        setInterimTranscript(interim);
        onInterimResultRef.current?.(interim);
      }

      // Send final result
      if (final) {
        console.log("Final transcript:", final);
        setInterimTranscript("");
        onResultRef.current?.(final);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      isListeningRef.current = false;
      setIsListening(false);
      setInterimTranscript("");

      // Don't show error for user-initiated stops or no-speech
      if (event.error === "aborted" || event.error === "no-speech") {
        return;
      }

      let errorMessage = "Speech recognition error";
      switch (event.error) {
        case "not-allowed":
          errorMessage = "Microphone access denied. Please allow microphone access in your browser settings.";
          break;
        case "audio-capture":
          errorMessage = "No microphone found. Please connect a microphone and try again.";
          break;
        case "network":
          errorMessage = "Network error occurred. Please check your internet connection.";
          break;
        case "service-not-allowed":
          errorMessage = "Speech recognition service is not allowed. Please try a different browser.";
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }
      onErrorRef.current?.(errorMessage);
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      isListeningRef.current = false;
      setIsListening(false);
      setInterimTranscript("");
    };

    recognition.onspeechend = () => {
      console.log("Speech ended");
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore abort errors on cleanup
        }
      }
    };
  }, [lang]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      onErrorRef.current?.("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListeningRef.current) {
      console.log("Already listening, ignoring start request");
      return;
    }

    try {
      setInterimTranscript("");
      recognitionRef.current.start();
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      // If already started, stop and restart
      if (error instanceof Error && error.message.includes("already started")) {
        recognitionRef.current.stop();
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
          } catch (e) {
            console.error("Failed to restart speech recognition:", e);
          }
        }, 100);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListeningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error("Failed to stop speech recognition:", error);
      }
    }
    isListeningRef.current = false;
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [startListening, stopListening]);

  return {
    isListening,
    isSupported,
    interimTranscript,
    startListening,
    stopListening,
    toggleListening,
  };
}
