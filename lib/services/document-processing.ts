import crypto from "crypto";
import {
  DocumentMetadata,
  DocumentChunk,
  ProcessingResult,
  ProcessingProgress,
  ProcessingError,
  ChunkingOptions,
  ExtractionOptions,
  DEFAULT_CHUNKING_OPTIONS,
  DEFAULT_EXTRACTION_OPTIONS,
  isProcessingError,
  createProcessingError,
} from "@/lib/types/document-processing";
import { TextExtractionService } from "./text-extraction";
import { DocumentChunkingService } from "./document-chunking";

export class DocumentProcessor {
  private extractionService: TextExtractionService;
  private chunkingService: DocumentChunkingService;

  constructor(
    extractionOptions?: ExtractionOptions,
    chunkingOptions?: ChunkingOptions
  ) {
    this.extractionService = new TextExtractionService(extractionOptions);
    this.chunkingService = new DocumentChunkingService(chunkingOptions);
  }

  async processDocument(
    buffer: Buffer,
    filename: string,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      // Initial validation
      this.updateProgress(onProgress, {
        stage: "extracting",
        progress: 0,
        message: "Validating file...",
      });

      const validation = await this.extractionService.validateFile(
        buffer,
        filename
      );
      if (!validation.valid) {
        throw this.createError(
          "VALIDATION_FAILED",
          `File validation failed: ${validation.errors.join(", ")}`,
          {
            errors: validation.errors,
          }
        );
      }

      // Generate file hash for deduplication
      const fileHash = this.generateFileHash(buffer);

      // Extract text
      this.updateProgress(onProgress, {
        stage: "extracting",
        progress: 20,
        message: "Extracting text from document...",
        estimatedTimeRemaining: this.estimateExtractionTime(buffer.length),
      });

      const { text, metadata: extractedMetadata } =
        await this.extractionService.extractText(buffer, filename);

      if (!text || text.trim().length === 0) {
        throw this.createError(
          "EMPTY_DOCUMENT",
          "No text content found in document"
        );
      }

      // Build complete metadata
      const metadata: DocumentMetadata = {
        filename,
        originalFilename: filename,
        fileType:
          extractedMetadata.fileType || this.getFileTypeFromName(filename),
        fileSize: buffer.length,
        fileHash,
        title: extractedMetadata.title,
        author: extractedMetadata.author,
        creationDate: extractedMetadata.creationDate,
        pages: extractedMetadata.pages,
      };

      // Chunk document
      this.updateProgress(onProgress, {
        stage: "chunking",
        progress: 60,
        message: "Creating document chunks...",
        estimatedTimeRemaining: this.estimateChunkingTime(text.length),
      });

      const chunks = await this.chunkingService.chunkDocument(text);

      if (chunks.length === 0) {
        throw this.createError(
          "CHUNKING_FAILED",
          "Failed to create document chunks"
        );
      }

      // Complete
      this.updateProgress(onProgress, {
        stage: "completed",
        progress: 100,
        message: `Successfully processed document into ${chunks.length} chunks`,
      });

      const processingTimeMs = Date.now() - startTime;

      return {
        success: true,
        extractedText: text,
        chunks,
        metadata,
        processingTimeMs,
      };
    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      const processedError = isProcessingError(error)
        ? error
        : this.createError(
            "PROCESSING_FAILED",
            `Document processing failed: ${
              error instanceof Error ? error.message : String(error)
            }`,
            {
              originalError:
                error instanceof Error ? error.message : String(error),
            }
          );

      this.updateProgress(onProgress, {
        stage: "failed",
        progress: 0,
        message: processedError.message,
        error: processedError,
      });

      return {
        success: false,
        processingTimeMs,
        error: processedError,
      };
    }
  }

  async estimateProcessingTime(
    fileSize: number,
    fileType: string
  ): Promise<number> {
    // Estimation based on file size and type (in seconds)
    const baseTimePerMB = 2; // 2 seconds per MB base
    const typeMultipliers = {
      pdf: 1.5, // PDFs take longer due to parsing complexity
      docx: 1.2,
      doc: 1.3,
      txt: 0.8,
      rtf: 1.0,
    };

    const sizeInMB = fileSize / (1024 * 1024);
    const multiplier =
      typeMultipliers[fileType as keyof typeof typeMultipliers] || 1.0;

    return Math.ceil(sizeInMB * baseTimePerMB * multiplier);
  }

  private generateFileHash(buffer: Buffer): string {
    return crypto.createHash("sha256").update(buffer).digest("hex");
  }

  private getFileTypeFromName(filename: string): string {
    const extension = filename.toLowerCase().split(".").pop();
    return extension || "unknown";
  }

  private estimateExtractionTime(fileSize: number): number {
    // Rough estimation in seconds
    return Math.ceil(fileSize / (1024 * 1024)) * 1.5; // 1.5 seconds per MB
  }

  private estimateChunkingTime(textLength: number): number {
    // Rough estimation in seconds
    return Math.ceil(textLength / 10000) * 0.5; // 0.5 seconds per 10k characters
  }

  private updateProgress(
    callback: ((progress: ProcessingProgress) => void) | undefined,
    progress: ProcessingProgress
  ): void {
    if (callback) {
      callback(progress);
    }
  }

  private createError(
    code: string,
    message: string,
    details?: Record<string, unknown>
  ): ProcessingError {
    return createProcessingError(
      code,
      message,
      details,
      this.isRetryableError(code)
    );
  }

  private isRetryableError(code: string): boolean {
    const retryableCodes = ["NETWORK_ERROR", "TIMEOUT", "TEMPORARY_FAILURE"];
    return retryableCodes.includes(code);
  }

  // Utility methods for external use
  async validateFile(buffer: Buffer, filename: string) {
    return this.extractionService.validateFile(buffer, filename);
  }

  async extractTextOnly(buffer: Buffer, filename: string) {
    return this.extractionService.extractText(buffer, filename);
  }

  async chunkTextOnly(
    text: string,
    options?: Partial<ChunkingOptions>
  ): Promise<DocumentChunk[]> {
    return this.chunkingService.chunkDocument(text, options);
  }

  // Static factory methods for different configurations
  static createForPDF(options?: {
    extractionOptions?: ExtractionOptions;
    chunkingOptions?: ChunkingOptions;
  }): DocumentProcessor {
    const extractionOptions = {
      ...DEFAULT_EXTRACTION_OPTIONS,
      extractMetadata: true,
      ...options?.extractionOptions,
    };

    return new DocumentProcessor(extractionOptions, options?.chunkingOptions);
  }

  static createForWord(options?: {
    extractionOptions?: ExtractionOptions;
    chunkingOptions?: ChunkingOptions;
  }): DocumentProcessor {
    const extractionOptions = {
      ...DEFAULT_EXTRACTION_OPTIONS,
      preserveFormatting: false,
      ...options?.extractionOptions,
    };

    return new DocumentProcessor(extractionOptions, options?.chunkingOptions);
  }

  static createForText(options?: {
    chunkingOptions?: ChunkingOptions;
  }): DocumentProcessor {
    const extractionOptions = {
      ...DEFAULT_EXTRACTION_OPTIONS,
      extractMetadata: false,
    };

    return new DocumentProcessor(extractionOptions, options?.chunkingOptions);
  }

  // Batch processing support
  async processMultipleDocuments(
    files: Array<{ buffer: Buffer; filename: string }>,
    onProgress?: (fileIndex: number, progress: ProcessingProgress) => void
  ): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const { buffer, filename } = files[i];

      const result = await this.processDocument(
        buffer,
        filename,
        onProgress ? (progress) => onProgress(i, progress) : undefined
      );

      results.push(result);
    }

    return results;
  }
}
