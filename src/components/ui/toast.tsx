"use client";

import { useEffect } from "react";

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className="fixed bottom-6 right-6 z-50 max-w-sm rounded-delicate border border-border bg-background-elevated px-4 py-3 text-sm font-medium text-foreground shadow-lg"
      role="status"
    >
      {message}
    </div>
  );
}
