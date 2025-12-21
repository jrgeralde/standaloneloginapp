"use client";

import { useEffect, useRef, useState } from "react";

export default function MessageModal({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  const okButtonRef = useRef<HTMLButtonElement | null>(null);
  const [visible, setVisible] = useState(false);

  // Auto-focus OK button + close on Enter
  useEffect(() => {
    if (okButtonRef.current) okButtonRef.current.focus();

    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === "Enter") onClose();
    };

    document.addEventListener("keydown", handleEnter);
    return () => document.removeEventListener("keydown", handleEnter);
  }, [onClose]);

  // Animate open
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      className={`fixed bottom-4 right-4 z-[9999] flex max-w-sm flex-col gap-2 
        transition-transform transition-opacity duration-300
        ${visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
    >
      <div className="rounded-lg border border-blue-100 bg-white px-4 py-3 shadow-lg">
        <p className="mb-3 text-sm text-gray-800">{message}</p>
        <div className="flex justify-end">
          <button
            ref={okButtonRef}
            onClick={onClose}
            className="rounded bg-blue-600 px-3 py-1 text-sm font-semibold text-white hover:bg-blue-700"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
