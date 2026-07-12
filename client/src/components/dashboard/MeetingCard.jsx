import { useNavigate } from 'react-router-dom';
import { Video, Trash2, Clock } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import { useDeleteMeeting } from '../../hooks/useMeetings.js';

export default function MeetingCard({ meeting }) {
  const navigate = useNavigate();
  const deleteMeeting = useDeleteMeeting();

  return (
    <Card className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Video className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-text">{meeting.title}</p>
          <p className="flex items-center gap-1 text-xs text-text-muted">
            <Clock className="h-3 w-3" />
            {new Date(meeting.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => navigate(`/meeting/${meeting.roomId}`)}>
          Join
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => deleteMeeting.mutate(meeting._id)}
          aria-label="Delete meeting"
        >
          <Trash2 className="h-4 w-4 text-danger" />
        </Button>
      </div>
    </Card>
  );
}
