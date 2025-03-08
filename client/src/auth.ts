import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { googleUser } from "./lib/api/user";

type userDataType = {
    googleId: string;
    username: string;
    email: string;
    profileImage: string; 
};

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

          const userData: userDataType = {
            googleId: account.providerAccountId,
            username: user.name,
            email: user.email,
            profileImage: user.image,
          };

          console.log("Sending User Data to Backend:", userData);
          const response = await googleUser(userData);

          if (response.success) {
            if (typeof window !== "undefined") {
              localStorage.setItem("userToken", response.data.accessToken);
            }
            return true;
          } else {
            return false;
          }
        } catch (error) {
          console.error("Error storing google-user:", error);
          return false;
        }
      }
      return true;
    },
    async redirect({ url, baseUrl}) {
      return '/homepage'
    }
  },
  secret: process.env.AUTH_SECRET,
  debug: true, // debug logs for troubleshooting
});

