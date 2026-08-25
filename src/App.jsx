import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./api/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import OurTeachers from "./pages/OurTeachers";
import TeacherDetail from "./pages/TeacherDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import LegalPage from "./pages/LegalPage";
import Catalog from "./pages/Catalog";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import AffiliateDashboard from "./pages/AffiliateDashboard";
import Forum from "./pages/Forum";
import VideoCapsules from "./pages/VideoCapsules";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/nos-enseignants" element={<OurTeachers />} />
          <Route path="/nos-enseignants/:id" element={<TeacherDetail />} />
          <Route path="/connexion" element={<Login />} />
          <Route path="/inscription" element={<Register />} />
          <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
          <Route path="/mot-de-passe-oublie/confirmer" element={<ResetPassword />} />
          <Route path="/mentions-legales" element={<LegalPage slug="mentions-legales" />} />
          <Route path="/cgv" element={<LegalPage slug="cgv" />} />
          <Route path="/confidentialite" element={<LegalPage slug="confidentialite" />} />
          <Route path="/catalogue" element={<Catalog />} />
          <Route path="/forum" element={<Forum />} />
          <Route
            path="/capsules"
            element={
              <ProtectedRoute roles={["student"]}>
                <VideoCapsules />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tableau-de-bord"
            element={
              <ProtectedRoute roles={["student"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/enseignant"
            element={
              <ProtectedRoute roles={["teacher"]}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parrainage"
            element={
              <ProtectedRoute roles={["affiliate", "student", "teacher", "admin"]}>
                <AffiliateDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}
