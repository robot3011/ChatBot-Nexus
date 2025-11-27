import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Message, Attachment } from "@/types";

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

export function useChat() {
  const { session, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get user's display name
  const getUserName = () => {
    return user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  };

  // Load chat history on mount
  useEffect(() => {
    if (session?.user?.id) {
      loadChatHistory();
    }
  }, [session?.user?.id]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          console.log("Realtime message:", payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const loadChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading chat history:", error);
        return;
      }

      if (data && data.length > 0) {
        const loadedMessages: Message[] = data.map((msg) => ({
          id: msg.id,
          content: msg.content,
          role: msg.role as "user" | "assistant",
          timestamp: new Date(msg.created_at),
          imageUrl: msg.image_url,
          generatedImage: msg.image_url && msg.image_url !== "image_attached" ? msg.image_url : undefined,
        }));
        setMessages(loadedMessages);
      } else {
        // Show welcome message if no history
        setMessages([
          {
            id: "welcome",
            content: `Hello ${getUserName()}! I'm Nexus, your AI assistant. How can I help you today?`,
            role: "assistant",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  };

  const sendMessage = useCallback(
    async (content: string, attachments?: Attachment[]) => {
      if ((!content.trim() && !attachments?.length) || isLoading) return;

      // Get image base64 if attached
      let imageBase64: string | undefined;
      if (attachments?.length && attachments[0].type.startsWith("image/")) {
        imageBase64 = attachments[0].base64 || attachments[0].url;
      }

      // Add user message to UI immediately
      const userMessage: Message = {
        id: generateId(),
        content,
        role: "user",
        timestamp: new Date(),
        imageUrl: imageBase64 ? "image_attached" : undefined,
        attachments,
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Add loading message
      const loadingId = "loading-" + generateId();
      setMessages((prev) => [
        ...prev,
        {
          id: loadingId,
          content: "",
          role: "assistant",
          timestamp: new Date(),
          isLoading: true,
        },
      ]);

      try {
        // Get conversation history for context
        const conversationHistory = messages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // Call chat edge function with streaming
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({
              message: content,
              imageBase64,
              conversationHistory,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to get response");
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";

        if (reader) {
          let buffer = "";
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete lines
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // Keep incomplete line in buffer
            
            for (const line of lines) {
              if (line.startsWith(":") || !line.trim()) continue;
              if (!line.startsWith("data: ")) continue;
              
              const jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") continue;
              
              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullResponse += content;
                  // Update message with streaming content
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === loadingId
                        ? { ...m, content: fullResponse, isLoading: false }
                        : m
                    )
                  );
                }
              } catch {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }

        // Final update with complete message
        if (fullResponse) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === loadingId
                ? { ...m, content: fullResponse, isLoading: false }
                : m
            )
          );
        } else {
          // Remove loading message if no response
          setMessages((prev) => prev.filter((m) => m.id !== loadingId));
        }
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages((prev) => prev.filter((m) => m.id !== loadingId));
        toast.error(error instanceof Error ? error.message : "Failed to send message");
      } finally {
        setIsLoading(false);
      }
    },
    [session, messages, isLoading]
  );

  const generateImage = useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || isLoading) return;

      // Add user message
      const userMessage: Message = {
        id: generateId(),
        content: `🎨 Generate image: ${prompt}`,
        role: "user",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Add loading message
      const loadingId = "loading-" + generateId();
      setMessages((prev) => [
        ...prev,
        {
          id: loadingId,
          content: "Generating image...",
          role: "assistant",
          timestamp: new Date(),
          isLoading: true,
        },
      ]);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({ prompt }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate image");
        }

        const data = await response.json();

        // Update with generated image
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingId
              ? {
                  ...m,
                  content: data.content,
                  generatedImage: data.imageUrl,
                  imageUrl: data.imageUrl,
                  isLoading: false,
                }
              : m
          )
        );
      } catch (error) {
        console.error("Error generating image:", error);
        setMessages((prev) => prev.filter((m) => m.id !== loadingId));
        toast.error(error instanceof Error ? error.message : "Failed to generate image");
      } finally {
        setIsLoading(false);
      }
    },
    [session, isLoading]
  );

  const uploadAttachment = useCallback(async (file: File): Promise<Attachment | null> => {
    try {
      // Convert to base64 for images
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const attachment: Attachment = {
        id: generateId(),
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        base64,
      };

      return attachment;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
      return null;
    }
  }, []);

  const clearChat = useCallback(async () => {
    if (!session?.user?.id) {
      toast.error("Not authenticated");
      return;
    }
    
    try {
      // Delete all messages for current user from database
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Error clearing chat:", error);
        toast.error("Failed to clear chat history");
        return;
      }

      // Reset to welcome message
      setMessages([
        {
          id: "welcome",
          content: `Hello ${getUserName()}! I'm Nexus, your AI assistant. How can I help you today?`,
          role: "assistant",
          timestamp: new Date(),
        },
      ]);
      
      toast.success("Chat cleared");
    } catch (error) {
      console.error("Error clearing chat:", error);
      toast.error("Failed to clear chat history");
    }
  }, [session?.user?.id]);

  return {
    messages,
    isLoading,
    sendMessage,
    generateImage,
    uploadAttachment,
    clearChat,
  };
}
