import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Create a root for React
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(<App />);
