import { Calendar, ChevronDown, Search, X } from 'lucide-react';
import type { DateFilterOption } from '../../types/event';

const DATE_OPTIONS: ReadonlyArray<{ value: DateFilterOption; label: string }> = [
  { value: 'all', label: 'Any upcoming date' },
  { value: 'this-week', label: 'This week' },
  { value: 'this-month', label: 'This month' },
  { value: 'next-3-months', label: 'Next 3 months' },
];

interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  dateFilter: DateFilterOption;
  onDateFilterChange: (value: DateFilterOption) => void;
}

export function SearchFilter({
  searchQuery,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
}: SearchFilterProps) {
  return (
    <div className="rounded-2xl border border-[#1A1713]/12 bg-white/45 backdrop-blur-md p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <div className="relative md:col-span-8">
          <label htmlFor="event-search" className="sr-only">
            Search events by title, city, or organizer
          </label>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C5246]"
            aria-hidden="true"
          />
          <input
            id="event-search"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events by title, city, or organizer..."
            className="h-11 w-full rounded-xl border border-[#1A1713]/15 bg-white/60 pl-10 pr-10 text-sm text-[#1A1713] placeholder:text-[#5C5246] transition-colors focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search query"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#5C5246] transition-colors hover:bg-[#1A1713]/10 hover:text-[#1A1713] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="relative md:col-span-4">
          <label htmlFor="event-date-filter" className="sr-only">
            Filter events by date range
          </label>
          <Calendar
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C5246]"
            aria-hidden="true"
          />
          <select
            id="event-date-filter"
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value as DateFilterOption)}
            className="h-11 w-full appearance-none rounded-xl border border-[#1A1713]/15 bg-white/60 pl-10 pr-10 text-sm text-[#1A1713] transition-colors focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer"
          >
            {DATE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-[#F6E9DC] text-[#1A1713]">
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C5246]"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
