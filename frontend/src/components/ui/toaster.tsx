import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { CircleCheck, TriangleAlert, X } from 'lucide-react';

type ToastVariant = 'default' | 'destructive';

interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface Toast extends ToastInput {
  id: number;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (input: ToastInput) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((input: ToastInput) => {
    const id = ++nextId.current;
    setToasts((current) => [...current, { ...input, id }]);
    window.setTimeout(() => dismiss(id), input.duration ?? 4500);
  }, [dismiss]);

  return <ToastContext.Provider value={{ toasts, toast, dismiss }}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return { toast: context.toast };
}

export function Toaster() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('Toaster must be rendered within ToastProvider');

  return (
    <div aria-live="polite" aria-relevant="additions removals" className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
      {context.toasts.map((item) => {
        const isDestructive = item.variant === 'destructive';
        const Icon = isDestructive ? TriangleAlert : CircleCheck;
        return (
          <div key={item.id} role={isDestructive ? 'alert' : 'status'} className="pointer-events-auto flex items-start gap-3 rounded-xl border border-white/10 bg-[#181714] p-4 text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${isDestructive ? 'text-[#F0786B]' : 'text-[#8FD18A]'}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{item.title}</p>
              {item.description && <p className="mt-1 text-sm leading-relaxed text-white/70">{item.description}</p>}
            </div>
            <button type="button" aria-label="Dismiss notification" onClick={() => context.dismiss(item.id)} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
