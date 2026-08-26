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
        title="404 - Navigation Waypoint Not Found"
        description="The requested star rail coordinate does not exist. Please return to the command center."
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

// Design System Showcase Route
const designSystemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/design-system",
  component: DesignSystemView,
});

// Placeholder feature routes (strictly Phase 1 visual shells)
function createPlaceholderRoute(path: string, title: string, description: string) {
  return createRoute({
    getParentRoute: () => rootRoute,
    path,
    component: () => (
      <div className="space-y-6" data-testid={`view-${path.replace("/", "")}`}>
        <div className="border-b border-[#1a2338] pb-4">
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#dfb86c] uppercase">
            Planned Feature Module
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#f0f3fa] mt-1">
            {title}
          </h1>
          <p className="text-xs text-[#9ba5be] mt-1">{description}</p>
        </div>

        <EmptyState
          title={`${title} Module Preview`}
          description={`The ${title} engine will be initialized in upcoming phases. The design system shell and interaction framework are verified.`}
          action={
            <Link to="/design-system">
              <Button variant="primary" size="sm">
                View Design System
              </Button>
            </Link>
          }
        />
      </div>
    ),
  });
}

const rosterRoute = createPlaceholderRoute(
  "/roster",
  "Trailblazer Character Roster",
  "Manage local owned characters, light cones, and eidolon levels."
);

const charactersRoute = createPlaceholderRoute(
  "/characters",
  "Character Database & Build Meta",
  "Comprehensive database of all HSR characters with multi-source consensus."
);

const teamsRoute = createPlaceholderRoute(
  "/teams",
  "Team Composition & Synergy Engine",
  "Evaluate team synergy scores, speed tuning, and action advance rotations."
);

const contentRoute = createPlaceholderRoute(
  "/content",
  "Endgame Content Hub",
  "Memory of Chaos, Pure Fiction, and Apocalyptic Shadow stage recommendations."
);

const assistantRoute = createPlaceholderRoute(
  "/assistant",
  "Divergent Universe Screenshot Assistant",
  "Instant blessing and curio recommendations from gameplay screenshots."
);

const settingsRoute = createPlaceholderRoute(
  "/settings",
  "Settings & Data Storage",
  "Local-first backup, IndexedDB preferences, and data source policy management."
);

// Route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  designSystemRoute,
  rosterRoute,
  charactersRoute,
  teamsRoute,
  contentRoute,
  assistantRoute,
  settingsRoute,
]);

// Factory to create router (useful for tests with memory history)
export function createAppRouter(history?: RouterHistory) {
  return createRouter({
    routeTree,
    history,
  });
}

// Default router instance for browser
export const router = createAppRouter();

// Register router for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
