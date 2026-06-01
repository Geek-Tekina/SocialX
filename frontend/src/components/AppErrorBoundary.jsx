import { Component } from "react";
import { Alert, Box, Button, Paper, Typography } from "@mui/material";

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("App render error", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2, bgcolor: "background.default" }}>
        <Paper elevation={0} sx={{ maxWidth: 440, p: 3, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <Typography variant="h6" fontWeight={800} gutterBottom>
            Something went wrong
          </Typography>
          <Alert severity="error" sx={{ mb: 2 }}>
            The app hit a render issue. Reload to recover.
          </Alert>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </Paper>
      </Box>
    );
  }
}

export default AppErrorBoundary;
