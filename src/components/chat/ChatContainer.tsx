import { useRef, useEffect } from "react";
import { Message } from "@/types";
import { ChatBubble } from "./ChatBubble";
import { useAuth } from "@/contexts/AuthContext";

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

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
    >
      {messages.map((message) => (
        <ChatBubble key={message.id} message={message} userName={user?.name} />
      ))}
    </div>
  );
}
