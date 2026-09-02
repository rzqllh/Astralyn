import React from "react";
import ReactDOM from "react-dom/client";
import { DesignSystemView } from "./design-system-view";
import { ToastProvider } from "../components/ui/toast";
import { TooltipProvider } from "../components/ui/tooltip";
import "../index.css";

const rootElement = document.getElementById("root");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <TooltipProvider>
        <ToastProvider>
          <div className="min-h-screen bg-[#090c13] text-[#f0f3fa] p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto">
            <DesignSystemView />
          </div>
        </ToastProvider>
      </TooltipProvider>
    </React.StrictMode>
  );
}
