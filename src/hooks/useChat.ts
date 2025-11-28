import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Message, Attachment } from "@/types";

const generateId = () =>
  Math.random().toString(36).substring(2) + Date.now().toString(36);

const API_URL = "https://chatbot-nexus-server.onrender.com";

export function useChat() {
  const { session, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // -----------------------------------------------------
  // ✅ Fetch full chat history from MongoDB (CORRECT ENDPOINT)
  // -----------------------------------------------------
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/history`);
        const data = await res.json();

        if (!Array.isArray(data)) return;

        const loaded = data.map((msg: any) => ({
          id: generateId(),
          role: msg.user ? "user" : "assistant",
          content: msg.user || msg.bot,
          timestamp: new Date(msg.timestamp),
          imageUrl: msg.imageUrl,
        }));

        if (loaded.length > 0) {
          setMessages(loaded);
        } else {
          setMessages([
            {
              id: "welcome",
              role: "assistant",
              content: `Hello ${getUserName()}! I'm Nexus, your AI assistant. How can I help you today?`,
              timestamp: new Date(),
            },
          ]);
        }
      } catch (e) {
        console.error("History load failed:", e);
      }
    };

    loadHistory();
  }, []);

  // -----------------------------------------------------
  // SAVE MESSAGE TO MONGO (this route exists)
  // -----------------------------------------------------
  const saveMessageToMongo = async (message: any) => {
    try {
      await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });
    } catch (e) {
      console.error("Save failed:", e);
    }
  };

  const getUserName = () =>
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";

  // -----------------------------------------------------
  // SEND MESSAGE (AI LOGIC UNTOUCHED)
  // -----------------------------------------------------
  const sendMessage = useCallback(
    async (content: string, attachments?: Attachment[]) => {
      if (!content.trim() || isLoading) return;

      let imageBase64: string | undefined;
      if (attachments?.length && attachments[0].type.startsWith("image/")) {
        imageBase64 = attachments[0].base64 || attachments[0].url;
      }

      // Add user message to UI
      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content,
        timestamp: new Date(),
        imageUrl: imageBase64 ? "image_attached" : undefined,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Save user message
      saveMessageToMongo({
        role: "user",
        content,
        imageUrl: imageBase64 ? "image_attached" : undefined,
        timestamp: new Date(),
      });

      // Loading placeholder
      const loadingId = generateId();
      setMessages((prev) => [
        ...prev,
        {
          id: loadingId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
          isLoading: true,
        },
      ]);

      try {
        const conversationHistory = messages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // ⭐ AI LOGIC — DO NOT TOUCH (preserved exactly)
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

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let full = "";

        if (reader) {
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;

              const jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") continue;

              try {
                const parsed = JSON.parse(jsonStr);
                const text = parsed.choices?.[0]?.delta?.content;

                if (text) {
                  full += text;

                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === loadingId
                        ? { ...m, content: full, isLoading: false }
                        : m
                    )
                  );
                }
              } catch {}
            }
          }
        }

        // Save assistant reply
        if (full) {
          saveMessageToMongo({
            role: "assistant",
            content: full,
            timestamp: new Date(),
          });
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to send message");
      } finally {
        setIsLoading(false);
      }
    },
    [session, messages, isLoading]
  );

  // -----------------------------------------------------
  // CLEAR CHAT — CORRECT ENDPOINT
  // -----------------------------------------------------
  const clearChat = async () => {
    try {
      await fetch(`${API_URL}/history`, { method: "DELETE" });

      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Hello ${getUserName()}! I'm Nexus, your AI assistant. How can I help you today?`,
          timestamp: new Date(),
        },
      ]);

      toast.success("Chat cleared!");
    } catch (e) {
      toast.error("Failed to clear");
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
  };
}
