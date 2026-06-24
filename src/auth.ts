import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await dbConnect();
        const userExists = await User.findOne({ email: user.email });

        if (!userExists) {
          await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
            credits: 5, // Give 5 free credits on sign up
          });
        }
      }
      return true;
    },
    async session({ session }) {
      await dbConnect();
      const sessionUser = await User.findOne({ email: session.user?.email });
      if (sessionUser) {
        (session.user as any).id = sessionUser._id.toString();
        (session.user as any).credits = sessionUser.credits;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
});
