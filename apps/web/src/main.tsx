import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import "./style.css";

// OKX Wallet reads <link rel="shortcut icon"> to show the site icon in its connect modal. The file stays relative in the HTML
// (the DeWEB copy needs that); make the attribute absolute at run time so the wallet gets a full URL.
const icon = document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]');
if (icon) icon.setAttribute("href", icon.href);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
