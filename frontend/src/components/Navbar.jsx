import { useState } from "react";
import {
  AppBar, Toolbar, Typography, IconButton, Box,
  Menu, MenuItem, Divider, Tooltip, useTheme, useMediaQuery,
  Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton,
} from "@mui/material";
import {
  DynamicFeed, PhotoLibrary, Search, Logout,
  Menu as MenuIcon, Close, Article, DarkMode, LightMode, AccountCircle,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import { springs } from "../motion/variants";
import UserAvatar from "./UserAvatar";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  { label: "Feed",     icon: <DynamicFeed fontSize="small" />, path: "/feed" },
  { label: "Profile",  icon: <AccountCircle fontSize="small" />, path: "/profile" },
  { label: "My Posts", icon: <Article fontSize="small" />,     path: "/my-posts" },
  { label: "My Media", icon: <PhotoLibrary fontSize="small" />, path: "/media" },
  { label: "Search",   icon: <Search fontSize="small" />,       path: "/search" },
];

const Navbar = () => {
  const { auth, logout } = useAuth();
  const { mode, toggleMode } = useAppTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [anchorEl, setAnchorEl]           = useState(null);
  const [drawerOpen, setDrawerOpen]       = useState(false);

  const handleLogout = async () => {
    setAnchorEl(null);
    try { await logout(); toast.success("Logged out"); navigate("/login"); }
    catch { toast.error("Logout failed"); }
  };

  const isDark = mode === "dark";

  return (
    <>
      <AppBar position="fixed" elevation={0} sx={{
        background: isDark ? "rgba(13,15,20,0.92)" : "rgba(255,255,255,0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid",
        borderColor: "divider",
        color: "text.primary",
        zIndex: (t) => t.zIndex.drawer + 1,
      }}>
        <Toolbar sx={{ px: { xs: 2, md: 4 }, minHeight: 60, gap: 1 }}>

          {/* ── Logo ── */}
          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={springs.snappy}
            style={{ cursor: "pointer", marginRight: 24, userSelect: "none" }}
            onClick={() => navigate("/feed")}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{
                width: 30, height: 30, borderRadius: "8px",
                bgcolor: theme.palette.primary.main,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 2px 8px ${theme.palette.primary.main}44`,
              }}>
                <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 15, lineHeight: 1 }}>S</Typography>
              </Box>
              <Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: "-0.3px" }}>
                SocialX
              </Typography>
            </Box>
          </motion.div>

          {/* ── Desktop Nav — layoutId morphing pill ── */}
          {!isMobile && (
            <Box sx={{ display: "flex", gap: 0.25, flex: 1 }}>
              {NAV_ITEMS.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Box
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    sx={{
                      position: "relative",
                      display: "flex", alignItems: "center", gap: 0.75,
                      px: 1.5, py: 0.875, borderRadius: 1.5, cursor: "pointer",
                      color: active ? "text.primary" : "text.secondary",
                      transition: "color 0.15s",
                      "&:hover": { color: "text.primary" },
                      zIndex: 0,
                    }}
                  >
                    {/* Morphing background pill */}
                    {active && (
                      <motion.div
                        layoutId="nav-pill"
                        transition={springs.smooth}
                        style={{
                          position: "absolute", inset: 0,
                          borderRadius: 6,
                          backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                          zIndex: -1,
                        }}
                      />
                    )}
                    {item.icon}
                    <Typography variant="body2" fontWeight={active ? 600 : 400} sx={{ color: "inherit" }}>
                      {item.label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )}

          <Box sx={{ flex: isMobile ? 1 : 0 }} />

          {/* ── Dark/Light toggle ── */}
          <Tooltip title={isDark ? "Light mode" : "Dark mode"}>
            <IconButton onClick={toggleMode} size="small" sx={{ mr: 0.75, color: "text.secondary" }}>
              {isDark ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
            </IconButton>
          </Tooltip>

          {/* ── Avatar ── */}
          <Tooltip title={auth?.username || "Account"}>
            <Box onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ cursor: "pointer" }}>
              <UserAvatar
                avatar={auth?.avatar}
                profileImageUrl={auth?.profileImageUrl}
                username={auth?.username}
                sx={{ width: 32, height: 32, fontSize: 13, fontWeight: 700, bgcolor: theme.palette.primary.main }}
              />
            </Box>
          </Tooltip>

          {isMobile && (
            <motion.div whileTap={{ scale: 0.9 }} transition={springs.snappy}>
              <IconButton onClick={() => setDrawerOpen(true)} sx={{ ml: 0.5, color: "text.secondary" }}>
                <MenuIcon />
              </IconButton>
            </motion.div>
          )}
        </Toolbar>
      </AppBar>

      {/* ── User dropdown ── */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{ sx: { mt: 0.75, minWidth: 180, borderRadius: 2, border: "1px solid", borderColor: "divider" } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700}>{auth?.username || "User"}</Typography>
          <Typography variant="caption" color="text.secondary">Signed in</Typography>
        </Box>
        <Divider />
        {NAV_ITEMS.map((item) => (
          <MenuItem key={item.path} onClick={() => { setAnchorEl(null); navigate(item.path); }}>
            <ListItemIcon sx={{ minWidth: 32 }}>{item.icon}</ListItemIcon>
            <Typography variant="body2">{item.label}</Typography>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
          <ListItemIcon sx={{ minWidth: 32 }}><Logout fontSize="small" color="error" /></ListItemIcon>
          <Typography variant="body2">Logout</Typography>
        </MenuItem>
      </Menu>

      {/* ── Mobile Drawer ── */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 260, pt: 1.5 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2, mb: 1 }}>
          <Typography variant="subtitle1" fontWeight={700}>Menu</Typography>
          <motion.div whileTap={{ rotate: 90 }} transition={springs.snappy}>
            <IconButton size="small" onClick={() => setDrawerOpen(false)}><Close fontSize="small" /></IconButton>
          </motion.div>
        </Box>
        <Box sx={{ px: 2, py: 1, mb: 0.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <UserAvatar avatar={auth?.avatar} profileImageUrl={auth?.profileImageUrl} username={auth?.username} sx={{ width: 36, height: 36, fontWeight: 700, fontSize: 14 }} />
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>{auth?.username || "User"}</Typography>
              <Typography variant="caption" color="text.secondary">Signed in</Typography>
            </Box>
          </Box>
        </Box>
        <Divider />
        <List dense sx={{ px: 1, pt: 0.5 }}>
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            return (
              <ListItem key={item.path} disablePadding>
              <ListItemButton selected={active}
                  onClick={() => { navigate(item.path); setDrawerOpen(false); }}
                  sx={{ borderRadius: 1.5, my: 0.25 }}>
                  <ListItemIcon sx={{ minWidth: 32, color: active ? "text.primary" : "text.secondary" }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={<Typography variant="body2" fontWeight={active ? 600 : 400}>{item.label}</Typography>} />
                </ListItemButton>
              </ListItem>
            );
          })}
          <Divider sx={{ my: 0.75 }} />
          <ListItem disablePadding>
            <ListItemButton onClick={toggleMode} sx={{ borderRadius: 1.5 }}>
              <ListItemIcon sx={{ minWidth: 32, color: "text.secondary" }}>
                {isDark ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
              </ListItemIcon>
              <ListItemText primary={<Typography variant="body2">{isDark ? "Light Mode" : "Dark Mode"}</Typography>} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout} sx={{ borderRadius: 1.5 }}>
              <ListItemIcon sx={{ minWidth: 32 }}><Logout fontSize="small" color="error" /></ListItemIcon>
              <ListItemText primary={<Typography variant="body2" color="error.main">Logout</Typography>} />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </>
  );
};

export default Navbar;
