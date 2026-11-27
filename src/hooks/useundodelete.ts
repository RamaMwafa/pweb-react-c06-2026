
import { useState, useRef, useEffect } from "react";
import type { Application } from "../types";

interface DeletedApplication {
  application: Application;
  originalIndex: number;
}

type ApplicationSetter = (
  value:
    | Application[]
    | ((prev: Application[]) => Application[])
) => void;

export function useUndoDelete(
  applications: Application[],
  setApplications: ApplicationSetter
) {
  const [deleted, setDeleted] =
    useState<DeletedApplication | null>(null);

  const timerRef = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);

  const deletedRef =
    useRef<DeletedApplication | null>(null);

  function clearTimer() {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function deleteApplication(id: string) {
    const originalIndex = applications.findIndex(
      (application) => application.id === id
    );

    if (originalIndex === -1) return;

    const application =
      applications[originalIndex];

    // Bersihkan timer sebelumnya.
    clearTimer();

    const deletedItem: DeletedApplication = {
      application,
      originalIndex,
    };

    deletedRef.current = deletedItem;
    setDeleted(deletedItem);

    setApplications((prev) =>
      prev.filter((app) => app.id !== id)
    );

    timerRef.current = setTimeout(() => {
      deletedRef.current = null;
      setDeleted(null);
      timerRef.current = null;
    }, 5000);
  }

  function undoDelete() {
    const item = deletedRef.current;

    if (!item) return;

    clearTimer();

    setApplications((prev) => {
      const alreadyExists = prev.some(
        (app) =>
          app.id === item.application.id ||
          (
            app.company.trim().toLowerCase() ===
              item.application.company.trim().toLowerCase() &&
            app.role.trim().toLowerCase() ===
              item.application.role.trim().toLowerCase()
          )
      );

      if (alreadyExists) return prev;

      const index = Math.min(
        item.originalIndex,
        prev.length
      );

      return [
        ...prev.slice(0, index),
        item.application,
        ...prev.slice(index),
      ];
    });

    deletedRef.current = null;
    setDeleted(null);
  }

  function dismissUndo() {
    clearTimer();
    deletedRef.current = null;
    setDeleted(null);
  }

  // Cleanup ketika komponen pemilik hook unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    deleted,
    deleteApplication,
    undoDelete,
    dismissUndo,
  };
}
