import { convexAuth } from "@convex-dev/auth/server";
import Apple from "@auth/core/providers/apple";

// Env vars (set on the Convex deployment, never in the client):
//   AUTH_APPLE_ID      - Apple Services ID
//   AUTH_APPLE_SECRET  - Apple client secret (JWT signed with your .p8 key)
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
  ],
});
