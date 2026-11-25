
import { Trash2, X } from "lucide-react";
import type { Application } from "../types";
import "./warroom.css";

interface UndoToastProps {
  application: Application;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoToast({
  application,
  onUndo,
  onDismiss,
}: UndoToastProps) {
  return (
    <div className="undo-toast" role="status">
      <div className="undo-toast-icon">
        <Trash2 size={19} />
      </div>

      <div className="undo-toast-content">
        <strong>Lamaran dihapus</strong>

        <p>
          Lamaran {application.company} telah dihapus.
          Kamu memiliki waktu 5 detik untuk Undo.
        </p>
      </div>

      <button
        type="button"
        className="undo-toast-button"
        onClick={onUndo}
      >
        Undo
      </button>

      <button
        type="button"
        className="undo-toast-close"
        onClick={onDismiss}
        aria-label="Tutup notifikasi"
      >
        <X size={17} />
      </button>
    </div>
  );
}
