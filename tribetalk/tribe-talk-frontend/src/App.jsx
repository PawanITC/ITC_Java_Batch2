<<<<<<< Updated upstream
import { AuthProvider } from "./auth/AuthContext.jsx";
import OAuth2RedirectHandler from "./auth/OAuth2RedirectHandler.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import MainPage from "./pages/MainPage.jsx";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
function App() {
  return (
    
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home></Home>}></Route>
            <Route path="/mainpage" element={<MainPage/>}></Route>
            <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler></OAuth2RedirectHandler>}></Route>
          </Routes>

          <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="dark"></ToastContainer>

        </BrowserRouter>  
      </AuthProvider>
=======
import Explore from "./pages/Explore.jsx";
import Home from "./pages/Home.jsx";
import MainPage from "./pages/MainPage.jsx";
import UserProfile from "./pages/UserProfile.jsx";
import { Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import News from "./pages/News.jsx";
import Notification from "./pages/Notifications.jsx";
import Bookmarks from "./pages/Bookmarks.jsx";
import Community from "./pages/Community.jsx";
import Message from "./pages/Message.jsx";

function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="dark"
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/notifications" element={<Notification />} />
        <Route path="/bookmarks" element={<Bookmarks />} />
        <Route path="/communities" element={<Community />} />
        <Route path="/messages" element={<Message />} />
        <Route path="/news/:id" element={<News />} />
      </Routes>
    </>
>>>>>>> Stashed changes
  );
}

export default App;


/* <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/main" element={<MainPage />} />
    </Routes> */