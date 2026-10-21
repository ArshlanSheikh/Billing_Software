import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "420px",
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => {
          let bg = "#1e293b";
          let border = "#334155";
          let Icon = Info;
          let iconColor = "#38bdf8";

          if (toast.type === "success") {
            bg = "#064e3b";
            border = "#059669";
            Icon = CheckCircle2;
            iconColor = "#34d399";
          } else if (toast.type === "error") {
            bg = "#7f1d1d";
            border = "#dc2626";
            Icon = AlertCircle;
            iconColor = "#f87171";
          } else if (toast.type === "warning") {
            bg = "#78350f";
            border = "#d97706";
            Icon = AlertTriangle;
            iconColor = "#fbbf24";
          }

          return (
            <div
              key={toast.id}
              style={{
                backgroundColor: bg,
                border: `1px solid ${border}`,
                color: "#ffffff",
                padding: "12px 16px",
                borderRadius: "10px",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontSize: "0.875rem",
                pointerEvents: "auto",
                animation: "toastIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <Icon size={18} color={iconColor} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, wordBreak: "break-word" }}>{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#cbd5e1",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "2px",
                }}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
