import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Meetings from './pages/Meetings.jsx';
import Profile from './pages/Profile.jsx';
import MeetingRoom from './pages/MeetingRoom.jsx';
import DashboardLayout from './components/layout/DashboardLayout.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/meeting/:roomId" element={<MeetingRoom />} />

        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/meetings" element={<Meetings />} />
          <Route path="/dashboard/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
