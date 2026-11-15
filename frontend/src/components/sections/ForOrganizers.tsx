import { useState } from 'react';
import {
  ArrowRight,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Clock,
  FileEdit,
  Globe,
  MapPin,
  Users,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn, smoothScrollTo } from '../../lib/utils';
import { Container } from '../ui/Container';
import { SectionHeading } from '../ui/SectionHeading';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';

const ORGANIZER_BENEFITS = [
  {
    icon: CalendarPlus,
    title: 'Publish in minutes',
    description: 'Draft your event details quietly and publish when you are ready.',
  },
  {
    icon: Users,
    title: 'Simple seat limits',
    description: 'Set a capacity once and let Evently show when spots are running low.',
  },
  {
    icon: Globe,
    title: 'Clear local times',
    description: 'Every listing displays the exact local time zone and venue.',
  },
] as const;

export function ForOrganizers() {
  const [previewState, setPreviewState] = useState<'published' | 'draft'>('published');
  const prefersReducedMotion = useReducedMotion();

  const isPublished = previewState === 'published';

  return (
    <section id="for-organizers" className="py-10 sm:py-14">
      <Container>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 space-y-7"
          >
            <SectionHeading
              eyebrow="For organizers"
              title="Publish clean event pages without the clutter"
              description="Share your schedule, set a seat limit, and keep attendees updated from one straightforward view."
            />

            <div className="space-y-4">
              {ORGANIZER_BENEFITS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-start gap-3.5">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary-hover">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-semibold text-[#F4EFE6]">
                        {item.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-[#BFB6A8]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-1">
              <Button
                variant="gradient"
                size="lg"
                onClick={() => smoothScrollTo('#cta')}
              >
                Start hosting events
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7"
          >
            <div
              aria-label="Event listing preview for organizers"
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 sm:p-8 space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-highlight">
                    Organizer preview
                  </p>
                  <p className="text-sm font-semibold text-[#F4EFE6]">
                    Event listing status
                  </p>
                </div>

                <div
                  role="tablist"
                  aria-label="Toggle listing status preview"
                  className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 p-1"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isPublished}
                    onClick={() => setPreviewState('published')}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      isPublished
                        ? 'bg-white/15 text-[#F4EFE6] shadow-sm'
                        : 'text-[#A8A094] hover:text-[#F4EFE6]',
                    )}
                  >
                    Published
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={!isPublished}
                    onClick={() => setPreviewState('draft')}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      !isPublished
                        ? 'bg-white/15 text-[#F4EFE6] shadow-sm'
                        : 'text-[#A8A094] hover:text-[#F4EFE6]',
                    )}
                  >
                    Draft
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold text-[#F4EFE6]">
                      Design Systems &amp; Motion Workshop
                    </h3>
                    <p className="text-sm text-[#BFB6A8]">
                      Hosted by Fieldwork Studio
                    </p>
                  </div>
                  <Badge
                    variant={isPublished ? 'published' : 'draft'}
                    icon={
                      isPublished ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <FileEdit className="h-3.5 w-3.5" />
                      )
                    }
                  >
                    {isPublished ? 'Published' : 'Draft'}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#BFB6A8]">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    Dec 14, 2026
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    6:00 PM CST
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    Austin, TX
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 border-t border-white/10 pt-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#BFB6A8]">
                    <Users className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    {isPublished ? '17 places left' : 'Not open yet'}
                  </span>
                  <span className="tabular-nums text-[#BFB6A8]">
                    {isPublished ? '31 / 48 seats' : '0 / 48 seats'}
                  </span>
                </div>
                <ProgressBar
                  value={isPublished ? 65 : 0}
                  variant={isPublished ? 'published' : 'draft'}
                  label="Workshop seat availability preview"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
