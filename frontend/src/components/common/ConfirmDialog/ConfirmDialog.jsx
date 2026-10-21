import React from "react";
import { AlertTriangle } from "lucide-react";
import Modal from "../Modal/Modal";

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  confirmType = "danger",
  loading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className={`btn btn-sm ${confirmType === "danger" ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </>
      }
    >
      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", padding: "8px 0" }}>
        <div
          style={{
            backgroundColor: "#fef2f2",
            color: "#dc2626",
            padding: "10px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={24} />
        </div>
        <div>
          <p style={{ color: "#334155", fontSize: "0.95rem", lineHeight: 1.5 }}>{message}</p>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
