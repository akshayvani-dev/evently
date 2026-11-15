import { ArrowRight, CalendarDays, Plus } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { smoothScrollTo } from '../../lib/utils';
import { Container } from '../ui/Container';
import { Button } from '../ui/Button';

export function Hero() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="top"
      className="relative overflow-hidden pt-12 pb-10 sm:pt-16 sm:pb-12 lg:pt-20 lg:pb-12"
    >
      <Container className="relative">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="inline-flex items-center justify-center gap-2 text-sm font-medium text-[#9A340A]">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            <span>Event discovery &amp; registration platform</span>
          </p>

          <h1 className="mt-4 text-[clamp(2.35rem,5vw,4rem)] font-bold leading-[1.1] tracking-tight text-[#1A1713] [text-wrap:balance]">
            Host and discover{' '}
            <span className="text-brand-gradient-on-light">unforgettable</span> live
            events
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#5C5246] sm:text-lg">
            A simpler way to host memorable gatherings, manage registrations
            effortlessly, and discover what is happening next.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Button
              variant="gradient"
              size="lg"
              onClick={() => smoothScrollTo('#events')}
              className="focus-visible:ring-offset-[#F6E9DC]"
            >
              Browse events
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => smoothScrollTo('#for-organizers')}
              className="border-[#1A1713]/20 bg-white/35 text-[#1A1713] backdrop-blur-sm hover:border-[#1A1713]/35 hover:bg-white/60 focus-visible:ring-offset-[#F6E9DC]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create an event
            </Button>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
