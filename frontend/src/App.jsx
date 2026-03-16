import { Route, Routes } from "react-router-dom";
import Home from "@pages/home";
import BookClub from "@pages/bookclub/:id";
import ProtectedRoute from "@components/common/ProtectedRoute";
import NewBookClubPage from "@pages/createbookclub";
import ChangeProfilePage from "@pages/changeProfile";
import ProfilePage from "@pages/Profile/:id";
import BookClubPage from "@pages/BookClubDetails/:id";
import DiscoverBookClubs from "@pages/discover";
import InviteJoinPage from "@pages/invite/:code";
import ResetPasswordPage from "@pages/ResetPassword";
import VerifyEmailPage from "@pages/VerifyEmail";
import BookclubSettings from "@pages/BookclubSettings";
import DMChatPage from "@pages/DMChat";
import ErrorBoundary from "@components/common/ErrorBoundary";
import PageTransition from "@components/common/PageTransition";


function App() {
  return (
    <ErrorBoundary>
      <PageTransition>
        <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/bookclub/:id" element={
        <ProtectedRoute>
          <BookClub />
        </ProtectedRoute>
      } />
      <Route path="/bookclubpage/:id" element={<BookClubPage />} />
      <Route path="/create-bookclub" element={
        <ProtectedRoute>
          <NewBookClubPage />
        </ProtectedRoute>
      }/>
      <Route path="/profile/:id" element={<ProfilePage />}/>
      <Route path="/change-profile" element={
        <ProtectedRoute>
          <ChangeProfilePage />
        </ProtectedRoute>
      }/>
      <Route path="/discover" element={<DiscoverBookClubs />}/>
      <Route path="/invite/:code" element={<InviteJoinPage />}/>
      <Route path="/bookclub-settings/:id" element={
        <ProtectedRoute>
          <BookclubSettings />
        </ProtectedRoute>
      }/>
      <Route path="/dm/:userId?" element={
        <ProtectedRoute>
          <DMChatPage />
        </ProtectedRoute>
      }/>
      <Route path="/reset-password" element={<ResetPasswordPage />}/>
      <Route path="/verify-email" element={<VerifyEmailPage />}/>
      
    </Routes>
      </PageTransition>
    </ErrorBoundary>
  );
}

export default App;