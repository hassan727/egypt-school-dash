'use client';

import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface StatusBarProps {
  isSaving: boolean;
  error: string | null;
  lastSaved: string | null;
}

export function StatusBar({ isSaving, error, lastSaved }: StatusBarProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (lastSaved && !isSaving && !error) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastSaved, isSaving, error]);

  if (!isSaving && !error && !showSuccess) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 left-4 flex flex-row-reverse items-center gap-3 rounded-lg px-4 py-3 shadow-lg transition-all ${
        error
          ? 'bg-destructive text-destructive-foreground'
          : showSuccess
          ? 'bg-green-600 text-white'
          : 'bg-blue-600 text-white'
      }`}
    >
      {isSaving ? (
        <>
          <Clock className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">جاري حفظ البيانات...</span>
        </>
      ) : error ? (
        <>
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{error}</span>
        </>
      ) : (
        <>
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">
            تم الحفظ بنجاح في {lastSaved}
          </span>
        </>
      )}
    </div>
  );
}
