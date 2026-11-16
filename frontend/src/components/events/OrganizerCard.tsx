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
      className="flex items-center gap-3 rounded-2xl border border-[#1A1713]/12 bg-white/80 p-4 shadow-sm sm:p-5"
    >
      <div
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#9A340A]/10 text-sm font-bold text-[#9A340A]"
      >
        {initials}
      </div>
      <div className="min-w-0 space-y-0.5">
        <h2 id="organizer-heading" className="truncate text-base font-semibold text-[#1A1713]">
          {organizerName}
        </h2>
        <p className="inline-flex items-center gap-1.5 text-xs text-[#5C5246]">
          <Building2 className="h-3.5 w-3.5 text-[#9A340A]" aria-hidden="true" />
          <span>Event organizer</span>
        </p>
      </div>
    </section>
  );
}
