import * as React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Home,
  Users,
  Sparkles,
  Trophy,
  Swords,
  Layers,
  Wand2,
  Settings,
  Menu,
  X,
  Compass,
  Code,
  LogIn,
  LogOut,
} from "lucide-react";
import { BrandMark } from "./brand-mark";
import { NavItem } from "./nav-item";
import { IconButton } from "../ui/button";
import { Badge } from "../ui/badge";
import { ToastProvider } from "../ui/toast";
import { TooltipProvider } from "../ui/tooltip";
import { useAuth } from "../../features/auth";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const location = useLocation();
  const { status, user, profile, signIn, signOut } = useAuth();
  const [avatarImgError, setAvatarImgError] = React.useState(false);
  const isDev =
    Boolean(import.meta.env.DEV) || import.meta.env.VITE_ENABLE_DEV_DS === "true";

  React.useEffect(() => {
    setAvatarImgError(false);
  }, [user?.image]);

  // LOCKED Production Navigation
  const navigationLinks = [
    { to: "/", icon: <Home className="h-4 w-4" />, label: "Home" },
    {
      to: "/roster",
      icon: <Users className="h-4 w-4" />,
      label: "Roster",
    },
    { to: "/characters", icon: <Sparkles className="h-4 w-4" />, label: "Characters" },
    {
      to: "/best-characters",
      icon: <Trophy className="h-4 w-4" />,
      label: "Best Characters",
    },
    { to: "/teams", icon: <Swords className="h-4 w-4" />, label: "Teams" },
    { to: "/content", icon: <Layers className="h-4 w-4" />, label: "Content" },
    {
      to: "/assistant",
      icon: <Wand2 className="h-4 w-4" />,
      label: "Assistant",
      badge: "Preview",
    },
    { to: "/settings", icon: <Settings className="h-4 w-4" />, label: "Settings" },
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
                Preview
              </Badge>
            </div>

            {/* Navigation List */}
            <nav
              aria-label="Main Navigation"
              className="flex-1 overflow-y-auto p-3.5 space-y-1"
            >
              <span className="block px-3 py-1 text-[10px] font-mono font-bold tracking-widest text-[#9ba5be] uppercase">
                Navigation
              </span>
              {navigationLinks.map((item) => (
                <NavItem
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                  badge={item.badge}
                  active={
                    location.pathname === item.to ||
                    (item.to === "/teams" && location.pathname === "/recommendations")
                  }
                />
              ))}
            </nav>

            {/* Bottom System Status & Gated Internal Dev Link */}
            <div className="p-4 border-t border-[#1a2338] bg-[#07090f]/70 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#34d399]" />
                  <span className="text-xs text-[#9ba5be]">Companion Mode</span>
                </div>
                {isDev && (
                  <a
                    href="/design-system.html"
                    title="Internal Design System Showcase (Development Only)"
                    data-testid="dev-ds-link"
                    className="flex items-center gap-1 text-[10px] font-mono text-[#9ba5be] hover:text-[#dfb86c] transition-colors p-1 rounded-xs"
                  >
                    <Code className="h-3 w-3" />
                    <span>Dev DS</span>
                  </a>
                )}
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
                <div className="hidden sm:flex items-center gap-2 text-xs text-[#9ba5be] font-medium">
                  <Compass className="h-4 w-4 text-[#dfb86c]" />
                  <span>Astralyn</span>
                  <span>/</span>
                  <span className="text-[#f0f3fa] font-semibold">
                    {location.pathname === "/"
                      ? "Home"
                      : location.pathname.substring(1).replace("-", " ").toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {status === "loading" && (
                  <div className="flex items-center gap-2 px-2.5 py-1 rounded-xs border border-[#1f2940] bg-[#101524] text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#dfb86c] animate-pulse" />
                    <span className="text-[#9ba5be] font-mono text-[11px]">Verifying...</span>
                  </div>
                )}
                {status === "unauthenticated" && (
                  <button
                    type="button"
                    onClick={() => void signIn()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs border border-[#dfb86c]/40 bg-[#dfb86c]/10 text-[#dfb86c] hover:bg-[#dfb86c]/20 hover:border-[#dfb86c] text-xs font-semibold transition-all cursor-pointer"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Sign in with Google</span>
                  </button>
                )}
                {status === "authenticated" && user && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-xs border border-[#1f2940] bg-[#101524] text-xs">
                      {user.image && !avatarImgError ? (
                        <img
                          src={user.image}
                          alt={user.name}
                          referrerPolicy="no-referrer"
                          onError={() => setAvatarImgError(true)}
                          className="h-4 w-4 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-4 w-4 rounded-full bg-[#dfb86c]/20 border border-[#dfb86c]/40 flex items-center justify-center text-[10px] text-[#dfb86c] font-bold">
                          {user.name ? user.name[0].toUpperCase() : "T"}
                        </div>
                      )}
                      <span className="text-[#f0f3fa] font-medium text-xs max-w-[120px] truncate">
                        {profile?.displayName || user.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void signOut()}
                      title="Sign out"
                      aria-label="Sign out"
                      className="p-1.5 rounded-xs text-[#9ba5be] hover:text-[#f87171] hover:bg-[#1f2940]/50 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {status === "error" && (
                  <div className="flex items-center gap-2 px-2.5 py-1 rounded-xs border border-[#f87171]/30 bg-[#f87171]/10 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#f87171]" />
                    <span className="text-[#f87171] font-mono text-[11px]">Auth error</span>
                  </div>
                )}
              </div>
            </header>

            {/* Mobile Drawer Navigation Menu */}
            {mobileMenuOpen && (
              <div className="lg:hidden fixed inset-0 top-16 z-40 bg-[#090c13]/98 p-4 backdrop-blur-xl border-b border-[#1a2338] overflow-y-auto">
                <nav aria-label="Mobile Navigation" className="space-y-1">
                  {navigationLinks.map((item) => (
                    <NavItem
                      key={item.to}
                      to={item.to}
                      icon={item.icon}
                      label={item.label}
                      badge={item.badge}
                      active={
                        location.pathname === item.to ||
                        (item.to === "/teams" && location.pathname === "/recommendations")
                      }
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-3 text-sm"
                    />
                  ))}
                  {isDev && (
                    <div className="pt-4 border-t border-[#1a2338]">
                      <a
                        href="/design-system.html"
                        onClick={() => setMobileMenuOpen(false)}
                        data-testid="mobile-dev-ds-link"
                        className="flex items-center gap-2 px-3.5 py-2 text-xs text-[#9ba5be] hover:text-[#dfb86c]"
                      >
                        <Code className="h-4 w-4" />
                        <span>Internal Design System Showcase</span>
                      </a>
                    </div>
                  )}
                </nav>
              </div>
            )}

            {/* Page Workspace Content Container */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
              {children}
            </main>

            {/* Global Footer with Legal Attribution */}
            <footer className="border-t border-[#1a2338] px-4 sm:px-6 py-4 bg-[#07090f] text-xs text-[#9ba5be]">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-[1440px] mx-auto">
                <p>
                  Astralyn &bull; Honkai: Star Rail Tactical Companion &bull; Fan-made
                  companion tool
                </p>
                <p className="text-xs text-[#9ba5be] text-center sm:text-right">
                  Game assets &copy; COGNOSPHERE / HoYoverse. Astralyn is a fan project
                  and not affiliated with or endorsed by HoYoverse.
                </p>
              </div>
            </footer>
          </div>
        </div>
      </ToastProvider>
    </TooltipProvider>
  );
}
