import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/bricolage-grotesque";
import App from "./App";
import "./styles/tokens.css";
import "./styles/app.css";
import "./styles/chat3d.css";
import "./styles/verkaufen.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
