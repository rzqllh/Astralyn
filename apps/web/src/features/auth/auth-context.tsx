// apps/web/src/features/auth/auth-context.tsx

import * as React from "react";
import type {
  AuthContextValue,
  AuthState,
  User,
  Session,
  UserProfile,
} from "./types";

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({
    status: "loading",
    user: null,
    session: null,
    profile: null,
    needsOnboarding: false,
    error: null,
  });

  const fetchSessionAndProfile = React.useCallback(async () => {
    try {
      // 1. Fetch Better Auth session
      const sessionRes = await fetch("/api/auth/get-session", {
        headers: { Accept: "application/json" },
      });

      if (!sessionRes.ok) {
        throw new Error(`Failed to fetch session: HTTP ${sessionRes.status}`);
      }

      const sessionData = (await sessionRes.json()) as {
        user: User;
        session: Session;
      } | null;

      if (!sessionData || !sessionData.user || !sessionData.session) {
        setState({
          status: "unauthenticated",
          user: null,
          session: null,
          profile: null,
          needsOnboarding: false,
          error: null,
        });
        return;
      }

      // 2. Fetch user profile from /api/me (if available)
      let profile: UserProfile | null = null;
      let needsOnboarding = false;

      try {
        const meRes = await fetch("/api/me", {
          headers: { Accept: "application/json" },
        });

        if (meRes.ok) {
          const meData = (await meRes.json()) as {
            profile: UserProfile;
            needsOnboarding: boolean;
          };
          profile = meData.profile;
          needsOnboarding = meData.needsOnboarding;
        }
      } catch {
        // Silently tolerate if /api/me is being initialized
      }

      setState({
        status: "authenticated",
        user: sessionData.user,
        session: sessionData.session,
        profile,
        needsOnboarding,
        error: null,
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      setState({
        status: "error",
        user: null,
        session: null,
        profile: null,
        needsOnboarding: false,
        error,
      });
    }
  }, []);

  React.useEffect(() => {
    fetchSessionAndProfile();
  }, [fetchSessionAndProfile]);

  const signIn = React.useCallback(async () => {
    try {
      const res = await fetch("/api/auth/sign-in/social", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          provider: "google",
          callbackURL: window.location.origin,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to initiate Google sign in: HTTP ${res.status}`);
      }

      const data = (await res.json()) as { url?: string };
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No redirect URL returned by authentication service");
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      setState((prev) => ({ ...prev, error }));
    }
  }, []);

  const signOut = React.useCallback(async () => {
    try {
      const res = await fetch("/api/auth/sign-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        throw new Error(`Failed to sign out: HTTP ${res.status}`);
      }

      setState({
        status: "unauthenticated",
        user: null,
        session: null,
        profile: null,
        needsOnboarding: false,
        error: null,
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      setState((prev) => ({ ...prev, error }));
    }
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      ...state,
      signIn,
      signOut,
      refreshSession: fetchSessionAndProfile,
    }),
    [state, signIn, signOut, fetchSessionAndProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
