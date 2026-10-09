import { useEffect, useRef } from 'react';
import { MicOff, UserRound } from 'lucide-react';

export default function VideoTile({ stream, name, muted, isSelf, isMicMuted, isCameraOff }) {
  const videoRef=useRef(null);
  useEffect(()=>{if(videoRef.current&&stream)videoRef.current.srcObject=stream;},[stream]);
  const initials=(name||'G').split(' ').map(part=>part[0]).join('').slice(0,2).toUpperCase();
  return <div className="relative aspect-video overflow-hidden rounded-2xl border border-[#e8ded2] bg-[#e8e1d7] shadow-sm">
    <video ref={videoRef} autoPlay playsInline muted={muted} className={`h-full w-full object-cover transition-opacity duration-200 ${stream&&!isCameraOff?'opacity-100':'opacity-0'}`}/>
    {(!stream||isCameraOff)&&<div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#e6dafa] via-[#f9e6dc] to-[#d8eee0]"><div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-white/70 bg-white/75 text-lg font-bold text-[#685b75] shadow-lg">{initials||<UserRound className="h-6 w-6"/>}</div></div>}
    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-[#28231f]/75 to-transparent px-3 pb-3 pt-8"><span className="truncate text-xs font-semibold text-white">{name||'Guest'} {isSelf?'(You)':''}</span>{isMicMuted&&<span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#d94358] text-white"><MicOff className="h-3.5 w-3.5"/></span>}</div>
  </div>;
}
