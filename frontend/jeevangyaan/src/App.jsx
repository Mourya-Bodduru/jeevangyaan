import { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Loader from "./components/Loader";
import Header from "./components/Header";
import AuthHeader from "./components/AuthHeader";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Modules from "./pages/Modules";

function App() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  // Routes that use auth layout
  const authRoutes = ["/login", "/register"];

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (loading) return <Loader />;

  const isAuthPage = authRoutes.includes(location.pathname);

  return (
    <>
      {/* Header */}
      {isAuthPage ? <AuthHeader /> : <Header />}

      {/* Pages */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/modules" element={<Modules />} />
      </Routes>


      {!isAuthPage && <Footer />}
    </>
  );
}

export default App;
