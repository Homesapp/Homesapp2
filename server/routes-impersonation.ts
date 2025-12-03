import type { Express } from "express";
import { isAuthenticated, requireRole } from "./replitAuth";
import { storage } from "./storage";
import { db } from "./db";
import { users, auditLogs } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Helper function to get user's agency ID
async function getUserAgencyId(req: any): Promise<string | null> {
  if (req.user?.cachedAgencyId) {
    return req.user.cachedAgencyId;
  }
  const userId = req.user?.claims?.sub || req.session?.userId;
  if (!userId) return null;
  const user = await storage.getUser(userId);
  return user?.externalAgencyId || null;
}

// Helper to create audit log
async function createAuditLog(req: any, action: string, resourceType: string, resourceId: string, description: string) {
  const userId = req.session?.originalAdminId || req.user?.claims?.sub || req.session?.userId;
  const userAgent = req.headers['user-agent'] || '';
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '';
  
  await db.insert(auditLogs).values({
    userId,
    action,
    resourceType,
    resourceId,
    description,
    ipAddress,
    userAgent,
  });
}

export function registerImpersonationRoutes(app: Express) {
  const EXTERNAL_ADMIN_ROLES = ["master", "admin", "external_agency_admin"];
  
  // Start impersonation - admin views as another user
  app.post("/api/external-agency-users/:id/impersonate", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Get current admin's agency ID
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) {
        return res.status(400).json({ message: "No agency assigned to admin" });
      }
      
      // Get the original admin ID (not impersonated)
      const originalAdminId = req.session?.originalAdminId || req.session?.userId || req.user?.claims?.sub;
      
      // Verify target user exists and belongs to the same agency
      const targetUser = await storage.getUser(id);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (targetUser.externalAgencyId !== agencyId) {
        return res.status(403).json({ message: "Cannot impersonate user from another agency" });
      }
      
      // Don't allow impersonating yourself
      if (targetUser.id === originalAdminId) {
        return res.status(400).json({ message: "Cannot impersonate yourself" });
      }
      
      // Store impersonation in session
      req.session.impersonatedUserId = id;
      req.session.originalAdminId = originalAdminId;
      
      // Clear cached user to force reload with impersonated user data
      delete req.session.cachedUser;
      
      await createAuditLog(
        req, 
        "impersonate_start", 
        "user", 
        id, 
        `Admin started impersonating user ${targetUser.firstName} ${targetUser.lastName}`
      );
      
      res.json({ 
        message: "Impersonation started",
        impersonatedUser: {
          id: targetUser.id,
          firstName: targetUser.firstName,
          lastName: targetUser.lastName,
          email: targetUser.email,
          role: targetUser.additionalRole || targetUser.role,
        }
      });
    } catch (error: any) {
      console.error("Error starting impersonation:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // End impersonation - return to admin view
  app.post("/api/external/end-impersonation", isAuthenticated, async (req: any, res) => {
    try {
      if (!req.session?.impersonatedUserId || !req.session?.originalAdminId) {
        return res.status(400).json({ message: "Not currently impersonating anyone" });
      }
      
      const impersonatedUserId = req.session.impersonatedUserId;
      const originalAdminId = req.session.originalAdminId;
      
      // Get impersonated user for audit log
      const impersonatedUser = await storage.getUser(impersonatedUserId);
      
      // Clear impersonation
      delete req.session.impersonatedUserId;
      delete req.session.originalAdminId;
      delete req.session.cachedUser;
      
      // Restore original session
      req.session.userId = originalAdminId;
      
      await createAuditLog(
        req,
        "impersonate_end",
        "user",
        impersonatedUserId,
        `Admin stopped impersonating user ${impersonatedUser?.firstName} ${impersonatedUser?.lastName}`
      );
      
      res.json({ message: "Impersonation ended" });
    } catch (error: any) {
      console.error("Error ending impersonation:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get current impersonation status
  app.get("/api/external/impersonation-status", isAuthenticated, async (req: any, res) => {
    try {
      if (!req.session?.impersonatedUserId || !req.session?.originalAdminId) {
        return res.json({ isImpersonating: false });
      }
      
      const impersonatedUser = await storage.getUser(req.session.impersonatedUserId);
      const originalAdmin = await storage.getUser(req.session.originalAdminId);
      
      if (!impersonatedUser) {
        // Clear invalid impersonation
        delete req.session.impersonatedUserId;
        delete req.session.originalAdminId;
        return res.json({ isImpersonating: false });
      }
      
      res.json({
        isImpersonating: true,
        impersonatedUser: {
          id: impersonatedUser.id,
          firstName: impersonatedUser.firstName,
          lastName: impersonatedUser.lastName,
          email: impersonatedUser.email,
          role: impersonatedUser.additionalRole || impersonatedUser.role,
        },
        originalAdmin: originalAdmin ? {
          id: originalAdmin.id,
          firstName: originalAdmin.firstName,
          lastName: originalAdmin.lastName,
        } : null,
      });
    } catch (error: any) {
      console.error("Error getting impersonation status:", error);
      res.status(500).json({ message: error.message });
    }
  });
}
