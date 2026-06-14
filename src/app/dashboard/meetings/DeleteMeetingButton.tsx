"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteMeetingButton({ scheduleId }: { scheduleId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/schedules/${scheduleId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || "삭제에 실패했습니다.");
      }
      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "삭제에 실패했습니다.",
      );
      setIsDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="inline-flex h-9 items-center justify-center rounded-xl bg-red-500 px-3 text-xs font-bold text-white hover:bg-red-600 transition-all disabled:opacity-50"
        >
          {isDeleting ? "삭제 중" : "삭제"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={isDeleting}
          className="inline-flex h-9 items-center justify-center rounded-xl border border-brand-border-gray bg-white px-3 text-xs font-bold text-brand-text-secondary hover:bg-brand-bg-light transition-all"
        >
          취소
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label="모임 삭제"
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand-border-gray bg-white text-brand-text-muted hover:border-red-300 hover:text-red-500 transition-all shadow-sm"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
