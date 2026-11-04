import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/source-serif-4";
import App from "./App";
import "./styles/tokens.css";
import "./styles/app.css";
import "./styles/chat3d.css";
import "./styles/verkaufen.css";
import "./styles/kamera.css";
import "./styles/konto.css";
import "./styles/einstieg.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
