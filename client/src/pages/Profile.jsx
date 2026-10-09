import { useState } from 'react';
import { UserRound, Video, Users, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import PasswordInput from '../components/auth/PasswordInput.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name||'');
  const [saving,setSaving]=useState(false);
  const [passwords,setPasswords]=useState({currentPassword:'',newPassword:''});
  const [changingPassword,setChangingPassword]=useState(false);
  const handleSaveProfile=async e=>{e.preventDefault();setSaving(true);try{const {data}=await api.put('/profile',{name});setUser(data.user);toast.success('Profile updated');}catch(err){toast.error(err.message);}finally{setSaving(false);}};
  const handleChangePassword=async e=>{e.preventDefault();setChangingPassword(true);try{await api.put('/profile/password',passwords);toast.success('Password updated');setPasswords({currentPassword:'',newPassword:''});}catch(err){toast.error(err.message);}finally{setChangingPassword(false);}};
  return <div className="mx-auto max-w-4xl space-y-6">
    <div><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">The person behind the code</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">Your profile</h1><p className="mt-2 text-sm text-text-secondary">A few details to keep your workspace personal.</p></div>
    <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
      <Card className="overflow-hidden rounded-2xl"><div className="h-24 bg-[#d9ccff]"><div className="ml-auto mr-6 flex h-full w-24 items-center justify-center rounded-full border-[6px] border-white/30 bg-[#eee8ff] text-[#8666d7]"><Sparkles className="h-9 w-9"/></div></div><div className="px-6 pb-6"><div className="-mt-7 flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white bg-[#dff2e7] text-xl font-bold text-[#287858]">{user?.name?.[0]?.toUpperCase()||'U'}</div><p className="mt-3 text-lg font-semibold text-text">{user?.name}</p><p className="text-sm text-text-muted">{user?.email}</p><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#fff0e9] p-3"><Video className="h-4 w-4 text-primary"/><p className="mt-3 text-xl font-semibold text-text">{user?.meetingsHosted??0}</p><p className="text-[11px] text-text-secondary">Hosted</p></div><div className="rounded-xl bg-[#eee8ff] p-3"><Users className="h-4 w-4 text-[#8666d7]"/><p className="mt-3 text-xl font-semibold text-text">{user?.meetingsJoined??0}</p><p className="text-[11px] text-text-secondary">Joined</p></div></div></div></Card>
      <div className="space-y-5"><Card className="rounded-2xl p-5 sm:p-6"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0e9] text-primary"><UserRound className="h-5 w-5"/></span><div><h2 className="font-semibold text-text">Personal details</h2><p className="text-xs text-text-muted">Update how your name appears.</p></div></div><form onSubmit={handleSaveProfile} className="mt-5 space-y-4"><div><label className="mb-1.5 block text-sm font-medium text-text-secondary">Display name</label><Input value={name} onChange={e=>setName(e.target.value)} required/></div><Button type="submit" isLoading={saving} className="rounded-xl">Save changes</Button></form></Card>
      <Card className="rounded-2xl p-5 sm:p-6"><h2 className="font-semibold text-text">Change password</h2><p className="mt-1 text-xs text-text-muted">Keep your account secure.</p><form onSubmit={handleChangePassword} className="mt-5 space-y-4"><div><label className="mb-1.5 block text-sm font-medium text-text-secondary">Current password</label><PasswordInput value={passwords.currentPassword} onChange={e=>setPasswords(p=>({...p,currentPassword:e.target.value}))} required/></div><div><label className="mb-1.5 block text-sm font-medium text-text-secondary">New password</label><PasswordInput value={passwords.newPassword} onChange={e=>setPasswords(p=>({...p,newPassword:e.target.value}))} required/></div><Button type="submit" variant="secondary" isLoading={changingPassword} className="rounded-xl">Update password</Button></form></Card></div>
    </div>
  </div>;
}
