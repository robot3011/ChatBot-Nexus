import { supabase } from './supabaseClient';
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/hooks/useChat";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function Chat() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { messages, isLoading, sendMessage, generateImage, uploadAttachment, clearChat } = useChat();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <ChatHeader onClearChat={clearChat} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <ChatContainer messages={messages} />
        <ChatInput
          onSendMessage={sendMessage}
          onGenerateImage={generateImage}
          onUploadAttachment={uploadAttachment}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}
