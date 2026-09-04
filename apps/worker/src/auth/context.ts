import { createAuth, validateAuthEnv, type AuthEnv } from "./server";

export type AuthContext =
  | {
      status: "authenticated";
      readonly userId: string;
      readonly user: {
        id: string;
        name: string;
        email: string;
        emailVerified: boolean;
        image?: string | null;
        createdAt: Date;
        updatedAt: Date;
      };
      readonly session: {
        id: string;
        userId: string;
        expiresAt: Date;
        token: string;
        createdAt: Date;
        updatedAt: Date;
        ipAddress?: string | null;
        userAgent?: string | null;
      };
    }
  | {
      status: "anonymous";
    }
  | {
      status: "unavailable";
      readonly code: string;
      readonly message: string;
    };

/**
 * Resolves the server-side authentication context from incoming request headers and runtime environment.
 *
 * Guarantees:
 * - Real Better Auth session only; never invents guest/fallback identities.
 * - Anonymous and unavailable are strictly distinct states.
 * - Sanitized diagnostics without leaking internal credentials or query details.
 */
export async function resolveAuthContext(
  request: Request,
  env: AuthEnv
): Promise<AuthContext> {
  const validation = validateAuthEnv(env);
  if (!validation.valid) {
    return {
      status: "unavailable",
      code: "AUTH_UNCONFIGURED",
      message: "Authentication service configuration is unavailable.",
    };
  }

  try {
    const auth = createAuth(env);
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData || !sessionData.user || !sessionData.session) {
      return {
        status: "anonymous",
      };
    }

    return {
      status: "authenticated",
      userId: sessionData.user.id,
      user: sessionData.user,
      session: sessionData.session,
    };
  } catch {
    return {
      status: "unavailable",
      code: "AUTH_ERROR",
      message: "An error occurred while verifying authentication state.",
    };
  }
}
