import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // This imports our black background and Tailwind

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);