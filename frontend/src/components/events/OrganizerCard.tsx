import { Building2 } from 'lucide-react';
import { getInitials } from '../../lib/utils';

interface OrganizerCardProps {
  organizerName: string;
}

export function OrganizerCard({ organizerName }: OrganizerCardProps) {
  const initials = getInitials(organizerName);

  return (
    <section
      aria-labelledby="organizer-heading"
      className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <div
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-sm font-bold text-[#0F0E0C]"
      >
        {initials}
      </div>
      <div className="min-w-0 space-y-0.5">
        <h2 id="organizer-heading" className="truncate text-base font-semibold text-text">
          {organizerName}
        </h2>
        <p className="inline-flex items-center gap-1.5 text-xs text-text-muted">
          <Building2 className="h-3.5 w-3.5 text-highlight" aria-hidden="true" />
          <span>Event organizer</span>
        </p>
      </div>
    </section>
  );
}
