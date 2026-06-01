import { Box, Typography, Button } from "@mui/material";
import { Home } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 3,
        textAlign: "center",
      }}
    >
      <Typography
        variant="h1"
        fontWeight={800}
        sx={{
          fontSize: { xs: "6rem", md: "10rem" },
          background: "linear-gradient(135deg, #6C63FF 0%, #FF6584 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          lineHeight: 1,
          mb: 2,
        }}
      >
        404
      </Typography>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Page not found
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 360 }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </Typography>
      <Button
        variant="contained"
        startIcon={<Home />}
        onClick={() => navigate("/feed")}
        size="large"
      >
        Back to Feed
      </Button>
    </Box>
  );
};

export default NotFoundPage;
