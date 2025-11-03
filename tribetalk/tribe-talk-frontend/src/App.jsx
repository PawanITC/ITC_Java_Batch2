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
  );
}

export default App;


/* <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/main" element={<MainPage />} />
    </Routes> */