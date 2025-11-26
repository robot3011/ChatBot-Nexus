import { useState, useCallback } from "react";
import { Message, Attachment } from "@/types";

// Generate unique IDs
const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hello! I'm Nexus, your AI assistant. How can I help you today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Placeholder: Send a message and get AI response
  const sendMessage = useCallback(async (content: string, attachments?: Attachment[]) => {
    if (!content.trim() && !attachments?.length) return;

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      content,
      role: "user",
      timestamp: new Date(),
      attachments,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Add loading message
    const loadingMessage: Message = {
      id: "loading",
      content: "",
      role: "assistant",
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      // Simulate API call - replace with actual AI backend call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock AI response
      const aiResponse: Message = {
        id: generateId(),
        content: `I received your message: "${content}". This is a placeholder response. Connect me to your AI backend to get real responses!`,
        role: "assistant",
        timestamp: new Date(),
      };

      // Remove loading and add response
      setMessages((prev) => prev.filter((m) => m.id !== "loading").concat(aiResponse));
    } catch (error) {
      // Remove loading message on error
      setMessages((prev) => prev.filter((m) => m.id !== "loading"));
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Placeholder: Generate an image from prompt
  const generateImage = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;

    // Add user message with image request
    const userMessage: Message = {
      id: generateId(),
      content: `🎨 Generate image: ${prompt}`,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Add loading message
    const loadingMessage: Message = {
      id: "loading",
      content: "",
      role: "assistant",
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      // Simulate API call - replace with actual image generation API
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock response with placeholder image
      const aiResponse: Message = {
        id: generateId(),
        content: `Here's the generated image for: "${prompt}"`,
        role: "assistant",
        timestamp: new Date(),
        generatedImage: `https://picsum.photos/seed/${Date.now()}/512/512`,
      };

      setMessages((prev) => prev.filter((m) => m.id !== "loading").concat(aiResponse));
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== "loading"));
      console.error("Error generating image:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Placeholder: Upload attachment
  const uploadAttachment = useCallback(async (file: File): Promise<Attachment | null> => {
    try {
      // Simulate upload - replace with actual file upload logic
      await new Promise((resolve) => setTimeout(resolve, 500));

      const attachment: Attachment = {
        id: generateId(),
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
      };

      return attachment;
    } catch (error) {
      console.error("Error uploading file:", error);
      return null;
    }
  }, []);

  // Clear chat history
  const clearChat = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        content: "Hello! I'm Nexus, your AI assistant. How can I help you today?",
        role: "assistant",
        timestamp: new Date(),
      },
    ]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    generateImage,
    uploadAttachment,
    clearChat,
  };
}
