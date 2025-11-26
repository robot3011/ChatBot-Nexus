import { cn } from "@/lib/utils";
import { Message } from "@/types";
import { Avatar } from "@/components/shared/Avatar";
import { TypingIndicator } from "@/components/shared/LoadingSpinner";
import { FileText, Download } from "lucide-react";

interface ChatBubbleProps {
  message: Message;
  userName?: string;
}

export function ChatBubble({ message, userName }: ChatBubbleProps) {
  const isUser = message.role === "user";
  const isLoading = message.isLoading;

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div
      className={cn(
        "flex gap-3 animate-slide-up",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar
        type={isUser ? "user" : "ai"}
        name={isUser ? userName : "Nexus"}
        size="sm"
      />

      <div
        className={cn(
          "flex flex-col max-w-[75%] sm:max-w-[70%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-3",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "glass rounded-bl-md"
          )}
        >
          {isLoading ? (
            <TypingIndicator />
          ) : (
            <>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>

              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg transition-colors",
                        isUser
                          ? "bg-primary-foreground/10 hover:bg-primary-foreground/20"
                          : "bg-secondary hover:bg-secondary/80"
                      )}
                    >
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {attachment.name}
                        </p>
                        <p className="text-xs opacity-70">
                          {formatFileSize(attachment.size)}
                        </p>
                      </div>
                      <Download className="w-4 h-4 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              )}

              {/* Generated Image */}
              {(message.generatedImage || (message.imageUrl && message.imageUrl !== "image_attached")) && (
                <div className="mt-3">
                  <img
                    src={message.generatedImage || message.imageUrl || ""}
                    alt="AI Generated"
                    className="rounded-lg max-w-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Timestamp */}
        {!isLoading && (
          <span className="text-xs text-muted-foreground mt-1 px-1">
            {formatTime(message.timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}
