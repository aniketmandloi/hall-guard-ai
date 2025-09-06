export interface DocumentMetadata {
  filename: string;
  originalFilename: string;
  fileType: string;
  fileSize: number;
  fileHash: string;
  title?: string;
  author?: string;
  creationDate?: Date;
  pages?: number;
}

export interface DocumentChunk {
  index: number;
  content: string;
  tokenCount: number;
  startPosition: number;
  endPosition: number;
  semanticType: "paragraph" | "heading" | "list" | "table" | "other";
  metadata?: Record<string, unknown>;
}

export interface ProcessingProgress {
  stage:
    | "uploading"
    | "extracting"
    | "chunking"
    | "analyzing"
    | "completed"
    | "failed";
  progress: number; // 0-100
  message: string;
  estimatedTimeRemaining?: number; // seconds
  error?: ProcessingError;
}

export interface ProcessingResult {
  success: boolean;
  extractedText?: string;
  chunks?: DocumentChunk[];
  metadata?: DocumentMetadata;
  processingTimeMs?: number;
  error?: ProcessingError;
}

export interface ProcessingError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
}

export class ProcessingErrorImpl extends Error implements ProcessingError {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;
  public readonly retryable: boolean;

  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>,
    retryable: boolean = false
  ) {
    super(message);
    this.name = "ProcessingError";
    this.code = code;
    this.details = details;
    this.retryable = retryable;
  }
}

export function isProcessingError(error: unknown): error is ProcessingError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    "retryable" in error
  );
}

export function createProcessingError(
  code: string,
  message: string,
  details?: Record<string, unknown>,
  retryable: boolean = false
): ProcessingError {
  return new ProcessingErrorImpl(code, message, details, retryable);
}

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: Partial<DocumentMetadata>;
}

export interface ChunkingOptions {
  maxTokens: number;
  overlapTokens: number;
  preserveSemanticBoundaries: boolean;
  minChunkSize: number;
}

export interface ExtractionOptions {
  extractMetadata: boolean;
  preserveFormatting: boolean;
  includeImages: boolean;
  ocrEnabled: boolean;
}

export type SupportedFileType = "pdf" | "docx" | "doc" | "txt" | "rtf";

export const SUPPORTED_FILE_TYPES: SupportedFileType[] = [
  "pdf",
  "docx",
  "doc",
  "txt",
  "rtf",
];

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const MIME_TYPE_MAP: Record<SupportedFileType, string[]> = {
  pdf: ["application/pdf"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  doc: ["application/msword"],
  txt: ["text/plain"],
  rtf: ["application/rtf", "text/rtf"],
};

export const DEFAULT_CHUNKING_OPTIONS: ChunkingOptions = {
  maxTokens: 1500,
  overlapTokens: 150,
  preserveSemanticBoundaries: true,
  minChunkSize: 100,
};

export const DEFAULT_EXTRACTION_OPTIONS: ExtractionOptions = {
  extractMetadata: true,
  preserveFormatting: false,
  includeImages: false,
  ocrEnabled: false,
};
