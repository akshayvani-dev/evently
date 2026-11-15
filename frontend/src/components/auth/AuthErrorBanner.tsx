import { AlertCircle } from 'lucide-react';

interface AuthErrorBannerProps {
  message: string | null;
}

export function AuthErrorBanner({ message }: AuthErrorBannerProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-[#F0786B]/30 bg-[#F0786B]/10 px-3.5 py-3 text-xs font-medium text-[#F0786B]"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p className="leading-relaxed">{message}</p>
    </div>
  );
}
