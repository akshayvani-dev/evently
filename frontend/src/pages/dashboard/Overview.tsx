import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useAppSelector } from '../../store';

export function Overview() {
  const user = useAppSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const isOrganizer = user?.role === 'organizer';

  return (
    <section className="rounded-3xl border border-white/12 bg-white/[0.045] px-6 py-10 sm:px-10 sm:py-14">
      <p className="text-sm font-medium text-[#F5C84B]">
        {isOrganizer ? 'Organizer overview' : 'Attendee dashboard'}
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {user?.name ? `Welcome back, ${user.name}` : 'Welcome back'}
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
        {isOrganizer
          ? 'Your events and organizer tools are ready. Create an event to get started.'
          : 'Your account is ready. Check event details for schedules, locations, and registration information.'}
      </p>
      {isOrganizer && (
        <Button variant="gradient" size="md" className="mt-7" onClick={() => navigate('/dashboard/events/create')}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create event
        </Button>
      )}
    </section>
  );
}

export default Overview;
