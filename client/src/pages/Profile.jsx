import { useState } from 'react';
import toast from 'react-hot-toast';
import Card from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import PasswordInput from '../components/auth/PasswordInput.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/profile', { name });
      setUser(data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangingPassword(true);
    try {
      await api.put('/profile/password', passwords);
      toast.success('Password updated');
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-text">{user?.name}</p>
            <p className="text-sm text-text-muted">{user?.email}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4">
          <div>
            <p className="text-xs text-text-muted">Meetings hosted</p>
            <p className="text-lg font-semibold text-text">{user?.meetingsHosted ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Meetings joined</p>
            <p className="text-lg font-semibold text-text">{user?.meetingsJoined ?? 0}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-text">Edit profile</h2>
        <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-text-secondary">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button type="submit" isLoading={saving}>Save changes</Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-text">Change password</h2>
        <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-text-secondary">Current password</label>
            <PasswordInput
              value={passwords.currentPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-text-secondary">New password</label>
            <PasswordInput
              value={passwords.newPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
            />
          </div>
          <Button type="submit" variant="secondary" isLoading={changingPassword}>
            Update password
          </Button>
        </form>
      </Card>
    </div>
  );
}
