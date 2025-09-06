"server only";

import { prisma } from "@/prisma/db";
import {
  DocumentCreateInput,
  DocumentUpdateInput,
  DocumentQueryInput,
  DocumentChunkCreateInput,
  DocumentWithRelations,
  ApiResponse,
  PaginatedResponse,
  documentCreateSchema,
  documentUpdateSchema,
  documentQuerySchema,
  documentChunkCreateSchema,
} from "@/lib/types/database";
import {
  Document,
  DocumentChunk,
  DocumentStatus,
  WorkflowStatus,
} from "@prisma/client";

/**
 * Create a new document record
 */
export const createDocument = async (
  input: DocumentCreateInput
): Promise<ApiResponse<Document>> => {
  try {
    console.log("Creating document with data:", input);

    // Validate input
    const validatedInput = documentCreateSchema.parse(input);

    const document = await prisma.document.create({
      data: {
        filename: validatedInput.filename,
        originalFilename: validatedInput.originalFilename,
        fileType: validatedInput.fileType,
        fileSize: validatedInput.fileSize,
        fileHash: validatedInput.fileHash,
        uploadedBy: validatedInput.uploadedBy,
        title: validatedInput.title,
        author: validatedInput.author,
        documentDate: validatedInput.documentDate,
        tags: validatedInput.tags,
        storagePath: validatedInput.storagePath,
        retentionExpiresAt: validatedInput.retentionExpiresAt,
        status: DocumentStatus.UPLOADED,
        workflowStatus: WorkflowStatus.DRAFT,
      },
    });

    console.log("Document created successfully:", document.id);
    return { success: true, data: document };
  } catch (error: any) {
    console.error("Error creating document:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Update an existing document
 */
export const updateDocument = async (
  id: number,
  input: DocumentUpdateInput
): Promise<ApiResponse<Document>> => {
  try {
    console.log("Updating document ID:", id, "with data:", input);

    // Validate input
    const validatedInput = documentUpdateSchema.parse(input);

    const document = await prisma.document.update({
      where: { id },
      data: validatedInput,
    });

    console.log("Document updated successfully:", document.id);
    return { success: true, data: document };
  } catch (error: any) {
    console.error("Error updating document:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Get a document by ID with optional relations
 */
export const getDocumentById = async (
  id: number,
  includeRelations = false
): Promise<ApiResponse<Document | DocumentWithRelations>> => {
  try {
    console.log("Fetching document by ID:", id);

    const document = await prisma.document.findUnique({
      where: { id },
      include: includeRelations
        ? {
            uploader: {
              select: {
                userId: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
            assignee: {
              select: {
                userId: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
            chunks: true,
            analysisResults: true,
            workflowTransitions: {
              orderBy: { createdTime: "desc" },
              take: 10,
            },
            comments: {
              orderBy: { createdTime: "desc" },
              take: 20,
            },
          }
        : undefined,
    });

    if (!document) {
      return {
        success: false,
        error: "Document not found",
        code: "DOCUMENT_NOT_FOUND",
      };
    }

    return { success: true, data: document };
  } catch (error: any) {
    console.error("Error fetching document:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Get a document by file hash to prevent duplicates
 */
export const getDocumentByHash = async (
  fileHash: string
): Promise<ApiResponse<Document>> => {
  try {
    console.log("Fetching document by hash:", fileHash);

    const document = await prisma.document.findUnique({
      where: { fileHash },
    });

    if (!document) {
      return {
        success: false,
        error: "Document not found",
        code: "DOCUMENT_NOT_FOUND",
      };
    }

    return { success: true, data: document };
  } catch (error: any) {
    console.error("Error fetching document by hash:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Query documents with filtering, pagination, and sorting
 */
export const queryDocuments = async (
  query: DocumentQueryInput
): Promise<ApiResponse<PaginatedResponse<DocumentWithRelations>>> => {
  try {
    console.log("Querying documents with parameters:", query);

    // Validate query parameters
    const validatedQuery = documentQuerySchema.parse(query);

    // Build where clause
    const whereClause: any = {};

    if (validatedQuery.userId) {
      whereClause.uploadedBy = validatedQuery.userId;
    }

    if (validatedQuery.status) {
      whereClause.status = validatedQuery.status;
    }

    if (validatedQuery.workflowStatus) {
      whereClause.workflowStatus = validatedQuery.workflowStatus;
    }

    if (validatedQuery.assignee) {
      whereClause.currentAssignee = validatedQuery.assignee;
    }

    if (validatedQuery.tags && validatedQuery.tags.length > 0) {
      whereClause.tags = {
        hasSome: validatedQuery.tags,
      };
    }

    // Get total count
    const total = await prisma.document.count({
      where: whereClause,
    });

    // Get documents with pagination
    const documents = await prisma.document.findMany({
      where: whereClause,
      include: {
        uploader: {
          select: {
            userId: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        assignee: {
          select: {
            userId: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        analysisResults: {
          where: { isFlagged: true },
          take: 5,
        },
      },
      orderBy: {
        [validatedQuery.sortBy]: validatedQuery.sortOrder,
      },
      take: validatedQuery.limit,
      skip: validatedQuery.offset,
    });

    const page = Math.floor(validatedQuery.offset / validatedQuery.limit) + 1;
    const hasNext = validatedQuery.offset + validatedQuery.limit < total;
    const hasPrevious = validatedQuery.offset > 0;

    const result: PaginatedResponse<DocumentWithRelations> = {
      items: documents as DocumentWithRelations[],
      total,
      page,
      limit: validatedQuery.limit,
      hasNext,
      hasPrevious,
    };

    console.log(
      `Documents query completed: ${documents.length} items, total: ${total}`
    );
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error querying documents:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Get documents assigned to a specific user
 */
export const getAssignedDocuments = async (
  userId: string,
  limit = 20,
  offset = 0
): Promise<ApiResponse<PaginatedResponse<DocumentWithRelations>>> => {
  try {
    console.log("Fetching assigned documents for user:", userId);

    return await queryDocuments({
      assignee: userId,
      limit,
      offset,
      sortBy: "updatedTime",
      sortOrder: "desc",
    });
  } catch (error: any) {
    console.error("Error fetching assigned documents:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Get documents by workflow status for dashboard views
 */
export const getDocumentsByWorkflowStatus = async (
  workflowStatus: WorkflowStatus,
  limit = 20,
  offset = 0
): Promise<ApiResponse<PaginatedResponse<DocumentWithRelations>>> => {
  try {
    console.log("Fetching documents by workflow status:", workflowStatus);

    return await queryDocuments({
      workflowStatus,
      limit,
      offset,
      sortBy: "updatedTime",
      sortOrder: "desc",
    });
  } catch (error: any) {
    console.error("Error fetching documents by workflow status:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Delete a document and all related data
 */
export const deleteDocument = async (
  id: number
): Promise<ApiResponse<void>> => {
  try {
    console.log("Deleting document ID:", id);

    await prisma.document.delete({
      where: { id },
    });

    console.log("Document deleted successfully:", id);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting document:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Update document processing status
 */
export const updateDocumentProcessingStatus = async (
  id: number,
  status: DocumentStatus,
  metadata?: {
    processingStartedAt?: Date;
    processingCompletedAt?: Date;
    extractedText?: string;
    chunkCount?: number;
  }
): Promise<ApiResponse<Document>> => {
  try {
    console.log("Updating document processing status:", id, status);

    const updateData: any = { status };

    if (metadata) {
      if (metadata.processingStartedAt)
        updateData.processingStartedAt = metadata.processingStartedAt;
      if (metadata.processingCompletedAt)
        updateData.processingCompletedAt = metadata.processingCompletedAt;
      if (metadata.extractedText)
        updateData.extractedText = metadata.extractedText;
      if (metadata.chunkCount !== undefined)
        updateData.chunkCount = metadata.chunkCount;
    }

    const document = await prisma.document.update({
      where: { id },
      data: updateData,
    });

    console.log("Document processing status updated successfully:", id);
    return { success: true, data: document };
  } catch (error: any) {
    console.error("Error updating document processing status:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Create document chunks
 */
export const createDocumentChunks = async (
  chunks: DocumentChunkCreateInput[]
): Promise<ApiResponse<DocumentChunk[]>> => {
  try {
    console.log("Creating document chunks:", chunks.length);

    // Validate all chunks
    const validatedChunks = chunks.map((chunk) =>
      documentChunkCreateSchema.parse(chunk)
    );

    const createdChunks = await prisma.documentChunk.createMany({
      data: validatedChunks,
    });

    // Fetch the created chunks to return them
    const documentIds = [
      ...new Set(validatedChunks.map((chunk) => chunk.documentId)),
    ];
    const fetchedChunks = await prisma.documentChunk.findMany({
      where: {
        documentId: { in: documentIds },
      },
      orderBy: [{ documentId: "asc" }, { chunkIndex: "asc" }],
    });

    console.log("Document chunks created successfully:", createdChunks.count);
    return { success: true, data: fetchedChunks };
  } catch (error: any) {
    console.error("Error creating document chunks:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Get document chunks by document ID
 */
export const getDocumentChunks = async (
  documentId: number
): Promise<ApiResponse<DocumentChunk[]>> => {
  try {
    console.log("Fetching chunks for document:", documentId);

    const chunks = await prisma.documentChunk.findMany({
      where: { documentId },
      orderBy: { chunkIndex: "asc" },
    });

    return { success: true, data: chunks };
  } catch (error: any) {
    console.error("Error fetching document chunks:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Get document statistics for dashboard
 */
export const getDocumentStatistics = async (
  userId?: string
): Promise<
  ApiResponse<{
    total: number;
    byStatus: Record<DocumentStatus, number>;
    byWorkflowStatus: Record<WorkflowStatus, number>;
    recent: number;
  }>
> => {
  try {
    console.log(
      "Fetching document statistics for user:",
      userId || "all users"
    );

    const whereClause = userId ? { uploadedBy: userId } : {};

    const [total, statusCounts, workflowStatusCounts, recentCount] =
      await Promise.all([
        prisma.document.count({ where: whereClause }),

        prisma.document.groupBy({
          by: ["status"],
          where: whereClause,
          _count: { status: true },
        }),

        prisma.document.groupBy({
          by: ["workflowStatus"],
          where: whereClause,
          _count: { workflowStatus: true },
        }),

        prisma.document.count({
          where: {
            ...whereClause,
            createdTime: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        }),
      ]);

    // Convert grouped results to record format
    const byStatus = Object.values(DocumentStatus).reduce((acc, status) => {
      const found = statusCounts.find((item) => item.status === status);
      acc[status] = found?._count.status || 0;
      return acc;
    }, {} as Record<DocumentStatus, number>);

    const byWorkflowStatus = Object.values(WorkflowStatus).reduce(
      (acc, status) => {
        const found = workflowStatusCounts.find(
          (item) => item.workflowStatus === status
        );
        acc[status] = found?._count.workflowStatus || 0;
        return acc;
      },
      {} as Record<WorkflowStatus, number>
    );

    const statistics = {
      total,
      byStatus,
      byWorkflowStatus,
      recent: recentCount,
    };

    console.log("Document statistics fetched successfully");
    return { success: true, data: statistics };
  } catch (error: any) {
    console.error("Error fetching document statistics:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};
