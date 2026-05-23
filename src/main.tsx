
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { LanguageProvider } from "./i18n/LanguageContext.tsx";
import { ThemeProvider } from "./theme/ThemeContext.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </ThemeProvider>,
);
  