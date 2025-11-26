import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";
import { Avatar } from "@/components/shared/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Menu, Trash2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  onClearChat: () => void;
}

export function ChatHeader({ onClearChat }: ChatHeaderProps) {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Logo */}
        <Logo size="sm" />

        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClearChat} className="text-muted-foreground">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Chat
          </Button>

          <div className="h-8 w-px bg-border" />

          <div className="flex items-center gap-3">
            <Avatar type="user" name={user?.name} size="sm" />
            <div className="text-sm">
              <p className="font-medium text-foreground">{user?.name}</p>
              {user?.email && (
                <p className="text-xs text-muted-foreground">{user.email}</p>
              )}
            </div>
          </div>

          <Button variant="ghost" size="icon-sm" onClick={logout} title="Logout">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "sm:hidden overflow-hidden transition-all duration-200 border-t border-border",
          isMobileMenuOpen ? "max-h-48" : "max-h-0"
        )}
      >
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <Avatar type="user" name={user?.name} size="sm" />
            <div className="text-sm">
              <p className="font-medium text-foreground">{user?.name}</p>
              {user?.email && (
                <p className="text-xs text-muted-foreground">{user.email}</p>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              onClearChat();
              setIsMobileMenuOpen(false);
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Chat
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
