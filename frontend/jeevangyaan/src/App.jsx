import { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Loader from "./components/Loader";
import Header from "./components/Header";
import AuthHeader from "./components/AuthHeader";
import Footer from "./components/Footer";
import Intro from "./pages/Intro";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Modules from "./pages/Modules";
import AdminDashboard from "./pages/AdminDashboard";
import LanguageSelector from "./pages/LanguageSelector";
import ModuleForm from "./pages/ModuleForm";
import UserDashboard from "./pages/UserDashboard";
import CategoryModules from "./pages/CategoryModules";
import ModuleDetail from "./pages/ModuleDetail";
import Quiz from "./pages/Quiz";
import ProtectedRoute from "./components/ProtectedRoute";
import AiChat from "./components/AiChat";
import Leaderboard from "./pages/Leaderboard";
import ScenarioSimulator from "./pages/ScenarioSimulator";
import Community from "./pages/Community";

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
  const isIntroPage = location.pathname === '/' || location.pathname === '/intro';
  const isAdminPage = location.pathname.startsWith('/admin');
  const isScenarioPage = location.pathname === '/scenario-simulator';
  /* console.log("App Render:", { path: location.pathname, isAuthPage }); */

  return (
    <>
      {/* AI Chat Assistant - Rendered Globally except on Intro and Admin pages */}
      {!isIntroPage && !isAdminPage && <AiChat />}

      {/* Header */}
      {!isIntroPage && (isAuthPage ? <AuthHeader /> : <Header isAdminPage={isAdminPage} />)}

      {/* Pages */}
      <div className="main-content">
        <Routes>
          <Route path="/" element={<LanguageSelector />} />
          <Route path="/intro" element={<Intro />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/modules" element={<Modules />} />

          {/* User Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/modules/:id"
            element={
              <ProtectedRoute>
                <ModuleDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/category/:category"
            element={
              <ProtectedRoute>
                <CategoryModules />
              </ProtectedRoute>
            }
          />
          <Route
            path="/modules/:id/quiz"
            element={
              <ProtectedRoute>
                <Quiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scenario-simulator"
            element={
              <ProtectedRoute>
                <ScenarioSimulator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/community"
            element={
              <ProtectedRoute>
                <Community />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/module/new"
            element={
              <ProtectedRoute adminOnly={true}>
                <ModuleForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/module/edit/:id"
            element={
              <ProtectedRoute adminOnly={true}>
                <ModuleForm />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>


      {!isAuthPage && !isIntroPage && !isAdminPage && !isScenarioPage && <Footer />}
    </>
  );
}

export default App;
