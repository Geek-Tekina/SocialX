import { Box, Typography, useTheme, Stack } from "@mui/material";

const Footer = () => {
  const theme = useTheme();
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        borderTop: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        py: 3,
        px: { xs: 2, md: 4 },
      }}
    >
      <Box
        sx={{
          maxWidth: 1120,
          mx: "auto",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: "center",
          justifyContent: "space-between",
          gap: { xs: 1.25, sm: 2 },
        }}
      >
        {/* Brand */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 28, height: 28, borderRadius: "8px",
              background: `linear-gradient(${theme.custom?.gradient || "135deg, #6C63FF 0%, #9D97FF 100%"})`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>S</Typography>
          </Box>
          <Typography variant="body2" fontWeight={700} sx={{ background: `linear-gradient(${theme.custom?.gradient})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            SocialX
          </Typography>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          textAlign="center"
          sx={{ letterSpacing: 0, maxWidth: { xs: 280, sm: "none" }, lineHeight: 1.6 }}
        >
          © {year} SocialX. Built for focused social sharing.
        </Typography>

        <Stack direction="row" spacing={{ xs: 1.5, sm: 2 }}>
          {["Privacy", "Terms", "Status"].map((label) => (
            <Typography key={label} variant="caption" color="text.secondary" sx={{ cursor: "default" }}>
              {label}
            </Typography>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

export default Footer;
