import { Route, Routes } from "react-router-dom";
import Home from "./pages/home";
import BookClub from "./pages/bookclub/:id";
import ProtectedRoute from "./components/ProtectedRoute";
import NewBookClubPage from "./pages/createbookclub";
import ChangeProfilePage from "./pages/changeProfile";
import ProfilePage from "./pages/profilePage/:id";
import BookClubPage from "./pages/bookclubPage/:id";
import DiscoverBookClubs from "./pages/discover";
import InviteJoinPage from "./pages/invite/:code";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/bookclub/:id" element={
        <ProtectedRoute>
          <BookClub />
        </ProtectedRoute>
      } />
      <Route path="/bookclubpage/:id" element={
        <ProtectedRoute>
          <BookClubPage />
        </ProtectedRoute>
      } />
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
      
    </Routes>
  );
}

export default App;