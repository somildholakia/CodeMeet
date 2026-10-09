import { Video, Sparkles } from 'lucide-react';
import Card from '../components/ui/Card.jsx';
import MeetingCard from '../components/dashboard/MeetingCard.jsx';
import { useMeetings } from '../hooks/useMeetings.js';

export default function Meetings() {
  const { data: meetings, isLoading } = useMeetings();
  return <div className="mx-auto max-w-6xl space-y-5">
    <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Your history</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">Meeting library</h1><p className="mt-2 text-sm text-text-secondary">Every session is a chance to make progress together.</p></div><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eee8ff] text-[#8666d7]"><Video className="h-5 w-5"/></span></div>
    {isLoading&&<p className="text-sm text-text-muted">Loading your meetings…</p>}
    {!isLoading&&meetings?.length===0&&<Card className="rounded-2xl border-dashed p-10 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0e9] text-primary"><Sparkles className="h-5 w-5"/></span><h2 className="mt-4 font-semibold text-text">A clean slate.</h2><p className="mt-2 text-sm text-text-secondary">Create a meeting from your workspace and it will show up here.</p></Card>}
    <div className="space-y-3">{meetings?.map(m=><MeetingCard key={m._id} meeting={m}/>)}</div>
  </div>;
}
