import Card from '../components/ui/Card.jsx';
import MeetingCard from '../components/dashboard/MeetingCard.jsx';
import { useMeetings } from '../hooks/useMeetings.js';

export default function Meetings() {
  const { data: meetings, isLoading } = useMeetings();

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-lg font-semibold text-text">All meetings</h1>
      {isLoading && <p className="text-sm text-text-muted">Loading…</p>}
      {!isLoading && meetings?.length === 0 && (
        <Card className="p-8 text-center text-sm text-text-muted">No meetings yet.</Card>
      )}
      <div className="space-y-3">
        {meetings?.map((m) => (
          <MeetingCard key={m._id} meeting={m} />
        ))}
      </div>
    </div>
  );
}
