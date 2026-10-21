import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Сохраняем оригинальный HTML ДО рендеринга React
// Это нужно для функции скачивания игры
(window as any).__ORIGINAL_HTML__ = document.documentElement.outerHTML;

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
