import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import BookClub from "./pages/BookClub/:id";
import ProtectedRoute from "./components/common/ProtectedRoute";
import NewBookClubPage from "./pages/CreateBookClub";
import ChangeProfilePage from "./pages/ChangeProfile";
import ProfilePage from "./pages/Profile/:id";
import BookClubPage from "./pages/BookClubDetails/:id";
import DiscoverBookClubs from "./pages/Discover";
import InviteJoinPage from "./pages/Invite/:code";
import ResetPasswordPage from "./pages/ResetPassword";
import VerifyEmailPage from "./pages/VerifyEmail";
import BookclubSettings from "./pages/BookclubSettings";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/bookclub/:id" element={<BookClub />} />
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
      <Route path="/reset-password" element={<ResetPasswordPage />}/>
      <Route path="/verify-email" element={<VerifyEmailPage />}/>
      
    </Routes>
  );
}

export default App;