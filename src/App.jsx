import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import StageShell from '@/components/stage/StageShell';
import StageProvider from '@/components/stage/StageProvider';
import Home from '@/pages/Home';
import Library from '@/pages/Library';
import Setlists from '@/pages/Setlists';
import Viewer from '@/pages/ScoreViewer';
import Performance from '@/pages/ShowMode';
import Bands from '@/pages/Bands';
import BandCreate from '@/pages/BandCreate';
import BandDetail from '@/pages/BandDetail';
import BandShow from '@/pages/BandShow';
import BandLive from '@/pages/BandLive';
import BandInvite from '@/pages/BandInvite';
import Profile from '@/pages/MusicianProfile';
import Onboarding from '@/pages/WelcomeStage';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<StageShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/biblioteca" element={<Library />} />
          <Route path="/repertorios" element={<Setlists />} />
          <Route path="/favoritos" element={<Library favoritesOnly />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/modo-banda" element={<Bands />} />
          <Route path="/modo-banda/crear" element={<BandCreate />} />
          <Route path="/modo-banda/invitar/:code" element={<BandInvite />} />
          <Route path="/modo-banda/:id" element={<BandDetail />} />
          <Route path="/modo-banda/:id/show/:showId" element={<BandShow />} />
          <Route path="/bienvenida" element={<Onboarding />} />
        </Route>
        <Route path="/visor/:id" element={<StageShell />}><Route index element={<Viewer />} /></Route>
        <Route path="/presentacion/:id" element={<StageProvider><Performance /></StageProvider>} />
        <Route path="/modo-banda/:id/en-vivo" element={<BandLive />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App