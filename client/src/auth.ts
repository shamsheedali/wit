import { cookies } from 'next/headers';
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { googleUser } from "./lib/api/user";

export const { handlers, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          if (!user.name || !user.email || !user.image) {
            console.error("Missing required user data from Google:", user);
            return false;
          }

          const userData = {
            googleId: account.providerAccountId,
            username: user.name,
            email: user.email,
            profileImage: user.image,
          };

          const result = await googleUser(userData);
          
          // Storing token in a cookie
          if (result?.success && result?.data?.accessToken) {
            //cookie with the token
            const cookieStore = await cookies();
            cookieStore.set('google_auth_token', result.data.accessToken, {
              maxAge: 60 * 60 * 24 * 7, // 1 week
              path: '/',
              httpOnly: false, // Make it accessible from JavaScript
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax'
            });

            cookieStore.set('google_user_data', JSON.stringify(result.data.user), {
              maxAge: 60 * 60 * 24 * 7, // 1 week
              path: '/',
              httpOnly: false, // Make it accessible from JavaScript
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax'
            })
          }
        } catch (error) {
          console.error("Error storing google-user:", error);
          return false;
        }
      }
      return true;
    },
    async redirect({ url, baseUrl}) {
      return '/'
    }
  },
  secret: process.env.AUTH_SECRET,
});