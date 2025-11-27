import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Send, Mic, MicOff, Paperclip, Image, X } from "lucide-react";
import { Attachment } from "@/types";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { toast } from "sonner";

interface ChatInputProps {
  onSendMessage: (content: string, attachments?: Attachment[]) => void;
  onGenerateImage: (prompt: string) => void;
  onUploadAttachment: (file: File) => Promise<Attachment | null>;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({
  onSendMessage,
  onGenerateImage,
  onUploadAttachment,
  isLoading,
  disabled,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Speech recognition hook
  const {
    isListening,
    isSupported,
    toggleListening,
  } = useSpeechRecognition({
    onResult: (transcript) => {
      setMessage((prev) => prev + (prev ? " " : "") + transcript);
      textareaRef.current?.focus();
    },
    onError: (error) => {
      toast.error(error);
    },
    continuous: true,
    interimResults: true,
  });

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if ((!message.trim() && attachments.length === 0) || isLoading || disabled) return;
    onSendMessage(message, attachments.length > 0 ? attachments : undefined);
    setMessage("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);
    const newAttachments: Attachment[] = [];

    for (const file of Array.from(files)) {
      const attachment = await onUploadAttachment(file);
      if (attachment) {
        newAttachments.push(attachment);
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleImageGenerate = () => {
    if (!imagePrompt.trim()) return;
    onGenerateImage(imagePrompt);
    setImagePrompt("");
    setShowImagePrompt(false);
  };

  return (
    <div className="border-t border-border bg-card/50 p-3 sm:p-4">
      {/* Image Generation Prompt */}
      {showImagePrompt && (
        <div className="mb-3 flex gap-2 animate-fade-in">
          <input
            type="text"
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            className="flex-1 px-4 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            onKeyDown={(e) => e.key === "Enter" && handleImageGenerate()}
          />
          <Button onClick={handleImageGenerate} disabled={!imagePrompt.trim() || isLoading}>
            Generate
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowImagePrompt(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full text-sm"
            >
              <span className="truncate max-w-[150px]">{attachment.name}</span>
              <button
                onClick={() => removeAttachment(attachment.id)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Unified Input Container - ChatGPT Style */}
      <div className="relative flex items-end gap-2 bg-secondary rounded-2xl border border-border p-2 focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-all">
        {/* Left Action Buttons */}
        <div className="flex items-center gap-1 pb-1">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Upload file"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-muted"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || disabled}
            title="Attach file"
          >
            {isUploading ? <LoadingSpinner size="sm" /> : <Paperclip className="w-4 h-4 text-muted-foreground" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-muted"
            onClick={() => setShowImagePrompt(!showImagePrompt)}
            disabled={disabled}
            title="Generate image"
          >
            <Image className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 bg-transparent text-sm resize-none border-0 focus:outline-none focus:ring-0",
            "placeholder:text-muted-foreground disabled:opacity-50",
            "max-h-32 min-h-[36px] py-2 px-1"
          )}
        />

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1 pb-1">
          {/* Microphone Button */}
          {isSupported && (
            <Button
              variant={isListening ? "destructive" : "ghost"}
              size="icon"
              className={cn(
                "h-8 w-8 rounded-lg transition-all",
                isListening 
                  ? "bg-destructive hover:bg-destructive/90 animate-pulse" 
                  : "hover:bg-muted"
              )}
              onClick={toggleListening}
              disabled={disabled}
              title={isListening ? "Stop recording" : "Voice input"}
            >
              {isListening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
          )}

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={(!message.trim() && attachments.length === 0) || isLoading || disabled}
            size="icon"
            className={cn(
              "h-8 w-8 rounded-lg transition-all",
              (message.trim() || attachments.length > 0) && !isLoading && !disabled
                ? "bg-primary hover:bg-primary/90"
                : "bg-muted text-muted-foreground"
            )}
          >
            {isLoading ? <LoadingSpinner size="sm" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Voice Recording Indicator */}
      {isListening && (
        <div className="mt-2 flex items-center justify-center gap-2 text-sm text-destructive animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          Listening... Speak now
        </div>
      )}
    </div>
  );
}
