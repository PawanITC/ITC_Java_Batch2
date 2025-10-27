import Home from "./pages/Home.jsx";
import MainPage from "./pages/MainPage.jsx";
import { Route, Routes } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/main" element={<MainPage />} />
    </Routes>
  );
}

export default App;
