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
import Whiteboard from "./pages/Whiteboard";
import Blog from "./pages/Blog";
import Packs from "./pages/Packs";
import InfoSession from "./pages/InfoSession";
import Promos from "./pages/Promos";
import BlogPostPage from "./pages/BlogPostPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import LegalPage from "./pages/LegalPage";
import AboutPage from "./pages/AboutPage";
import Catalog from "./pages/Catalog";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherSettingsPage from "./pages/TeacherSettingsPage";
import AffiliateDashboard from "./pages/AffiliateDashboard";
import Forum from "./pages/Forum";
import VideoCapsules from "./pages/VideoCapsules";
import ChatTutoring from "./pages/ChatTutoring";
import TeacherChatPage from "./pages/TeacherChatPage";

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
          <Route path="/a-propos" element={<AboutPage />} />
          <Route path="/catalogue" element={<Catalog />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/packs" element={<Packs />} />
          <Route path="/seance-info" element={<InfoSession />} />
          <Route path="/promos" element={<Promos />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route
            path="/chat-enseignant"
            element={
              <ProtectedRoute roles={["student", "admin"]}>
                <ChatTutoring />
              </ProtectedRoute>
            }
          />
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
            path="/enseignant/parametres"
            element={
              <ProtectedRoute roles={["teacher"]}>
                <TeacherSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/enseignant/chat"
            element={
              <ProtectedRoute roles={["teacher", "admin"]}>
                <TeacherChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tableau/:sessionId"
            element={
              <ProtectedRoute roles={["student", "teacher"]}>
                <Whiteboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tableau-demo"
            element={
              <ProtectedRoute roles={["student", "teacher"]}>
                <Whiteboard />
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
