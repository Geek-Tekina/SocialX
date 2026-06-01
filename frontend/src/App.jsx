import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CssBaseline } from "@mui/material";
import { Toaster } from "react-hot-toast";
import { MotionConfig } from "framer-motion";
import { AppThemeProvider, useAppTheme } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import DashboardLayout from "./pages/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import FeedPage from "./pages/FeedPage";
import MediaPage from "./pages/MediaPage";
import SearchPage from "./pages/SearchPage";
import MyPostsPage from "./pages/MyPostsPage";
import ProfilePage from "./pages/ProfilePage";
import PostDetailPage from "./pages/PostDetailPage";
import NotFoundPage from "./pages/NotFoundPage";
import AppErrorBoundary from "./components/AppErrorBoundary";

const ToasterWrapper = () => {
  const { theme } = useAppTheme();
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: "10px",
          fontFamily: theme.typography.fontFamily,
          fontSize: "0.875rem",
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
        },
        success: { iconTheme: { primary: "#10B981", secondary: "#fff" } },
        error:   { iconTheme: { primary: "#EF4444", secondary: "#fff" } },
      }}
    />
  );
};

const AppInner = () => (
  <>
    <CssBaseline />
    <ToasterWrapper />
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/feed" replace />} />
          <Route element={<GuestRoute />}>
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/feed"     element={<FeedPage />} />
              <Route path="/media"    element={<MediaPage />} />
              <Route path="/search"   element={<SearchPage />} />
              <Route path="/profile"  element={<ProfilePage />} />
              <Route path="/my-posts" element={<MyPostsPage />} />
              <Route path="/posts/:id" element={<PostDetailPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </>
);

const App = () => (
  <AppThemeProvider>
    {/* reducedMotion="user" — respects OS accessibility setting globally */}
    <MotionConfig reducedMotion="user">
      <AppErrorBoundary>
        <AppInner />
      </AppErrorBoundary>
    </MotionConfig>
  </AppThemeProvider>
);

export default App;
