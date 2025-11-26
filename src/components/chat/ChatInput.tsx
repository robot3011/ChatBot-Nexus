import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Send, Mic, MicOff, Paperclip, Image, X } from "lucide-react";
import { Attachment } from "@/types";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

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
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if ((!message.trim() && attachments.length === 0) || isLoading || disabled) return;
    onSendMessage(message, attachments.length > 0 ? attachments : undefined);
    setMessage("");
    setAttachments([]);
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

  const toggleRecording = () => {
    // Placeholder for voice recording - connect to speech-to-text API
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Start recording
      console.log("Voice recording started - connect to speech-to-text API");
    } else {
      // Stop recording and process
      console.log("Voice recording stopped");
    }
  };

  const handleImageGenerate = () => {
    if (!imagePrompt.trim()) return;
    onGenerateImage(imagePrompt);
    setImagePrompt("");
    setShowImagePrompt(false);
  };

  return (
    <div className="border-t border-border bg-card/50 p-4">
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

      <div className="flex items-end gap-2">
        {/* Action Buttons */}
        <div className="flex gap-1">
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
            size="icon-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || disabled}
            title="Attach file"
          >
            {isUploading ? <LoadingSpinner size="sm" /> : <Paperclip className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowImagePrompt(!showImagePrompt)}
            disabled={disabled}
            title="Generate image"
          >
            <Image className="w-4 h-4" />
          </Button>
          <Button
            variant={isRecording ? "destructive" : "ghost"}
            size="icon-sm"
            onClick={toggleRecording}
            disabled={disabled}
            title={isRecording ? "Stop recording" : "Voice input"}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
        </div>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            rows={1}
            className={cn(
              "w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm resize-none",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
              "placeholder:text-muted-foreground disabled:opacity-50",
              "max-h-32 min-h-[48px]"
            )}
            style={{
              height: "auto",
              minHeight: "48px",
            }}
          />
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={(!message.trim() && attachments.length === 0) || isLoading || disabled}
          size="icon"
          className="flex-shrink-0"
        >
          {isLoading ? <LoadingSpinner size="sm" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
