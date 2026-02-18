import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';

// Participant pages
import ParticipantDashboard from './pages/participant/Dashboard';
import BrowseEvents from './pages/participant/BrowseEvents';
import EventDetails from './pages/participant/EventDetails';
import ParticipantProfile from './pages/participant/Profile';
import OrganizersList from './pages/participant/Organizers';
import OrganizerDetail from './pages/participant/OrganizerDetail';

// Organizer pages
import OrganizerDashboard from './pages/organizer/Dashboard';
import CreateEvent from './pages/organizer/CreateEvent';
import OrganizerEventDetail from './pages/organizer/EventDetail';
import OrganizerProfile from './pages/organizer/Profile';
import OngoingEvents from './pages/organizer/OngoingEvents';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import ManageOrganizers from './pages/admin/ManageOrganizers';
import PasswordResets from './pages/admin/PasswordResets';

import './App.css';

function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="main-content">
        {children}
      </main>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Onboarding */}
          <Route path="/onboarding" element={
            <ProtectedRoute allowedRoles={['participant']}>
              <Onboarding />
            </ProtectedRoute>
          } />

          {/* Participant routes */}
          <Route path="/participant/dashboard" element={
            <ProtectedRoute allowedRoles={['participant']}>
              <AppLayout><ParticipantDashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/participant/events" element={
            <ProtectedRoute allowedRoles={['participant']}>
              <AppLayout><BrowseEvents /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/participant/events/:id" element={
            <ProtectedRoute allowedRoles={['participant']}>
              <AppLayout><EventDetails /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/participant/profile" element={
            <ProtectedRoute allowedRoles={['participant']}>
              <AppLayout><ParticipantProfile /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/participant/organizers" element={
            <ProtectedRoute allowedRoles={['participant']}>
              <AppLayout><OrganizersList /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/participant/organizers/:id" element={
            <ProtectedRoute allowedRoles={['participant']}>
              <AppLayout><OrganizerDetail /></AppLayout>
            </ProtectedRoute>
          } />

          {/* Organizer routes */}
          <Route path="/organizer/dashboard" element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <AppLayout><OrganizerDashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/organizer/create-event" element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <AppLayout><CreateEvent /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/organizer/events/:id" element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <AppLayout><OrganizerEventDetail /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/organizer/profile" element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <AppLayout><OrganizerProfile /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/organizer/ongoing" element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <AppLayout><OngoingEvents /></AppLayout>
            </ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AppLayout><AdminDashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/organizers" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AppLayout><ManageOrganizers /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/password-resets" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AppLayout><PasswordResets /></AppLayout>
            </ProtectedRoute>
          } />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
