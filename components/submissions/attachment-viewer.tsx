"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { SubmissionAttachment } from "@/lib/submission-attachments";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submissionId: string;
  attachments: SubmissionAttachment[];
  initialIndex?: number;
};

type SignedUrlResponse = {
  url: string;
  fileName: string;
  contentType: string;
};

export function AttachmentViewer({
  open,
  onOpenChange,
  submissionId,
  attachments,
  initialIndex = 0,
}: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<SignedUrlResponse | null>(null);

  const current = attachments[index];
  const hasMultiple = attachments.length > 1;

  useEffect(() => {
    if (open) {
      setIndex(initialIndex);
    }
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open || !submissionId || !current) {
      return;
    }

    let cancelled = false;

    async function loadSignedUrl() {
      setLoading(true);
      setError(null);
      setSignedUrl(null);

      try {
        const response = await fetch(
          `/api/submissions/signed-url?submissionId=${encodeURIComponent(submissionId)}`,
        );
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Failed to load attachment.");
        }

        if (!cancelled) {
          setSignedUrl(data as SignedUrlResponse);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load attachment.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSignedUrl();

    return () => {
      cancelled = true;
    };
  }, [open, submissionId, current]);

  function goPrev() {
    setIndex((value) => Math.max(0, value - 1));
  }

  function goNext() {
    setIndex((value) => Math.min(attachments.length - 1, value + 1));
  }

  if (!current) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-4xl overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="text-[#1b3a57]">{current.label}</DialogTitle>
          <DialogDescription>
            {hasMultiple ? `${index + 1} of ${attachments.length} attachments` : "Assessment PDF"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-[50vh] flex-col bg-slate-50">
          {loading ? (
            <div className="flex flex-1 flex-col gap-3 p-6">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="flex-1 min-h-[400px]" />
            </div>
          ) : error ? (
            <div className="flex flex-1 items-center justify-center p-6">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : signedUrl ? (
            <iframe
              title={signedUrl.fileName}
              src={signedUrl.url}
              className="h-[60vh] w-full border-0 bg-white"
            />
          ) : null}
        </div>

        <DialogFooter className="flex flex-row items-center justify-between border-t px-6 py-4 sm:justify-between">
          <div className="flex items-center gap-2">
            {hasMultiple ? (
              <>
                <Button variant="outline" size="icon" onClick={goPrev} disabled={index === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goNext}
                  disabled={index === attachments.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {signedUrl ? (
              <>
                <Button variant="outline" asChild>
                  <a href={signedUrl.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Open
                  </a>
                </Button>
                <Button
                  asChild
                  className="bg-[#009CD9] text-white hover:bg-[#0077a3]"
                >
                  <a href={signedUrl.url} download={signedUrl.fileName}>
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </Button>
              </>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
