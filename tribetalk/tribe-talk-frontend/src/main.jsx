import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import ThemeProvider from "./ThemeProvider.jsx";
import { GlobalContext, GlobalProvider } from "./components/GlobalContext.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";

createRoot(document.getElementById("root")).render(
  
  <ThemeProvider>
    <AuthProvider>
      <GlobalProvider>
        <App />
      </GlobalProvider>
    </AuthProvider>
  </ThemeProvider>
);

/* <BrowserRouter>
    <App />
  </BrowserRouter> */