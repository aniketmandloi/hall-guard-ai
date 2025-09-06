"server only";

import { prisma } from "@/prisma/db";
import {
  DocumentCommentCreateInput,
  DocumentCommentUpdateInput,
  DocumentCommentQueryInput,
  DocumentCommentWithRelations,
  AuditLogQueryInput,
  ApiResponse,
  PaginatedResponse,
  documentCommentCreateSchema,
  documentCommentUpdateSchema,
  documentCommentQuerySchema,
  auditLogQuerySchema,
} from "@/lib/types/database";
import {
  DocumentComment,
  WorkflowTransition,
  UserRole,
  WorkflowStatus,
  DocumentStatus,
} from "@prisma/client";

/**
 * Create a document comment
 */
export const createDocumentComment = async (
  input: DocumentCommentCreateInput
): Promise<ApiResponse<DocumentComment>> => {
  try {
    console.log("Creating document comment with data:", input);

    // Validate input
    const validatedInput = documentCommentCreateSchema.parse(input);

    // Verify user has access to the document
    const document = await prisma.document.findUnique({
      where: { id: validatedInput.documentId },
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

    // Get user role for access control
    const user = await prisma.user.findUnique({
      where: { userId: validatedInput.userId },
      select: { role: true },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
        code: "USER_NOT_FOUND",
      };
    }

    // Check if user can comment on this document
    const canComment =
      user.role === UserRole.ADMIN ||
      document.uploadedBy === validatedInput.userId ||
      document.currentAssignee === validatedInput.userId ||
      user.role === UserRole.COMPLIANCE ||
      user.role === UserRole.MANAGER;

    if (!canComment) {
      return {
        success: false,
        error: "User not authorized to comment on this document",
        code: "UNAUTHORIZED_COMMENT",
      };
    }

    const comment = await prisma.documentComment.create({
      data: validatedInput,
    });

    console.log("Document comment created successfully:", comment.id);
    return { success: true, data: comment };
  } catch (error: any) {
    console.error("Error creating document comment:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Update a document comment
 */
export const updateDocumentComment = async (
  id: number,
  input: DocumentCommentUpdateInput,
  userId: string
): Promise<ApiResponse<DocumentComment>> => {
  try {
    console.log("Updating document comment ID:", id, "with data:", input);

    // Validate input
    const validatedInput = documentCommentUpdateSchema.parse(input);

    // Check if user owns the comment or has admin privileges
    const existingComment = await prisma.documentComment.findUnique({
      where: { id },
      include: {
        user: { select: { role: true } },
      },
    });

    if (!existingComment) {
      return {
        success: false,
        error: "Comment not found",
        code: "COMMENT_NOT_FOUND",
      };
    }

    const currentUser = await prisma.user.findUnique({
      where: { userId },
      select: { role: true },
    });

    if (!currentUser) {
      return {
        success: false,
        error: "User not found",
        code: "USER_NOT_FOUND",
      };
    }

    const canUpdate =
      existingComment.userId === userId || currentUser.role === UserRole.ADMIN;

    if (!canUpdate) {
      return {
        success: false,
        error: "User not authorized to update this comment",
        code: "UNAUTHORIZED_UPDATE",
      };
    }

    const comment = await prisma.documentComment.update({
      where: { id },
      data: validatedInput,
    });

    console.log("Document comment updated successfully:", comment.id);
    return { success: true, data: comment };
  } catch (error: any) {
    console.error("Error updating document comment:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Get document comment by ID with relations
 */
export const getDocumentCommentById = async (
  id: number,
  includeRelations = true
): Promise<ApiResponse<DocumentComment | DocumentCommentWithRelations>> => {
  try {
    console.log("Fetching document comment by ID:", id);

    const comment = await prisma.documentComment.findUnique({
      where: { id },
      include: includeRelations
        ? {
            user: {
              select: {
                userId: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
            document: {
              select: {
                id: true,
                filename: true,
                title: true,
                workflowStatus: true,
              },
            },
            analysisResult: true,
            parentComment: {
              include: {
                user: {
                  select: {
                    userId: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            childComments: {
              include: {
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
              orderBy: { createdTime: "asc" },
            },
          }
        : undefined,
    });

    if (!comment) {
      return {
        success: false,
        error: "Comment not found",
        code: "COMMENT_NOT_FOUND",
      };
    }

    return { success: true, data: comment };
  } catch (error: any) {
    console.error("Error fetching document comment:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Query document comments with filtering and pagination
 */
export const queryDocumentComments = async (
  query: DocumentCommentQueryInput
): Promise<ApiResponse<PaginatedResponse<DocumentCommentWithRelations>>> => {
  try {
    console.log("Querying document comments with parameters:", query);

    // Validate query parameters
    const validatedQuery = documentCommentQuerySchema.parse(query);

    // Build where clause
    const whereClause: any = {};

    if (validatedQuery.documentId) {
      whereClause.documentId = validatedQuery.documentId;
    }

    if (validatedQuery.analysisResultId) {
      whereClause.analysisResultId = validatedQuery.analysisResultId;
    }

    if (validatedQuery.userId) {
      whereClause.userId = validatedQuery.userId;
    }

    if (validatedQuery.isInternal !== undefined) {
      whereClause.isInternal = validatedQuery.isInternal;
    }

    if (validatedQuery.parentCommentId !== undefined) {
      whereClause.parentCommentId = validatedQuery.parentCommentId;
    }

    // Get total count
    const total = await prisma.documentComment.count({
      where: whereClause,
    });

    // Get comments with pagination
    const comments = await prisma.documentComment.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            userId: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        document: {
          select: {
            id: true,
            filename: true,
            title: true,
            workflowStatus: true,
          },
        },
        analysisResult: {
          select: {
            id: true,
            analysisType: true,
            riskLevel: true,
            isFlagged: true,
          },
        },
        parentComment: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        childComments: {
          select: {
            id: true,
            content: true,
            createdTime: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: { createdTime: "asc" },
          take: 5, // Limit child comments in list view
        },
      },
      orderBy: [
        { parentCommentId: { sort: "asc", nulls: "first" } },
        { createdTime: "desc" },
      ],
      take: validatedQuery.limit,
      skip: validatedQuery.offset,
    });

    const page = Math.floor(validatedQuery.offset / validatedQuery.limit) + 1;
    const hasNext = validatedQuery.offset + validatedQuery.limit < total;
    const hasPrevious = validatedQuery.offset > 0;

    const result: PaginatedResponse<DocumentCommentWithRelations> = {
      items: comments as any as DocumentCommentWithRelations[],
      total,
      page,
      limit: validatedQuery.limit,
      hasNext,
      hasPrevious,
    };

    console.log(
      `Document comments query completed: ${comments.length} items, total: ${total}`
    );
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error querying document comments:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Get comments for a document
 */
export const getDocumentComments = async (
  documentId: number,
  includeInternal = true,
  limit = 20,
  offset = 0
): Promise<ApiResponse<PaginatedResponse<DocumentCommentWithRelations>>> => {
  try {
    console.log("Fetching comments for document:", documentId);

    const queryParams: DocumentCommentQueryInput = {
      documentId,
      limit,
      offset,
    };

    if (!includeInternal) {
      queryParams.isInternal = false;
    }

    return await queryDocumentComments(queryParams);
  } catch (error: any) {
    console.error("Error fetching document comments:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Delete a document comment
 */
export const deleteDocumentComment = async (
  id: number,
  userId: string
): Promise<ApiResponse<void>> => {
  try {
    console.log("Deleting document comment ID:", id, "by user:", userId);

    // Check if user owns the comment or has admin privileges
    const existingComment = await prisma.documentComment.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingComment) {
      return {
        success: false,
        error: "Comment not found",
        code: "COMMENT_NOT_FOUND",
      };
    }

    const currentUser = await prisma.user.findUnique({
      where: { userId },
      select: { role: true },
    });

    if (!currentUser) {
      return {
        success: false,
        error: "User not found",
        code: "USER_NOT_FOUND",
      };
    }

    const canDelete =
      existingComment.userId === userId || currentUser.role === UserRole.ADMIN;

    if (!canDelete) {
      return {
        success: false,
        error: "User not authorized to delete this comment",
        code: "UNAUTHORIZED_DELETE",
      };
    }

    await prisma.documentComment.delete({
      where: { id },
    });

    console.log("Document comment deleted successfully:", id);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting document comment:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Get comprehensive audit log
 */
export const getAuditLog = async (
  query: AuditLogQueryInput
): Promise<
  ApiResponse<
    PaginatedResponse<{
      id: string;
      timestamp: Date;
      action: string;
      userId: string;
      userEmail: string;
      userRole: UserRole;
      documentId?: number;
      documentTitle?: string;
      details: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
    }>
  >
> => {
  try {
    console.log("Fetching audit log with parameters:", query);

    // Validate query parameters
    const validatedQuery = auditLogQuerySchema.parse(query);

    // Build base where clauses for different sources
    const userFilter: any = {};
    const documentFilter: any = {};
    const dateFilter: any = {};

    if (validatedQuery.userId) {
      userFilter.userId = validatedQuery.userId;
    }

    if (validatedQuery.documentId) {
      documentFilter.documentId = validatedQuery.documentId;
    }

    if (validatedQuery.startDate || validatedQuery.endDate) {
      if (validatedQuery.startDate) {
        dateFilter.gte = validatedQuery.startDate;
      }
      if (validatedQuery.endDate) {
        dateFilter.lte = validatedQuery.endDate;
      }
    }

    // Collect audit entries from different sources
    const auditEntries: Array<{
      id: string;
      timestamp: Date;
      action: string;
      userId: string;
      userEmail: string;
      userRole: UserRole;
      documentId?: number;
      documentTitle?: string;
      details: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
    }> = [];

    // Get workflow transitions
    const workflowTransitions = await prisma.workflowTransition.findMany({
      where: {
        ...userFilter,
        ...documentFilter,
        ...(Object.keys(dateFilter).length > 0
          ? { createdTime: dateFilter }
          : {}),
      },
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
        document: {
          select: {
            filename: true,
            title: true,
          },
        },
      },
      orderBy: { createdTime: "desc" },
      take: validatedQuery.limit * 2, // Get more to account for filtering
    });

    // Add workflow transitions to audit entries
    for (const transition of workflowTransitions) {
      auditEntries.push({
        id: `wt_${transition.id}`,
        timestamp: transition.createdTime,
        action: `Workflow transition: ${transition.fromStatus || "UNKNOWN"} → ${
          transition.toStatus
        }`,
        userId: transition.userId,
        userEmail: transition.user.email,
        userRole: transition.userRole,
        documentId: transition.documentId,
        documentTitle:
          transition.document.title || transition.document.filename,
        details: {
          fromStatus: transition.fromStatus,
          toStatus: transition.toStatus,
          comment: transition.comment,
          transitionData: transition.transitionData,
        },
        ipAddress: transition.ipAddress || undefined,
        userAgent: transition.userAgent || undefined,
      });
    }

    // Get document comments (as audit events)
    const comments = await prisma.documentComment.findMany({
      where: {
        ...userFilter,
        ...documentFilter,
        ...(Object.keys(dateFilter).length > 0
          ? { createdTime: dateFilter }
          : {}),
      },
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
        document: {
          select: {
            filename: true,
            title: true,
          },
        },
        analysisResult: {
          select: {
            id: true,
            analysisType: true,
          },
        },
      },
      orderBy: { createdTime: "desc" },
      take: validatedQuery.limit,
    });

    // Add comments to audit entries
    for (const comment of comments) {
      auditEntries.push({
        id: `cm_${comment.id}`,
        timestamp: comment.createdTime,
        action: comment.analysisResultId
          ? "Comment on analysis result"
          : "Document comment",
        userId: comment.userId,
        userEmail: comment.user.email,
        userRole: comment.user.role,
        documentId: comment.documentId,
        documentTitle: comment.document.title || comment.document.filename,
        details: {
          content: comment.content,
          isInternal: comment.isInternal,
          analysisResultId: comment.analysisResultId,
          parentCommentId: comment.parentCommentId,
        },
      });
    }

    // Sort all entries by timestamp
    auditEntries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const total = auditEntries.length;
    const paginatedEntries = auditEntries.slice(
      validatedQuery.offset,
      validatedQuery.offset + validatedQuery.limit
    );

    const page = Math.floor(validatedQuery.offset / validatedQuery.limit) + 1;
    const hasNext = validatedQuery.offset + validatedQuery.limit < total;
    const hasPrevious = validatedQuery.offset > 0;

    const result: PaginatedResponse<(typeof paginatedEntries)[0]> = {
      items: paginatedEntries,
      total,
      page,
      limit: validatedQuery.limit,
      hasNext,
      hasPrevious,
    };

    console.log(
      `Audit log query completed: ${paginatedEntries.length} items, total: ${total}`
    );
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error fetching audit log:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Get user activity summary
 */
export const getUserActivitySummary = async (
  userId: string,
  timeRange?: { start: Date; end: Date }
): Promise<
  ApiResponse<{
    totalActions: number;
    documentsUploaded: number;
    workflowTransitions: number;
    commentsCreated: number;
    documentsApproved: number;
    documentsRejected: number;
    mostActiveDay: string;
    recentActivity: Array<{
      action: string;
      timestamp: Date;
      documentTitle?: string;
    }>;
  }>
> => {
  try {
    console.log("Fetching user activity summary for:", userId);

    let dateFilter: any = {};
    if (timeRange) {
      dateFilter = {
        gte: timeRange.start,
        lte: timeRange.end,
      };
    }

    const [
      documentsUploaded,
      workflowTransitions,
      commentsCreated,
      approvals,
      rejections,
      recentTransitions,
      recentComments,
    ] = await Promise.all([
      prisma.document.count({
        where: {
          uploadedBy: userId,
          ...(Object.keys(dateFilter).length > 0
            ? { createdTime: dateFilter }
            : {}),
        },
      }),

      prisma.workflowTransition.count({
        where: {
          userId,
          ...(Object.keys(dateFilter).length > 0
            ? { createdTime: dateFilter }
            : {}),
        },
      }),

      prisma.documentComment.count({
        where: {
          userId,
          ...(Object.keys(dateFilter).length > 0
            ? { createdTime: dateFilter }
            : {}),
        },
      }),

      prisma.workflowTransition.count({
        where: {
          userId,
          toStatus: WorkflowStatus.APPROVED,
          ...(Object.keys(dateFilter).length > 0
            ? { createdTime: dateFilter }
            : {}),
        },
      }),

      prisma.workflowTransition.count({
        where: {
          userId,
          toStatus: WorkflowStatus.REJECTED,
          ...(Object.keys(dateFilter).length > 0
            ? { createdTime: dateFilter }
            : {}),
        },
      }),

      prisma.workflowTransition.findMany({
        where: {
          userId,
          ...(Object.keys(dateFilter).length > 0
            ? { createdTime: dateFilter }
            : {}),
        },
        include: {
          document: {
            select: { title: true, filename: true },
          },
        },
        orderBy: { createdTime: "desc" },
        take: 5,
      }),

      prisma.documentComment.findMany({
        where: {
          userId,
          ...(Object.keys(dateFilter).length > 0
            ? { createdTime: dateFilter }
            : {}),
        },
        include: {
          document: {
            select: { title: true, filename: true },
          },
        },
        orderBy: { createdTime: "desc" },
        take: 5,
      }),
    ]);

    // Combine recent activities
    const recentActivity = [
      ...recentTransitions.map((t) => ({
        action: `Workflow: ${t.fromStatus} → ${t.toStatus}`,
        timestamp: t.createdTime,
        documentTitle: t.document.title || t.document.filename,
      })),
      ...recentComments.map((c) => ({
        action: "Added comment",
        timestamp: c.createdTime,
        documentTitle: c.document.title || c.document.filename,
      })),
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    const totalActions =
      documentsUploaded + workflowTransitions + commentsCreated;

    const summary = {
      totalActions,
      documentsUploaded,
      workflowTransitions,
      commentsCreated,
      documentsApproved: approvals,
      documentsRejected: rejections,
      mostActiveDay: "Today", // Simplified - could calculate actual most active day
      recentActivity,
    };

    console.log("User activity summary fetched successfully");
    return { success: true, data: summary };
  } catch (error: any) {
    console.error("Error fetching user activity summary:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Generate compliance report data
 */
export const generateComplianceReport = async (
  timeRange: { start: Date; end: Date },
  documentIds?: number[]
): Promise<
  ApiResponse<{
    reportPeriod: { start: Date; end: Date };
    totalDocuments: number;
    processedDocuments: number;
    flaggedIssues: number;
    approvedDocuments: number;
    rejectedDocuments: number;
    averageProcessingTime: number;
    userActivity: Record<string, number>;
    complianceMetrics: {
      documentsWithIssues: number;
      highRiskDocuments: number;
      issuesResolved: number;
      issuesPending: number;
    };
  }>
> => {
  try {
    console.log("Generating compliance report for period:", timeRange);

    const documentFilter: any = {
      createdTime: {
        gte: timeRange.start,
        lte: timeRange.end,
      },
    };

    if (documentIds && documentIds.length > 0) {
      documentFilter.id = { in: documentIds };
    }

    const [
      totalDocuments,
      processedDocuments,
      flaggedIssues,
      approvedDocs,
      rejectedDocs,
      userActivityData,
      processingTimes,
      highRiskDocs,
      pendingDocs,
    ] = await Promise.all([
      prisma.document.count({
        where: documentFilter,
      }),

      prisma.document.count({
        where: {
          ...documentFilter,
          status: DocumentStatus.COMPLETED,
        },
      }),

      prisma.analysisResult.count({
        where: {
          document: documentFilter,
          isFlagged: true,
        },
      }),

      prisma.document.count({
        where: {
          ...documentFilter,
          workflowStatus: WorkflowStatus.APPROVED,
        },
      }),

      prisma.document.count({
        where: {
          ...documentFilter,
          workflowStatus: WorkflowStatus.REJECTED,
        },
      }),

      prisma.workflowTransition.groupBy({
        by: ["userId"],
        where: {
          createdTime: {
            gte: timeRange.start,
            lte: timeRange.end,
          },
        },
        _count: { userId: true },
      }),

      prisma.document.aggregate({
        where: {
          ...documentFilter,
          processingStartedAt: { not: null },
          processingCompletedAt: { not: null },
        },
        _avg: {
          id: true, // This would need a computed field for processing time
        },
      }),

      prisma.document.count({
        where: {
          ...documentFilter,
          analysisResults: {
            some: {
              riskLevel: "HIGH",
              isFlagged: true,
            },
          },
        },
      }),

      prisma.document.count({
        where: {
          ...documentFilter,
          workflowStatus: WorkflowStatus.IN_REVIEW,
        },
      }),
    ]);

    // Convert user activity to record format
    const userActivity = userActivityData.reduce((acc, item) => {
      acc[item.userId] = item._count.userId;
      return acc;
    }, {} as Record<string, number>);

    const documentsWithIssues = await prisma.document.count({
      where: {
        ...documentFilter,
        analysisResults: {
          some: { isFlagged: true },
        },
      },
    });

    const report = {
      reportPeriod: timeRange,
      totalDocuments,
      processedDocuments,
      flaggedIssues,
      approvedDocuments: approvedDocs,
      rejectedDocuments: rejectedDocs,
      averageProcessingTime: 0, // Would need computed field for accurate calculation
      userActivity,
      complianceMetrics: {
        documentsWithIssues,
        highRiskDocuments: highRiskDocs,
        issuesResolved: approvedDocs, // Simplified
        issuesPending: pendingDocs,
      },
    };

    console.log("Compliance report generated successfully");
    return { success: true, data: report };
  } catch (error: any) {
    console.error("Error generating compliance report:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};
