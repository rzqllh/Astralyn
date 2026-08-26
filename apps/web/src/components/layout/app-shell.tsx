import * as React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Home,
  Users,
  Sparkles,
  Swords,
  Layers,
  Wand2,
  Settings,
  Palette,
  Menu,
  X,
  Compass,
} from "lucide-react";
import { BrandMark } from "./brand-mark";
import { NavItem } from "./nav-item";
import { Button, IconButton } from "../ui/button";
import { Badge } from "../ui/badge";
import { ToastProvider } from "../ui/toast";
import { TooltipProvider } from "../ui/tooltip";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  const navigationLinks = [
    { to: "/", icon: <Home className="h-4 w-4" />, label: "Home" },
    {
      to: "/roster",
      icon: <Users className="h-4 w-4" />,
      label: "My Roster",
      badge: "8 Owned",
    },
    { to: "/characters", icon: <Sparkles className="h-4 w-4" />, label: "Characters" },
    { to: "/teams", icon: <Swords className="h-4 w-4" />, label: "Team Comp Engine" },
    { to: "/content", icon: <Layers className="h-4 w-4" />, label: "Endgame Hub" },
    {
      to: "/assistant",
      icon: <Wand2 className="h-4 w-4" />,
      label: "DU OCR Assistant",
      badge: "Live",
    },
    { to: "/settings", icon: <Settings className="h-4 w-4" />, label: "Settings" },
    {
      to: "/design-system",
      icon: <Palette className="h-4 w-4 text-[#dfb86c]" />,
      label: "Design System",
      badge: "Phase 1",
    },
  ];

  return (
    <TooltipProvider>
      <ToastProvider>
        <div className="flex min-h-[100dvh] w-full bg-[#090c13] text-[#f0f3fa] hsr-grid-pattern antialiased">
          {/* Desktop Left Navigation Rail */}
          <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-[#1a2338] bg-[#0b0e17]/95 backdrop-blur-md z-30">
            {/* Brand Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#1a2338]">
              <Link to="/">
                <BrandMark />
              </Link>
              <Badge variant="gold" size="sm">
                v3.0.1
              </Badge>
            </div>

            {/* Navigation List */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-1">
              <span className="block px-3 py-1 text-[10px] font-mono font-bold tracking-widest text-[#626e89] uppercase">
                Navigation
              </span>
              {navigationLinks.map((item) => (
                <NavItem
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                  badge={item.badge}
                  active={location.pathname === item.to}
                />
              ))}
            </div>

            {/* Bottom System Status Panel */}
            <div className="p-4 border-t border-[#1a2338] bg-[#07090f]/70">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#34d399] animate-pulse" />
                  <span className="text-[11px] font-mono text-[#9ba5be]">
                    Free-First Engine
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#626e89]">
                  Cloudflare D1
                </span>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
            {/* Top Navigation HUD Bar */}
            <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#1a2338] bg-[#090c13]/85 px-4 sm:px-6 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="lg:hidden">
                  <IconButton
                    aria-label="Toggle navigation menu"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    variant="ghost"
                  >
                    {mobileMenuOpen ? (
                      <X className="h-5 w-5" />
                    ) : (
                      <Menu className="h-5 w-5" />
                    )}
                  </IconButton>
                </div>
                <div className="lg:hidden">
                  <Link to="/">
                    <BrandMark compact />
                  </Link>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs text-[#9ba5be] font-mono">
                  <Compass className="h-4 w-4 text-[#dfb86c]" />
                  <span>Astralyn Companion</span>
                  <span>/</span>
                  <span className="text-[#f0f3fa] font-semibold">
                    {location.pathname === "/"
                      ? "Overview"
                      : location.pathname.substring(1).replace("-", " ").toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link to="/design-system" className="hidden sm:inline-flex">
                  <Button
                    variant="outline"
                    size="sm"
                    iconLeft={<Palette className="h-3.5 w-3.5" />}
                  >
                    Design System
                  </Button>
                </Link>
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-xs border border-[#1f2940] bg-[#101524] text-xs font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#dfb86c]" />
                  <span className="text-[#9ba5be]">Trailblazer Lv. 70</span>
                </div>
              </div>
            </header>

            {/* Mobile Drawer Navigation Menu */}
            {mobileMenuOpen && (
              <div className="lg:hidden fixed inset-0 top-16 z-40 bg-[#090c13]/98 p-4 backdrop-blur-xl border-b border-[#1a2338] overflow-y-auto">
                <div className="space-y-1">
                  {navigationLinks.map((item) => (
                    <NavItem
                      key={item.to}
                      to={item.to}
                      icon={item.icon}
                      label={item.label}
                      badge={item.badge}
                      active={location.pathname === item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-3 text-sm"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Page Workspace Content Container */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
              {children}
            </main>

            {/* Global Footer */}
            <footer className="border-t border-[#1a2338] px-4 sm:px-6 py-4 bg-[#07090f] text-center text-xs text-[#626e89]">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-[1440px] mx-auto">
                <p>
                  Astralyn &bull; Free-first Honkai: Star Rail Assistant &bull; Phase 1
                  Design System Active
                </p>
                <p className="font-mono text-[11px] text-[#626e89]">
                  Not affiliated with or endorsed by COGNOSPHERE / HoYoverse.
                </p>
              </div>
            </footer>
          </div>
        </div>
      </ToastProvider>
    </TooltipProvider>
  );
}
