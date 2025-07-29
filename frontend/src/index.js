import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App"; // ← IMPORTANTE: App con A mayúscula

// 1. Encuentra el punto de entrada en tu HTML.
const root = ReactDOM.createRoot(document.getElementById("root"));

// 2. Renderiza tu aplicación de React en ese punto.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);