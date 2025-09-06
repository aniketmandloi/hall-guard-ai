"server only";

import { prisma } from "@/prisma/db";
import {
  WorkflowTransitionCreateInput,
  WorkflowTransitionQueryInput,
  WorkflowTransitionWithRelations,
  WorkflowValidationResult,
  ApiResponse,
  PaginatedResponse,
  workflowTransitionCreateSchema,
  workflowTransitionQuerySchema,
} from "@/lib/types/database";
import { WorkflowTransition, WorkflowStatus, UserRole } from "@prisma/client";

/**
 * Workflow state machine rules
 */
const WORKFLOW_TRANSITIONS: Record<
  WorkflowStatus,
  Record<UserRole, WorkflowStatus[]>
> = {
  [WorkflowStatus.DRAFT]: {
    [UserRole.ANALYST]: [WorkflowStatus.IN_REVIEW],
    [UserRole.COMPLIANCE]: [],
    [UserRole.MANAGER]: [WorkflowStatus.APPROVED, WorkflowStatus.REJECTED],
    [UserRole.ADMIN]: [
      WorkflowStatus.IN_REVIEW,
      WorkflowStatus.APPROVED,
      WorkflowStatus.REJECTED,
    ],
  },
  [WorkflowStatus.IN_REVIEW]: {
    [UserRole.ANALYST]: [WorkflowStatus.DRAFT],
    [UserRole.COMPLIANCE]: [
      WorkflowStatus.APPROVED,
      WorkflowStatus.REJECTED,
      WorkflowStatus.DRAFT,
    ],
    [UserRole.MANAGER]: [
      WorkflowStatus.APPROVED,
      WorkflowStatus.REJECTED,
      WorkflowStatus.DRAFT,
    ],
    [UserRole.ADMIN]: [
      WorkflowStatus.DRAFT,
      WorkflowStatus.APPROVED,
      WorkflowStatus.REJECTED,
    ],
  },
  [WorkflowStatus.APPROVED]: {
    [UserRole.ANALYST]: [],
    [UserRole.COMPLIANCE]: [WorkflowStatus.IN_REVIEW],
    [UserRole.MANAGER]: [WorkflowStatus.IN_REVIEW],
    [UserRole.ADMIN]: [
      WorkflowStatus.DRAFT,
      WorkflowStatus.IN_REVIEW,
      WorkflowStatus.REJECTED,
    ],
  },
  [WorkflowStatus.REJECTED]: {
    [UserRole.ANALYST]: [WorkflowStatus.DRAFT],
    [UserRole.COMPLIANCE]: [WorkflowStatus.IN_REVIEW],
    [UserRole.MANAGER]: [WorkflowStatus.IN_REVIEW],
    [UserRole.ADMIN]: [
      WorkflowStatus.DRAFT,
      WorkflowStatus.IN_REVIEW,
      WorkflowStatus.APPROVED,
    ],
  },
} as const;

/**
 * Validate if a workflow transition is allowed
 */
export const validateWorkflowTransition = async (
  documentId: number,
  fromStatus: WorkflowStatus,
  toStatus: WorkflowStatus,
  userRole: UserRole,
  userId: string
): Promise<ApiResponse<WorkflowValidationResult>> => {
  try {
    console.log("Validating workflow transition:", {
      documentId,
      fromStatus,
      toStatus,
      userRole,
      userId,
    });

    // Check if transition is allowed by role
    const allowedTransitions =
      WORKFLOW_TRANSITIONS[fromStatus]?.[userRole] || [];
    const canTransition = allowedTransitions.includes(toStatus);

    if (!canTransition) {
      return {
        success: true,
        data: {
          canTransition: false,
          requiredRole: UserRole.ADMIN,
          missingPermissions: [
            `Cannot transition from ${fromStatus} to ${toStatus} as ${userRole}`,
          ],
        },
      };
    }

    // Check if user has access to the document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        uploadedBy: true,
        currentAssignee: true,
        workflowStatus: true,
      },
    });

    if (!document) {
      return {
        success: false,
        error: "Document not found",
        code: "DOCUMENT_NOT_FOUND",
      };
    }

    // Verify current status matches fromStatus
    if (document.workflowStatus !== fromStatus) {
      return {
        success: true,
        data: {
          canTransition: false,
          requiredRole: userRole,
          blockers: [
            `Document status has changed to ${document.workflowStatus}`,
          ],
        },
      };
    }

    // Additional role-specific checks
    const blockers: string[] = [];

    // Analysts can only transition their own documents or assigned documents
    if (userRole === UserRole.ANALYST) {
      if (
        document.uploadedBy !== userId &&
        document.currentAssignee !== userId
      ) {
        blockers.push("Document not owned or assigned to user");
      }
    }

    // Get user info to verify role
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { role: true },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
        code: "USER_NOT_FOUND",
      };
    }

    if (user.role !== userRole) {
      blockers.push(
        `User role mismatch: expected ${userRole}, got ${user.role}`
      );
    }

    const validationResult: WorkflowValidationResult = {
      canTransition: blockers.length === 0,
      requiredRole: userRole,
      blockers: blockers.length > 0 ? blockers : undefined,
    };

    console.log("Workflow transition validation completed:", validationResult);
    return { success: true, data: validationResult };
  } catch (error: any) {
    console.error("Error validating workflow transition:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Create a workflow transition
 */
export const createWorkflowTransition = async (
  input: WorkflowTransitionCreateInput,
  skipValidation = false
): Promise<ApiResponse<WorkflowTransition>> => {
  try {
    console.log("Creating workflow transition with data:", input);

    // Validate input
    const validatedInput = workflowTransitionCreateSchema.parse(input);

    // Get current document status for validation
    const document = await prisma.document.findUnique({
      where: { id: validatedInput.documentId },
      select: { workflowStatus: true },
    });

    if (!document) {
      return {
        success: false,
        error: "Document not found",
        code: "DOCUMENT_NOT_FOUND",
      };
    }

    const fromStatus = document.workflowStatus;

    // Validate transition if not skipped
    if (!skipValidation) {
      const validation = await validateWorkflowTransition(
        validatedInput.documentId,
        fromStatus,
        validatedInput.toStatus,
        validatedInput.userRole,
        validatedInput.userId
      );

      if (!validation.success) {
        return {
          success: false,
          error: validation.error || "Validation failed",
          code: validation.code,
        };
      }

      if (!validation.data?.canTransition) {
        return {
          success: false,
          error: "Workflow transition not allowed",
          code: "TRANSITION_NOT_ALLOWED",
        };
      }
    }

    // Create transition and update document in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create workflow transition record
      const transition = await tx.workflowTransition.create({
        data: {
          ...validatedInput,
          fromStatus,
        },
      });

      // Update document workflow status
      await tx.document.update({
        where: { id: validatedInput.documentId },
        data: {
          workflowStatus: validatedInput.toStatus,
          updatedTime: new Date(),
          // Auto-assign for certain transitions
          currentAssignee: getAutoAssignee(
            validatedInput.toStatus,
            validatedInput.userId
          ),
        },
      });

      return transition;
    });

    console.log("Workflow transition created successfully:", result.id);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error creating workflow transition:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Get auto-assignee based on workflow status and current user
 */
const getAutoAssignee = (
  toStatus: WorkflowStatus,
  currentUserId: string
): string | undefined => {
  switch (toStatus) {
    case WorkflowStatus.IN_REVIEW:
      // Could implement logic to assign to compliance officers
      return undefined;
    case WorkflowStatus.DRAFT:
      // Return to the user who initiated the transition
      return currentUserId;
    default:
      return undefined;
  }
};

/**
 * Get workflow transitions for a document
 */
export const getDocumentWorkflowTransitions = async (
  documentId: number,
  limit = 20,
  offset = 0
): Promise<ApiResponse<PaginatedResponse<WorkflowTransitionWithRelations>>> => {
  try {
    console.log("Fetching workflow transitions for document:", documentId);

    return await queryWorkflowTransitions({
      documentId,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("Error fetching document workflow transitions:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Query workflow transitions with filtering and pagination
 */
export const queryWorkflowTransitions = async (
  query: WorkflowTransitionQueryInput
): Promise<ApiResponse<PaginatedResponse<WorkflowTransitionWithRelations>>> => {
  try {
    console.log("Querying workflow transitions with parameters:", query);

    // Validate query parameters
    const validatedQuery = workflowTransitionQuerySchema.parse(query);

    // Build where clause
    const whereClause: any = {};

    if (validatedQuery.documentId) {
      whereClause.documentId = validatedQuery.documentId;
    }

    if (validatedQuery.userId) {
      whereClause.userId = validatedQuery.userId;
    }

    if (validatedQuery.fromStatus) {
      whereClause.fromStatus = validatedQuery.fromStatus;
    }

    if (validatedQuery.toStatus) {
      whereClause.toStatus = validatedQuery.toStatus;
    }

    if (validatedQuery.userRole) {
      whereClause.userRole = validatedQuery.userRole;
    }

    if (validatedQuery.startDate || validatedQuery.endDate) {
      whereClause.createdTime = {};
      if (validatedQuery.startDate) {
        whereClause.createdTime.gte = validatedQuery.startDate;
      }
      if (validatedQuery.endDate) {
        whereClause.createdTime.lte = validatedQuery.endDate;
      }
    }

    // Get total count
    const total = await prisma.workflowTransition.count({
      where: whereClause,
    });

    // Get workflow transitions with pagination
    const transitions = await prisma.workflowTransition.findMany({
      where: whereClause,
      include: {
        document: {
          select: {
            id: true,
            filename: true,
            title: true,
            workflowStatus: true,
            uploadedBy: true,
          },
        },
        user: {
          select: {
            userId: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdTime: "desc" },
      take: validatedQuery.limit,
      skip: validatedQuery.offset,
    });

    const page = Math.floor(validatedQuery.offset / validatedQuery.limit) + 1;
    const hasNext = validatedQuery.offset + validatedQuery.limit < total;
    const hasPrevious = validatedQuery.offset > 0;

    const result: PaginatedResponse<WorkflowTransitionWithRelations> = {
      items: transitions as WorkflowTransitionWithRelations[],
      total,
      page,
      limit: validatedQuery.limit,
      hasNext,
      hasPrevious,
    };

    console.log(
      `Workflow transitions query completed: ${transitions.length} items, total: ${total}`
    );
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error querying workflow transitions:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Get workflow transitions by user
 */
export const getUserWorkflowTransitions = async (
  userId: string,
  limit = 20,
  offset = 0
): Promise<ApiResponse<PaginatedResponse<WorkflowTransitionWithRelations>>> => {
  try {
    console.log("Fetching workflow transitions for user:", userId);

    return await queryWorkflowTransitions({
      userId,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("Error fetching user workflow transitions:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Get available workflow actions for a document and user
 */
export const getAvailableWorkflowActions = async (
  documentId: number,
  userId: string
): Promise<
  ApiResponse<{
    currentStatus: WorkflowStatus;
    availableTransitions: WorkflowStatus[];
    userRole: UserRole;
    canTransition: boolean;
  }>
> => {
  try {
    console.log(
      "Getting available workflow actions for document:",
      documentId,
      "user:",
      userId
    );

    // Get document and user info
    const [document, user] = await Promise.all([
      prisma.document.findUnique({
        where: { id: documentId },
        select: {
          workflowStatus: true,
          uploadedBy: true,
          currentAssignee: true,
        },
      }),
      prisma.user.findUnique({
        where: { userId },
        select: { role: true },
      }),
    ]);

    if (!document) {
      return {
        success: false,
        error: "Document not found",
        code: "DOCUMENT_NOT_FOUND",
      };
    }

    if (!user) {
      return {
        success: false,
        error: "User not found",
        code: "USER_NOT_FOUND",
      };
    }

    const currentStatus = document.workflowStatus;
    const userRole = user.role;

    // Get available transitions for this role and status
    const availableTransitions =
      WORKFLOW_TRANSITIONS[currentStatus]?.[userRole] || [];

    // Check if user can generally transition (role-based access)
    let canTransition = availableTransitions.length > 0;

    // Additional checks for analysts
    if (userRole === UserRole.ANALYST) {
      canTransition =
        canTransition &&
        (document.uploadedBy === userId || document.currentAssignee === userId);
    }

    const result = {
      currentStatus,
      availableTransitions,
      userRole,
      canTransition,
    };

    console.log("Available workflow actions retrieved:", result);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error getting available workflow actions:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Get workflow statistics
 */
export const getWorkflowStatistics = async (
  userId?: string,
  timeRange?: { start: Date; end: Date }
): Promise<
  ApiResponse<{
    totalTransitions: number;
    byStatus: Record<WorkflowStatus, number>;
    byRole: Record<UserRole, number>;
    averageTimeInStatus: Record<WorkflowStatus, number>;
    pendingDocuments: Record<WorkflowStatus, number>;
  }>
> => {
  try {
    console.log("Fetching workflow statistics for user:", userId);

    const whereClause: any = {};
    if (userId) {
      whereClause.userId = userId;
    }
    if (timeRange) {
      whereClause.createdTime = {
        gte: timeRange.start,
        lte: timeRange.end,
      };
    }

    const [totalTransitions, statusCounts, roleCounts, pendingCounts] =
      await Promise.all([
        prisma.workflowTransition.count({ where: whereClause }),

        prisma.workflowTransition.groupBy({
          by: ["toStatus"],
          where: whereClause,
          _count: { toStatus: true },
        }),

        prisma.workflowTransition.groupBy({
          by: ["userRole"],
          where: whereClause,
          _count: { userRole: true },
        }),

        prisma.document.groupBy({
          by: ["workflowStatus"],
          _count: { workflowStatus: true },
        }),
      ]);

    // Convert grouped results to record format
    const byStatus = Object.values(WorkflowStatus).reduce((acc, status) => {
      const found = statusCounts.find((item) => item.toStatus === status);
      acc[status] = found?._count.toStatus || 0;
      return acc;
    }, {} as Record<WorkflowStatus, number>);

    const byRole = Object.values(UserRole).reduce((acc, role) => {
      const found = roleCounts.find((item) => item.userRole === role);
      acc[role] = found?._count.userRole || 0;
      return acc;
    }, {} as Record<UserRole, number>);

    const pendingDocuments = Object.values(WorkflowStatus).reduce(
      (acc, status) => {
        const found = pendingCounts.find(
          (item) => item.workflowStatus === status
        );
        acc[status] = found?._count.workflowStatus || 0;
        return acc;
      },
      {} as Record<WorkflowStatus, number>
    );

    // Calculate average time in status (simplified - would need more complex query for accuracy)
    const averageTimeInStatus = Object.values(WorkflowStatus).reduce(
      (acc, status) => {
        acc[status] = 0; // Placeholder - implement detailed calculation if needed
        return acc;
      },
      {} as Record<WorkflowStatus, number>
    );

    const statistics = {
      totalTransitions,
      byStatus,
      byRole,
      averageTimeInStatus,
      pendingDocuments,
    };

    console.log("Workflow statistics fetched successfully");
    return { success: true, data: statistics };
  } catch (error: any) {
    console.error("Error fetching workflow statistics:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Bulk transition multiple documents
 */
export const bulkTransitionDocuments = async (
  documentIds: number[],
  toStatus: WorkflowStatus,
  userId: string,
  userRole: UserRole,
  comment?: string
): Promise<
  ApiResponse<{
    successful: number[];
    failed: Array<{ documentId: number; error: string }>;
  }>
> => {
  try {
    console.log(
      "Bulk transitioning documents:",
      documentIds.length,
      "to status:",
      toStatus
    );

    const successful: number[] = [];
    const failed: Array<{ documentId: number; error: string }> = [];

    // Process each document individually
    for (const documentId of documentIds) {
      try {
        const result = await createWorkflowTransition({
          documentId,
          toStatus,
          userId,
          userRole,
          comment,
        });

        if (result.success) {
          successful.push(documentId);
        } else {
          failed.push({
            documentId,
            error: result.error || "Unknown error",
          });
        }
      } catch (error: any) {
        failed.push({
          documentId,
          error: error.message,
        });
      }
    }

    const result = { successful, failed };
    console.log("Bulk transition completed:", result);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error in bulk transition:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};
