import { ArrowRight, CalendarPlus } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { smoothScrollTo } from '../../lib/utils';
import { Container } from '../ui/Container';
import { Button } from '../ui/Button';

export function CtaBanner() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="cta" className="py-10 sm:py-14">
      <Container>
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-6 py-12 text-center sm:px-12 sm:py-14"
        >
          <div className="relative mx-auto max-w-2xl space-y-5">
            <h2 className="text-2xl font-bold tracking-tight text-[#F4EFE6] sm:text-4xl [text-wrap:balance]">
              Ready to bring people together?
            </h2>
            <p className="text-base leading-relaxed text-[#A8A094] sm:text-lg">
              Publish your next event page in minutes or find a gathering worth
              clearing your calendar for.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
              <Button
                variant="gradient"
                size="lg"
                onClick={() => smoothScrollTo('#events')}
              >
                Explore events
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => smoothScrollTo('#for-organizers')}
                className="border-white/15 bg-white/5 text-[#F4EFE6] hover:border-white/30 hover:bg-white/10"
              >
                <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                For organizers
              </Button>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
