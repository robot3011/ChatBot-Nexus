// Message types
export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  attachments?: Attachment[];
  generatedImage?: string;
  imageUrl?: string | null;
  isLoading?: boolean;
}

// Attachment types
export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  base64?: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
}

// Form state types
export interface FormState {
  isLoading: boolean;
  error: string | null;
  success: string | null;
}

// User type for UI display (legacy compatibility)
export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  createdAt: Date;
}
