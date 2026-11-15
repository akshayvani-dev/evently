import { CalendarCheck, Compass, Ticket } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Container } from '../ui/Container';
import { SectionHeading } from '../ui/SectionHeading';

const STEPS = [
  {
    step: '01. Discover',
    description:
      'Explore live sessions, conferences, workshops, and local gatherings filtered by search query, organizer, or date.',
    icon: Compass,
  },
  {
    step: '02. Register',
    description:
      'Reserve your seat in seconds with live capacity counts, clear availability states, and instant confirmation.',
    icon: Ticket,
  },
  {
    step: '03. Attend',
    description:
      'Arrive prepared with local time-zone schedules, venue details, and streamlined check-in at the door.',
    icon: CalendarCheck,
  },
] as const;

export function HowItWorks() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="how-it-works" className="py-10 sm:py-14">
      <Container className="space-y-8">
        <SectionHeading
          eyebrow="How it works"
          title="From discovery to check-in in three simple steps"
          description="Built so attendees spend less time hunting for details and organizers spend less time coordinating logistics."
        />

        <motion.div
          initial={prefersReducedMotion ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: prefersReducedMotion ? 0 : 0.1,
              },
            },
          }}
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          {STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.step}
                variants={
                  prefersReducedMotion
                    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
                    : {
                        hidden: { opacity: 0, y: 16 },
                        visible: {
                          opacity: 1,
                          y: 0,
                          transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
                        },
                      }
                }
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 sm:p-7 space-y-4"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary-hover">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-[#F4EFE6]">{item.step}</h3>
                <p className="text-sm leading-relaxed text-[#BFB6A8]">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
}
