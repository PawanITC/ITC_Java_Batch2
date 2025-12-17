import { AuthProvider } from "./auth/AuthContext.jsx";
import OAuth2RedirectHandler from "./auth/OAuth2RedirectHandler.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import MainPage from "./pages/MainPage.jsx";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Explore from "./pages/Explore.jsx";
import UserProfile from "./pages/UserProfile.jsx";
import News from "./pages/News.jsx";
import Notifications from "./pages/Notifications.jsx";
import Bookmarks from "./pages/Bookmarks.jsx";
import Community from "./pages/Community.jsx";
import Message from "./pages/Message.jsx";
import PostModal from "./components/Post/PostModal.jsx";
import PostMain from "./pages/PostMain.jsx";
import Search from "./pages/Search.jsx";
import { useContext } from "react";
import { GlobalContext } from "./components/GlobalContext.jsx";
import { AuthContext } from "./auth/AuthContext.jsx";
import FollowersFollowingPage from "./pages/FollowersFollowingPage.jsx";




function App() {
   const { isPostModalOpen, closePostModal, replyContext} = useContext(GlobalContext);
  const { user } = useContext(AuthContext);
  return (
    
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home></Home>}></Route>
            <Route path="/main" element={<ProtectedRoute><MainPage/></ProtectedRoute>}></Route>
            <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler></OAuth2RedirectHandler>}></Route>    
            <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
            <Route path="/communities" element={<ProtectedRoute><Community /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Message /></ProtectedRoute>} />
            <Route path="/connections" element={<ProtectedRoute><FollowersFollowingPage /></ProtectedRoute>} />
            <Route path="/news/:id" element={<ProtectedRoute><News /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
            <Route path="/post/:postId" element={<ProtectedRoute><PostMain  /></ProtectedRoute>} />
          </Routes>

          {/* GLOBAL POST MODAL (works everywhere) */}
      {isPostModalOpen && (
        <PostModal
          onClose={closePostModal}
          replyToPostId={replyContext.replyToPostId}
          prefillText={replyContext.prefillText}
        />
      )}

          <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="dark"></ToastContainer>

        </BrowserRouter>
  );
}

export default App;
