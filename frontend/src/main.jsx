import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GoogleProvider = googleClientId
  ? GoogleOAuthProvider
  : ({ children }) => children;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleProvider clientId={googleClientId || undefined}>
      <App />
    </GoogleProvider>
  </StrictMode>
);
