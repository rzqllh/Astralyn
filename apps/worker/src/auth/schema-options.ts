import type { BetterAuthOptions } from "better-auth";

/**
 * Shared schema-affecting and security Better Auth configuration options.
 * Both the tooling CLI generator and the production runtime auth instance
 * must consume this exact definition to guarantee schema and security alignment.
 *
 * Strict Rule: Never include credentials, live D1 bindings, fake users,
 * or speculative product fields here.
 */
export const AUTH_SCHEMA_OPTIONS = {
  user: {
    fields: {
      emailVerified: "email_verified",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  session: {
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
      ipAddress: "ip_address",
      userAgent: "user_agent",
      userId: "user_id",
    },
  },
  account: {
    identityStrategy: "provider-id",
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      disableImplicitLinking: true,
    },
    fields: {
      accountId: "account_id",
      providerId: "provider_id",
      userId: "user_id",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      idToken: "id_token",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  verification: {
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
} as const satisfies BetterAuthOptions | { account: { identityStrategy: "provider-id" } };
