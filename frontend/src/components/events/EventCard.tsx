import type { KeyboardEvent } from "react";
import {
  AlertCircle,
  Ban,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Ticket,
  Users,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { ComputedBadgeVariant, Event } from "../../types/event";
import { cn, formatEventDate, getEventAvailability } from "../../lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { ProgressBar } from "../ui/ProgressBar";
import { useAppSelector } from "../../store";

interface EventCardProps {
  event: Event;
  isRegistered?: boolean;
  onToggleRegister?: (eventId: string) => void;
}

function getBadgeIcon(variant: ComputedBadgeVariant) {
  switch (variant) {
    case "registered":
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    case "few-left":
      return <AlertCircle className="h-3.5 w-3.5" />;
    case "full":
    case "canceled":
      return <Ban className="h-3.5 w-3.5" />;
    default:
      return <Ticket className="h-3.5 w-3.5" />;
  }
}

export function EventCard({
  event,
  isRegistered = false,
}: EventCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const isOrganizer = user?.role === "organizer";
  const isEventOwner = isOrganizer && user?.id === event.organizerId;

  const availability = getEventAvailability(event, isRegistered);
  const { dateLabel, timeLabel } = formatEventDate(
    event.startAt,
    event.timezone,
  );

  const isCanceled = event.status === "canceled";
  const isFull = availability.badgeVariant === "full";
  const isActionDisabled = availability.isDisabled;

  const placesText = isCanceled
    ? "Event canceled"
    : event.status === "completed"
      ? "Event completed"
    : isFull
      ? "0 places left"
      : `${availability.placesRemaining} of ${event.capacity} places left`;

  const handleOpenDetails = () => {
    navigate(isAuthenticated && (!isOrganizer || isEventOwner)
      ? `/dashboard/events/${event.id}`
      : `/event-details/${event.id}`);
  };

  const handleCardKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleOpenDetails();
    }
  };

  return (
    <motion.article
      role="link"
      tabIndex={0}
      aria-label={`View details for ${event.title}`}
      onClick={handleOpenDetails}
      onKeyDown={handleCardKeyDown}
      whileHover={
        prefersReducedMotion
          ? undefined
          : {
              y: -4,
              boxShadow: "0 0 24px rgba(255, 106, 43, 0.30)",
            }
      }
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group flex w-full cursor-pointer flex-col rounded-2xl border border-[#1A1713]/12 bg-white/65 backdrop-blur-md p-5 sm:p-6 transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#F0C9A5]",
        isCanceled ? "opacity-85" : "hover:border-primary/55 hover:bg-white/75",
      )}
    >
      {" "}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-[#5C5246] min-w-0">
          <Building2
            className="h-3.5 w-3.5 shrink-0 text-[#9A340A]"
            aria-hidden="true"
          />
          <span className="truncate">{event.organizerName}</span>
        </div>
        <Badge
          tone="light"
          variant={availability.badgeVariant}
          icon={getBadgeIcon(availability.badgeVariant)}
        >
          {isEventOwner
            ? event.status[0].toUpperCase() + event.status.slice(1)
            : availability.badgeLabel}
        </Badge>
      </div>
      <h3 className="mt-4 text-lg font-semibold leading-snug text-[#1A1713] line-clamp-1">
        {event.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-[#5C5246] line-clamp-2">
        {event.description}
      </p>
      <div className="mt-5 space-y-2.5 border-t border-[#1A1713]/10 pt-4 text-xs text-[#5C5246]">
        <div className="flex items-center gap-2">
          <Calendar
            className="h-3.5 w-3.5 shrink-0 text-[#5C5246]"
            aria-hidden="true"
          />
          <span className="truncate">{dateLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock
            className="h-3.5 w-3.5 shrink-0 text-[#5C5246]"
            aria-hidden="true"
          />
          <span className="truncate">{timeLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin
            className="h-3.5 w-3.5 shrink-0 text-[#5C5246]"
            aria-hidden="true"
          />
          <span className="truncate">{event.location}</span>
        </div>
      </div>
      <div className="mt-auto pt-5 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 font-medium tabular-nums",
                availability.badgeVariant === "few-left"
                  ? "text-[#92400E]"
                  : isFull || isCanceled
                    ? "text-[#991B1B]"
                    : "text-[#5C5246]",
              )}
            >
              <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {isEventOwner
                ? `${event.registered} registered · ${availability.placesRemaining} places left`
                : placesText}
            </span>
            <span className="tabular-nums text-[#5C5246]">
              {availability.percentFilled}% filled
            </span>
          </div>
          <ProgressBar
            tone="light"
            value={availability.percentFilled}
            variant={availability.badgeVariant}
            label={`${event.title} capacity filled`}
          />
        </div>

        {isEventOwner ? (
          <Button
            variant="outline"
            size="md"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/dashboard/events/${event.id}`);
            }}
            className="w-full border-[#1A1713]/15 bg-white/35 text-[#3F372E] hover:bg-white/60"
            aria-label={`Manage ${event.title}`}
          >
            Manage
          </Button>
        ) : isOrganizer ? null : (
          <Button
            variant={
              isRegistered
                ? "secondary"
                : isActionDisabled
                  ? "outline"
                  : "primary"
            }
            size="md"
            disabled={isActionDisabled}
            onClick={(e) => {
              e.stopPropagation();
              navigate('/auth');
            }}
            aria-pressed={isRegistered}
            className={cn(
              "w-full",
              isRegistered &&
                "border-[#1F6F3D]/30 bg-[#1F6F3D]/12 text-[#165B31] hover:bg-[#1F6F3D]/20",
              isActionDisabled &&
                "border-[#1A1713]/15 bg-[#1A1713]/8 text-[#5C5246]",
            )}
          >
            {isCanceled ? (
              <>
                <Ban className="h-4 w-4" aria-hidden="true" />
                Canceled
              </>
            ) : isFull ? (
              <>
                <Ban className="h-4 w-4" aria-hidden="true" />
                Full
              </>
            ) : isRegistered ? (
              <>
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Registered
              </>
            ) : (
              <>
                <Ticket className="h-4 w-4" aria-hidden="true" />
                Register
              </>
            )}
          </Button>
        )}
      </div>
    </motion.article>
  );
}
