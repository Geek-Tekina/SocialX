import { Box, Container } from "@mui/material";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AmbientBackground from "../components/ui/AmbientBackground";
import PageTransition from "../components/ui/PageTransition";

const NAVBAR_HEIGHT = 60;

/**
 * DashboardLayout
 *
 * Layers:
 *   z-index 0  — AmbientBackground (fixed, pointer-events:none)
 *   z-index 1  — page content
 *   z-index appBar+1 — Navbar (fixed)
 *
 * PageTransition wraps Outlet so every child page gets enter/exit animation.
 */
const DashboardLayout = () => (
  <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", flexDirection: "column", position: "relative" }}>
    <AmbientBackground />
    <Navbar />
    <Box
      component="main"
      sx={{ pt: { xs: `${NAVBAR_HEIGHT + 18}px`, md: `${NAVBAR_HEIGHT + 28}px` }, pb: 4, flex: 1, position: "relative", zIndex: 1 }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 2, md: 3 } }}>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </Container>
    </Box>
    <Footer />
  </Box>
);

export default DashboardLayout;
