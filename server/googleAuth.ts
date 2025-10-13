import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";
import type { Express } from "express";

export function setupGoogleAuth(app: Express) {
  // Check if Google OAuth credentials are configured
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("Google OAuth credentials not found - Google direct login disabled");
    return;
  }

  // Get the callback URL based on environment
  const getCallbackURL = (req: any) => {
    const protocol = req.protocol;
    const host = req.get('host');
    return `${protocol}://${host}/auth/google/callback`;
  };

  // Configure Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback",
        passReqToCallback: true,
      },
      async (req: any, accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          // Extract user data from Google profile
          const userData = {
            id: profile.id,
            email: profile.emails?.[0]?.value || "",
            firstName: profile.name?.givenName || "",
            lastName: profile.name?.familyName || "",
            profileImageUrl: profile.photos?.[0]?.value || null,
          };

          // Create or update user in database
          await storage.upsertUser(userData);

          // Return user for session
          done(null, {
            claims: {
              sub: profile.id,
              email: userData.email,
              first_name: userData.firstName,
              last_name: userData.lastName,
              profile_image_url: userData.profileImageUrl,
            },
            googleAuth: true,
          });
        } catch (error) {
          console.error("Error in Google OAuth callback:", error);
          done(error, null);
        }
      }
    )
  );

  // Google OAuth Routes
  app.get(
    "/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account", // Always show account selector
    })
  );

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/login?error=google_auth_failed",
    }),
    (req, res) => {
      // Successful authentication, redirect to home
      res.redirect("/");
    }
  );

  console.log("Google OAuth direct login configured successfully");
}
