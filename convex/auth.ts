import { convexAuth, createAccount } from "@convex-dev/auth/server";
import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import Apple from "@auth/core/providers/apple";
import { createRemoteJWKSet, jwtVerify } from "jose";

const APPLE_ISSUER = "https://appleid.apple.com";
const appleKeys = createRemoteJWKSet(new URL(`${APPLE_ISSUER}/auth/keys`));

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Native iOS flow: the app gets an Apple identity token via the system sheet
// and sends it here. We verify signature, issuer, audience (the app's Bundle
// ID) and nonce before creating or finding the user.
const AppleNative = ConvexCredentials({
  id: "apple-native",
  authorize: async (credentials, ctx) => {
    const identityToken = credentials.identityToken;
    const rawNonce = credentials.nonce;
    if (typeof identityToken !== "string" || typeof rawNonce !== "string") {
      throw new Error("Missing Apple credentials");
    }
    const bundleId = process.env.APPLE_NATIVE_BUNDLE_ID;
    if (!bundleId) {
      throw new Error("Server is missing APPLE_NATIVE_BUNDLE_ID");
    }

    const { payload } = await jwtVerify(identityToken, appleKeys, {
      issuer: APPLE_ISSUER,
      audience: bundleId,
    });

    // The token carries whatever nonce the app passed to Apple: the raw value
    // or its SHA-256 hex. Either proves the token was minted for this attempt.
    const tokenNonce = payload.nonce;
    if (tokenNonce !== rawNonce && tokenNonce !== (await sha256Hex(rawNonce))) {
      throw new Error("Nonce mismatch");
    }
    if (!payload.sub) {
      throw new Error("Invalid Apple token");
    }

    const email = typeof payload.email === "string" ? payload.email : undefined;
    const emailVerified =
      payload.email_verified === true || payload.email_verified === "true";
    const name =
      typeof credentials.name === "string" && credentials.name.trim() !== ""
        ? credentials.name.trim()
        : undefined;

    const { user } = await createAccount(ctx, {
      provider: "apple-native",
      account: { id: payload.sub },
      profile: {
        ...(email ? { email } : {}),
        ...(name ? { name } : {}),
        ...(email && emailVerified ? { emailVerificationTime: Date.now() } : {}),
      },
      shouldLinkViaEmail: Boolean(email && emailVerified),
    });
    return { userId: user._id };
  },
});

// Env vars (set on the Convex deployment, never in the client):
//   AUTH_APPLE_ID            - Apple Services ID (web flow)
//   AUTH_APPLE_SECRET        - Apple client secret JWT (web flow)
//   APPLE_NATIVE_BUNDLE_ID   - the iOS app's Bundle ID (native flow)
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Apple({
      profile: (appleInfo) => {
        const name = appleInfo.user
          ? `${appleInfo.user.name.firstName} ${appleInfo.user.name.lastName}`
          : undefined;
        return { id: appleInfo.sub, name, email: appleInfo.email };
      },
    }),
    AppleNative,
  ],
});
