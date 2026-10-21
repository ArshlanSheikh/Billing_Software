import React, { useEffect } from "react";
import { X } from "lucide-react";
import styles from "./Modal.module.css";

const Modal = ({ isOpen, onClose, title, children, footer, size = "md" }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  let sizeClass = "";
  if (size === "lg") sizeClass = styles.modalLg;
  if (size === "xl") sizeClass = styles.modalXl;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={`${styles.modal} ${sizeClass}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
