import { useRef, type KeyboardEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { AuthTab } from '../../lib/validation/auth';
import { cn } from '../../lib/utils';

const TABS: ReadonlyArray<{ id: AuthTab; label: string }> = [
  { id: 'signin', label: 'Sign in' },
  { id: 'signup', label: 'Sign up' },
];

interface AuthTabsProps {
  activeTab: AuthTab;
  onTabChange: (tab: AuthTab) => void;
}

export function AuthTabs({ activeTab, onTabChange }: AuthTabsProps) {
  const prefersReducedMotion = useReducedMotion();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      nextIndex = index === 0 ? 1 : 0;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = TABS.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      onTabChange(TABS[nextIndex].id);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Authentication mode"
      className="grid grid-cols-2 rounded-xl border border-border bg-background/70 p-1"
    >
      {TABS.map((tab, index) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            id={`auth-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`auth-panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'relative z-10 h-10 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isActive ? 'text-text' : 'text-text-muted hover:text-text',
            )}
          >
            {isActive ? (
              <motion.span
                layoutId="auth-tab-pill"
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 420, damping: 32 }
                }
                className="absolute inset-0 -z-10 rounded-lg border border-border/80 bg-surface-raised shadow-sm"
                aria-hidden="true"
              />
            ) : null}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
