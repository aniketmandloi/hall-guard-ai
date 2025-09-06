import { z } from "zod";
import {
  UserRole,
  DocumentStatus,
  WorkflowStatus,
  AnalysisType,
  RiskLevel,
  SourceType,
  VerificationResult,
  Document,
  DocumentChunk,
  AnalysisResult,
  FactCheckSource,
  WorkflowTransition,
  DocumentComment,
} from "@prisma/client";

// Document Management Types
export const documentCreateSchema = z.object({
  filename: z.string().min(1, "Filename is required").max(255),
  originalFilename: z.string().min(1, "Original filename is required").max(255),
  fileType: z.string().min(1, "File type is required").max(50),
  fileSize: z.bigint().positive("File size must be positive"),
  fileHash: z.string().min(1, "File hash is required").max(64),
  uploadedBy: z.string().min(1, "Uploader ID is required"),
  title: z.string().max(500).optional(),
  author: z.string().max(255).optional(),
  documentDate: z.date().optional(),
  tags: z.array(z.string()).default([]),
  storagePath: z.string().max(500).optional(),
  retentionExpiresAt: z.date().optional(),
});

export const documentUpdateSchema = z.object({
  filename: z.string().max(255).optional(),
  status: z.nativeEnum(DocumentStatus).optional(),
  processingStartedAt: z.date().optional(),
  processingCompletedAt: z.date().optional(),
  extractedText: z.string().optional(),
  chunkCount: z.number().int().min(0).optional(),
  currentAssignee: z.string().max(255).optional(),
  workflowStatus: z.nativeEnum(WorkflowStatus).optional(),
  title: z.string().max(500).optional(),
  author: z.string().max(255).optional(),
  documentDate: z.date().optional(),
  tags: z.array(z.string()).optional(),
  storagePath: z.string().max(500).optional(),
  retentionExpiresAt: z.date().optional(),
});

export const documentQuerySchema = z.object({
  userId: z.string().optional(),
  status: z.nativeEnum(DocumentStatus).optional(),
  workflowStatus: z.nativeEnum(WorkflowStatus).optional(),
  assignee: z.string().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sortBy: z
    .enum(["createdTime", "updatedTime", "filename"])
    .default("createdTime"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Document Chunk Types
export const documentChunkCreateSchema = z.object({
  documentId: z.number().int().positive(),
  chunkIndex: z.number().int().min(0),
  content: z.string().min(1, "Chunk content is required"),
  tokenCount: z.number().int().positive().optional(),
  startPosition: z.number().int().min(0).optional(),
  endPosition: z.number().int().min(0).optional(),
  semanticType: z.string().max(50).optional(),
});

// Analysis Result Types
export const analysisResultCreateSchema = z.object({
  documentId: z.number().int().positive(),
  chunkId: z.number().int().positive().optional(),
  analysisType: z.nativeEnum(AnalysisType),
  analyzerModel: z.string().min(1, "Analyzer model is required").max(100),
  analysisVersion: z.string().max(50).optional(),
  isFlagged: z.boolean().default(false),
  confidenceScore: z.number().min(0).max(1).optional(),
  riskLevel: z.nativeEnum(RiskLevel).optional(),
  issueDescription: z.string().optional(),
  explanation: z.string().optional(),
  suggestedCorrection: z.string().optional(),
  sourceCitations: z.record(z.any()).optional(),
  processingTimeMs: z.number().int().positive().optional(),
  externalSourcesChecked: z.array(z.string()).default([]),
});

export const analysisResultUpdateSchema = z.object({
  isFlagged: z.boolean().optional(),
  confidenceScore: z.number().min(0).max(1).optional(),
  riskLevel: z.nativeEnum(RiskLevel).optional(),
  issueDescription: z.string().optional(),
  explanation: z.string().optional(),
  suggestedCorrection: z.string().optional(),
  sourceCitations: z.record(z.any()).optional(),
});

export const analysisResultQuerySchema = z.object({
  documentId: z.number().int().positive().optional(),
  chunkId: z.number().int().positive().optional(),
  analysisType: z.nativeEnum(AnalysisType).optional(),
  isFlagged: z.boolean().optional(),
  riskLevel: z.nativeEnum(RiskLevel).optional(),
  minConfidence: z.number().min(0).max(1).optional(),
  maxConfidence: z.number().min(0).max(1).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// Fact Check Source Types
export const factCheckSourceCreateSchema = z.object({
  analysisResultId: z.number().int().positive(),
  sourceType: z.nativeEnum(SourceType),
  sourceUrl: z.string().url().max(500).optional(),
  sourceTitle: z.string().max(255).optional(),
  verificationResult: z.nativeEnum(VerificationResult).optional(),
  confidenceScore: z.number().min(0).max(1).optional(),
  sourceData: z.record(z.any()).optional(),
});

// Workflow Transition Types
export const workflowTransitionCreateSchema = z.object({
  documentId: z.number().int().positive(),
  fromStatus: z.nativeEnum(WorkflowStatus).optional(),
  toStatus: z.nativeEnum(WorkflowStatus),
  userId: z.string().min(1, "User ID is required"),
  userRole: z.nativeEnum(UserRole),
  comment: z.string().optional(),
  transitionData: z.record(z.any()).optional(),
  ipAddress: z.string().max(45).optional(),
  userAgent: z.string().optional(),
});

export const workflowTransitionQuerySchema = z.object({
  documentId: z.number().int().positive().optional(),
  userId: z.string().optional(),
  fromStatus: z.nativeEnum(WorkflowStatus).optional(),
  toStatus: z.nativeEnum(WorkflowStatus).optional(),
  userRole: z.nativeEnum(UserRole).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// Document Comment Types
export const documentCommentCreateSchema = z.object({
  documentId: z.number().int().positive(),
  analysisResultId: z.number().int().positive().optional(),
  parentCommentId: z.number().int().positive().optional(),
  userId: z.string().min(1, "User ID is required"),
  content: z.string().min(1, "Comment content is required"),
  isInternal: z.boolean().default(true),
  startPosition: z.number().int().min(0).optional(),
  endPosition: z.number().int().min(0).optional(),
});

export const documentCommentUpdateSchema = z.object({
  content: z.string().min(1, "Comment content is required"),
  isInternal: z.boolean().optional(),
});

export const documentCommentQuerySchema = z.object({
  documentId: z.number().int().positive().optional(),
  analysisResultId: z.number().int().positive().optional(),
  userId: z.string().optional(),
  isInternal: z.boolean().optional(),
  parentCommentId: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// Audit Query Types
export const auditLogQuerySchema = z.object({
  userId: z.string().optional(),
  documentId: z.number().int().positive().optional(),
  action: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  ipAddress: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(["createdTime", "userId", "action"]).default("createdTime"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Inferred Types
export type DocumentCreateInput = z.infer<typeof documentCreateSchema>;
export type DocumentUpdateInput = z.infer<typeof documentUpdateSchema>;
export type DocumentQueryInput = z.infer<typeof documentQuerySchema>;

export type DocumentChunkCreateInput = z.infer<
  typeof documentChunkCreateSchema
>;

export type AnalysisResultCreateInput = z.infer<
  typeof analysisResultCreateSchema
>;
export type AnalysisResultUpdateInput = z.infer<
  typeof analysisResultUpdateSchema
>;
export type AnalysisResultQueryInput = z.infer<
  typeof analysisResultQuerySchema
>;

export type FactCheckSourceCreateInput = z.infer<
  typeof factCheckSourceCreateSchema
>;

export type WorkflowTransitionCreateInput = z.infer<
  typeof workflowTransitionCreateSchema
>;
export type WorkflowTransitionQueryInput = z.infer<
  typeof workflowTransitionQuerySchema
>;

export type DocumentCommentCreateInput = z.infer<
  typeof documentCommentCreateSchema
>;
export type DocumentCommentUpdateInput = z.infer<
  typeof documentCommentUpdateSchema
>;
export type DocumentCommentQueryInput = z.infer<
  typeof documentCommentQuerySchema
>;

export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;

// Extended types with relations
export type DocumentWithRelations = Document & {
  uploader: {
    userId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: UserRole;
  };
  assignee?: {
    userId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: UserRole;
  } | null;
  chunks?: DocumentChunk[];
  analysisResults?: AnalysisResult[];
  workflowTransitions?: WorkflowTransition[];
  comments?: DocumentComment[];
};

export type AnalysisResultWithRelations = AnalysisResult & {
  document: Document;
  chunk?: DocumentChunk | null;
  factCheckSources?: FactCheckSource[];
  comments?: DocumentComment[];
};

export type WorkflowTransitionWithRelations = WorkflowTransition & {
  document: Document;
  user: {
    userId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: UserRole;
  };
};

export type DocumentCommentWithRelations = DocumentComment & {
  user: {
    userId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: UserRole;
  };
  document: Document;
  analysisResult?: AnalysisResult | null;
  parentComment?: DocumentComment | null;
  childComments?: DocumentComment[];
};

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Processing Status Types
export interface ProcessingProgress {
  documentId: number;
  stage: string;
  progress: number;
  estimatedTimeRemaining?: number;
  message?: string;
}

// Analysis Consensus Types
export interface ConsensusResult {
  finalConfidence: number;
  consensusReached: boolean;
  agreement: number;
  conflictingResults: AnalysisResult[];
  recommendedAction: "approve" | "review" | "reject";
}

// Workflow Validation Types
export interface WorkflowValidationResult {
  canTransition: boolean;
  requiredRole: UserRole;
  missingPermissions?: string[];
  blockers?: string[];
}
