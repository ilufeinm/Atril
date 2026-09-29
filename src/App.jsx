import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import StageShell from '@/components/stage/StageShell';
import StageProvider from '@/components/stage/StageProvider';
import Home from '@/pages/Home';
import Collection from '@/pages/Collection';
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
import Recordings from '@/pages/Recordings';
import RecordingDetail from '@/pages/RecordingDetail';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<StageShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/biblioteca" element={<Collection />} />
        <Route path="/repertorios" element={<Collection />} />
        <Route path="/grabaciones" element={<Recordings />} />
        <Route path="/grabaciones/:id" element={<RecordingDetail />} />
        <Route path="/favoritos" element={<Navigate to="/biblioteca?fav=1" replace />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/modo-banda" element={<Bands />} />
        <Route path="/modo-banda/crear" element={<BandCreate />} />
        <Route path="/modo-banda/invitar/:code" element={<BandInvite />} />
        <Route path="/modo-banda/:id" element={<BandDetail />} />
        <Route path="/modo-banda/:id/show/:showId" element={<BandShow />} />
        <Route path="/modo-banda/:id/en-vivo" element={<BandLive />} />
      </Route>
      <Route path="/bienvenida" element={<StageProvider><Onboarding /></StageProvider>} />
      <Route path="/visor/:id" element={<StageShell />}><Route index element={<Viewer />} /></Route>
      <Route path="/presentacion/:id" element={<StageProvider><Performance /></StageProvider>} />
      <Route path="/en-vivo/:id" element={<StageProvider><Performance singleSong /></StageProvider>} />
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