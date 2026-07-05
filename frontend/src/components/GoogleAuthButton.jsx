import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button } from "@mui/material";

const GoogleAuthButton = ({ action = "signin", onCredential, onError }) => {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const buttonText = useMemo(
    () => (action === "signup" ? "signup_with" : "signin_with"),
    [action]
  );

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const updateWidth = () => {
      const nextWidth = Math.floor(containerRef.current?.getBoundingClientRect().width || 0);
      setWidth(nextWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!googleClientId || !width || !window.google?.accounts?.id || !containerRef.current) {
      return undefined;
    }

    const google = window.google.accounts.id;
    const handleCredentialResponse = (response) => {
      if (!response?.credential) {
        onError?.(new Error("Google credential was not returned"));
        return;
      }
      onCredential?.(response.credential);
    };

    containerRef.current.innerHTML = "";
    google.initialize({
      client_id: googleClientId,
      callback: handleCredentialResponse,
      ux_mode: "popup",
    });
    google.renderButton(containerRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: buttonText,
      shape: "rectangular",
      logo_alignment: "left",
      width,
    });

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [buttonText, googleClientId, onCredential, onError, width]);

  if (!googleClientId) {
    return (
      <Button variant="outlined" fullWidth disabled sx={{ py: 1.2, borderRadius: 2 }}>
        Google sign-in not configured
      </Button>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          width: "100%",
          minHeight: 48,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          borderRadius: 2,
        }}
      >
        <Box ref={containerRef} sx={{ width: "100%", display: "flex", justifyContent: "center" }} />
      </Box>
    </Box>
  );
};

export default GoogleAuthButton;
