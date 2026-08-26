import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  type RouterHistory,
} from "@tanstack/react-router";

// Root Route layout
const rootRoute = createRootRoute({
  component: () => (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-800 bg-slate-900/60 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-amber-200">Astralyn</h1>
          <span className="rounded bg-slate-800 px-2.5 py-1 text-xs text-slate-400">
            Phase 0 Shell
          </span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-900 px-6 py-4 text-center text-xs text-slate-500">
        Astralyn &bull; Free-first Honkai: Star Rail Assistant
      </footer>
    </div>
  ),
  notFoundComponent: () => (
    <div
      className="rounded-lg border border-slate-800 bg-slate-900/40 p-8 text-center"
      data-testid="not-found"
    >
      <h2 className="text-2xl font-bold text-slate-200">404 - Page Not Found</h2>
      <p className="mt-2 text-slate-400">The requested route does not exist.</p>
    </div>
  ),
});

// Home Route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <div className="space-y-4" data-testid="home-view">
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-100">
          Architecture Foundation Active
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Astralyn Phase 0 development workspace is initialized and verified.
        </p>
      </div>
    </div>
  ),
});

// Route tree
const routeTree = rootRoute.addChildren([indexRoute]);

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
