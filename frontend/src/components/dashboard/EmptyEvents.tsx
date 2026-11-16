import { CalendarDays } from 'lucide-react';

type EventListStatus = 'all' | 'active' | 'draft' | 'canceled' | 'completed';

interface EmptyEventsProps {
  status: EventListStatus;
}

const messages: Record<EventListStatus, string> = {
  all: "You haven't created any events yet.",
  active: "You don't have any active events.",
  draft: "You don't have any draft events.",
  canceled: "You don't have any canceled events.",
  completed: "You don't have any completed events.",
};

export function EmptyEvents({ status }: EmptyEventsProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-[#1A1713]/12 bg-white/70 px-6 py-14 text-center shadow-sm backdrop-blur-md">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1A1713]/8 text-[#5C5246]">
        <CalendarDays className="h-6 w-6" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-[#1A1713]">{messages[status]}</h2>
    </div>
  );
}
