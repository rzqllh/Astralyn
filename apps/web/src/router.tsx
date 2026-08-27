import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  type RouterHistory,
  Link,
} from "@tanstack/react-router";
import { AppShell } from "./components/layout/app-shell";
import { HomeView } from "./routes/home-view";
import { DesignSystemView } from "./routes/design-system-view";
import { EmptyState } from "./components/ui/empty-state";
import { Button } from "./components/ui/button";

function PlaceholderView({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}) {
  return (
    <div className="space-y-4 max-w-2xl" data-testid={`view-${path.replace("/", "")}`}>
      <div className="border-b border-[#1a2338] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#dfb86c] uppercase">
            Milestone Status
          </span>
          <span className="text-[10px] font-mono text-[#9ba5be]">
            • Phase 1 Visual System Locked
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#f0f3fa] mt-1">
          {title}
        </h1>
        <p className="text-xs text-[#9ba5be] mt-1">{description}</p>
      </div>

      <div className="p-4 rounded-xs border border-[#1f2940] bg-[#0c101a] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-[#f0f3fa]">
            Module Scheduled for Implementation
          </p>
          <p className="text-[11px] text-[#9ba5be]">
            The visual and asset design system for this module is verified. Feature
            business logic will unlock in Phase 2+.
          </p>
        </div>
        <Link to="/" className="shrink-0">
          <Button variant="secondary" size="sm">
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

// Root Route layout
const rootRoute = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
  notFoundComponent: () => (
    <div className="flex items-center justify-center p-12" data-testid="not-found">
      <EmptyState
        title="Waypoint Not Found"
        description="The requested coordinate does not exist. Please return to the Home command center."
        action={
          <Link to="/">
            <Button variant="primary">Return Home</Button>
          </Link>
        }
      />
    </div>
  ),
});

// Home Route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomeView,
});

const isDevEnvironment =
  Boolean(import.meta.env.DEV) || import.meta.env.VITE_ENABLE_DEV_DS === "true";

// Internal Design System Showcase Route (Dev / Inspection)
const designSystemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/design-system",
  component: () => {
    if (!isDevEnvironment) {
      return (
        <div className="flex items-center justify-center p-12" data-testid="not-found">
          <EmptyState
            title="Waypoint Not Found"
            description="The requested coordinate does not exist. Please return to the Home command center."
            action={
              <Link to="/">
                <Button variant="primary">Return Home</Button>
              </Link>
            }
          />
        </div>
      );
    }
    return <DesignSystemView />;
  },
});

const rosterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/roster",
  component: () => (
    <PlaceholderView
      path="/roster"
      title="Character Roster"
      description="Manage local owned characters, light cones, and eidolon levels."
    />
  ),
});

const charactersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/characters",
  component: () => (
    <PlaceholderView
      path="/characters"
      title="Characters Database"
      description="Comprehensive database of all HSR characters with multi-source consensus."
    />
  ),
});

const bestCharactersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/best-characters",
  component: () => (
    <PlaceholderView
      path="/best-characters"
      title="Best Characters"
      description="Consensus meta tier rankings and character priority guides."
    />
  ),
});

const teamsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/teams",
  component: () => (
    <PlaceholderView
      path="/teams"
      title="Teams & Synergies"
      description="Evaluate team synergy scores, speed tuning, and action advance rotations."
    />
  ),
});

const contentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/content",
  component: () => (
    <PlaceholderView
      path="/content"
      title="Content Hub"
      description="Memory of Chaos, Pure Fiction, and Apocalyptic Shadow stage recommendations."
    />
  ),
});

const assistantRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/assistant",
  component: () => (
    <PlaceholderView
      path="/assistant"
      title="Divergent Universe Assistant"
      description="Instant blessing and curio recommendations from gameplay screenshots."
    />
  ),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: () => (
    <PlaceholderView
      path="/settings"
      title="Settings"
      description="Local-first backup, IndexedDB preferences, and data source policy management."
    />
  ),
});

// Route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  designSystemRoute,
  rosterRoute,
  charactersRoute,
  bestCharactersRoute,
  teamsRoute,
  contentRoute,
  assistantRoute,
  settingsRoute,
]);

// Factory to create router
export function createAppRouter(history?: RouterHistory) {
  return createRouter({
    routeTree,
    history,
  });
}

export const router = createAppRouter();

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
