import type { AuditAction, AuditEntityType } from "./index";

export interface AuditLog {
  id: string;
  lenderId: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityLabel: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
