import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import MeetingCard from '../components/dashboard/MeetingCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useMeetings, useCreateMeeting } from '../hooks/useMeetings.js';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: meetings, isLoading } = useMeetings();
  const createMeeting = useCreateMeeting();
  const [joinCode, setJoinCode] = useState('');

  const handleCreate = async () => {
    try {
      const meeting = await createMeeting.mutateAsync('Untitled Meeting');
      navigate(`/meeting/${meeting.roomId}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    navigate(`/meeting/${joinCode.trim()}`);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Card className="p-6">
        <h1 className="text-lg font-semibold text-text">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="mt-1 text-sm text-text-secondary">
          You've hosted {user?.meetingsHosted ?? 0} and joined {user?.meetingsJoined ?? 0} meetings.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button onClick={handleCreate} isLoading={createMeeting.isPending}>
            <Plus className="h-4 w-4" /> New meeting
          </Button>

          <form onSubmit={handleJoin} className="flex flex-1 gap-2">
            <Input
              placeholder="Enter room code to join"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
            />
            <Button type="submit" variant="secondary">
              <LogIn className="h-4 w-4" /> Join
            </Button>
          </form>
        </div>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-text-secondary">Recent meetings</h2>
        {isLoading && <p className="text-sm text-text-muted">Loading…</p>}
        {!isLoading && meetings?.length === 0 && (
          <Card className="p-8 text-center text-sm text-text-muted">
            No meetings yet — create one to get started.
          </Card>
        )}
        <div className="space-y-3">
          {meetings?.map((m) => (
            <MeetingCard key={m._id} meeting={m} />
          ))}
        </div>
      </div>
    </div>
  );
}
