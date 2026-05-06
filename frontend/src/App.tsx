import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import ErrorBoundary from '@components/common/ErrorBoundary';
import PageTransition from '@components/common/PageTransition';
import ProtectedRoute from '@components/common/ProtectedRoute';

// ─── Lazy-loaded page components (code-split per route) ──────
const Home = lazy(() => import('@pages/home'));
const BookClub = lazy(() => import('@pages/bookclub/:id'));
const BookClubPage = lazy(() => import('@pages/BookClubDetails/:id'));
const NewBookClubPage = lazy(() => import('@pages/createbookclub'));
const ChangeProfilePage = lazy(() => import('@pages/changeProfile'));
const ProfilePage = lazy(() => import('@pages/Profile/:id'));
const DiscoverBookClubs = lazy(() => import('@pages/discover'));
const InviteJoinPage = lazy(() => import('@pages/invite/:code'));
const BookclubSettings = lazy(() => import('@pages/BookclubSettings'));
const DMChatPage = lazy(() => import('@pages/DMChat'));
const FindPeople = lazy(() => import('@pages/people'));
const ResetPasswordPage = lazy(() => import('@pages/ResetPassword'));
const VerifyEmailPage = lazy(() => import('@pages/VerifyEmail'));

/** Minimal fallback while a lazy chunk loads. */
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-8 h-8 border-4 border-stone-300 border-t-stone-700 rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <PageTransition>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/bookclub/:id" element={<ProtectedRoute><BookClub /></ProtectedRoute>} />
            <Route path="/bookclubpage/:id" element={<BookClubPage />} />
            <Route path="/create-bookclub" element={<ProtectedRoute><NewBookClubPage /></ProtectedRoute>} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/change-profile" element={<ProtectedRoute><ChangeProfilePage /></ProtectedRoute>} />
            <Route path="/discover" element={<DiscoverBookClubs />} />
            <Route path="/invite/:code" element={<InviteJoinPage />} />
            <Route path="/bookclub-settings/:id" element={<ProtectedRoute><BookclubSettings /></ProtectedRoute>} />
            <Route path="/dm/:userId?" element={<ProtectedRoute><DMChatPage /></ProtectedRoute>} />
            <Route path="/people" element={<ProtectedRoute><FindPeople /></ProtectedRoute>} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
          </Routes>
        </PageTransition>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;