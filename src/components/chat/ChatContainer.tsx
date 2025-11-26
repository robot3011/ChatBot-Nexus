import { useRef, useEffect } from "react";
import { ChatBubble } from "./ChatBubble";
import { useAuth } from "@/contexts/AuthContext";
import { Message } from "@/types";

interface ChatContainerProps {
  messages: Message[];
}

export function ChatContainer({ messages }: ChatContainerProps) {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
    >
      {messages.map((message) => (
        <ChatBubble key={message.id} message={message} userName={userName} />
      ))}
    </div>
  );
}
