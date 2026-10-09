import { useNavigate } from 'react-router-dom';
import { Video, Trash2, Clock, ArrowUpRight } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import { useDeleteMeeting } from '../../hooks/useMeetings.js';

export default function MeetingCard({ meeting }) {
  const navigate = useNavigate();
  const deleteMeeting = useDeleteMeeting();
  return <Card className="lift-on-hover flex items-center justify-between gap-3 rounded-2xl p-4 sm:p-5">
    <div className="flex min-w-0 items-center gap-3.5"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff0e9] text-primary"><Video className="h-5 w-5"/></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-text">{meeting.title}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-text-muted"><Clock className="h-3 w-3"/>{new Date(meeting.createdAt).toLocaleString()}</p></div></div>
    <div className="flex shrink-0 items-center gap-1.5"><Button size="sm" variant="secondary" className="rounded-full" onClick={()=>navigate(`/meeting/${meeting.roomId}`)}>Open <ArrowUpRight className="h-3.5 w-3.5"/></Button><Button size="sm" variant="ghost" className="rounded-full px-2.5" onClick={()=>deleteMeeting.mutate(meeting._id)} aria-label="Delete meeting"><Trash2 className="h-4 w-4 text-danger"/></Button></div>
  </Card>;
}
