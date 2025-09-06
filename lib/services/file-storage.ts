import { createClient } from "@supabase/supabase-js";
import { fileTypeFromBuffer } from "file-type";
import crypto from "crypto";
import {
  ProcessingError,
  FileValidationResult,
  MAX_FILE_SIZE,
  SUPPORTED_FILE_TYPES,
  MIME_TYPE_MAP,
  createProcessingError,
  isProcessingError,
} from "@/lib/types/document-processing";

export interface UploadResult {
  success: boolean;
  filePath?: string;
  publicUrl?: string;
  fileHash?: string;
  error?: ProcessingError;
}

export interface StorageConfig {
  supabaseUrl: string;
  supabaseKey: string;
  bucketName: string;
  maxFileSize?: number;
  allowedFileTypes?: string[];
}

export class FileStorageService {
  private supabase;
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = {
      maxFileSize: MAX_FILE_SIZE,
      allowedFileTypes: SUPPORTED_FILE_TYPES,
      ...config,
    };

    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }

  async uploadFile(
    buffer: Buffer,
    filename: string,
    userId: string,
    options?: {
      folder?: string;
      replaceExisting?: boolean;
      generateUniqueFilename?: boolean;
    }
  ): Promise<UploadResult> {
    try {
      // Validate file before upload
      const validation = await this.validateFile(buffer, filename);
      if (!validation.valid) {
        return {
          success: false,
          error: this.createError(
            "VALIDATION_FAILED",
            `File validation failed: ${validation.errors.join(", ")}`,
            {
              errors: validation.errors,
            }
          ),
        };
      }

      // Generate file hash for deduplication
      const fileHash = this.generateFileHash(buffer);

      // Generate file path
      const filePath = this.generateFilePath(filename, userId, options);

      // Check if file already exists (if not replacing)
      if (!options?.replaceExisting) {
        const existing = await this.checkFileExists(filePath);
        if (existing) {
          return {
            success: false,
            error: this.createError(
              "FILE_EXISTS",
              `File already exists: ${filePath}`
            ),
          };
        }
      }

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.config.bucketName)
        .upload(filePath, buffer, {
          contentType: this.getMimeType(filename),
          upsert: options?.replaceExisting || false, // Supabase storage uploads require 'duplex: "half"' when uploading a Buffer in Node.js.
          // This is due to the way the fetch API handles streams and buffers; omitting this option can cause upload failures.
          duplex: "half",
        });

      if (error) {
        throw this.createError(
          "UPLOAD_FAILED",
          `Storage upload failed: ${error.message}`,
          {
            storageError: error,
          }
        );
      }

      // Generate public URL
      const { data: publicUrlData } = this.supabase.storage
        .from(this.config.bucketName)
        .getPublicUrl(filePath);

      return {
        success: true,
        filePath: data.path,
        publicUrl: publicUrlData.publicUrl,
        fileHash,
      };
    } catch (error) {
      return {
        success: false,
        error: isProcessingError(error)
          ? error
          : this.createError(
              "UPLOAD_FAILED",
              `Upload failed: ${
                error instanceof Error ? error.message : String(error)
              }`,
              {
                originalError:
                  error instanceof Error ? error.message : String(error),
              }
            ),
      };
    }
  }

  async downloadFile(filePath: string): Promise<{
    success: boolean;
    buffer?: Buffer;
    error?: ProcessingError;
  }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.config.bucketName)
        .download(filePath);

      if (error) {
        throw this.createError(
          "DOWNLOAD_FAILED",
          `Download failed: ${error.message}`,
          {
            storageError: error,
          }
        );
      }

      if (!data) {
        throw this.createError("FILE_NOT_FOUND", `File not found: ${filePath}`);
      }

      // Convert blob to buffer
      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return {
        success: true,
        buffer,
      };
    } catch (error) {
      return {
        success: false,
        error: isProcessingError(error)
          ? error
          : this.createError(
              "DOWNLOAD_FAILED",
              `Download failed: ${
                error instanceof Error ? error.message : String(error)
              }`,
              {
                originalError:
                  error instanceof Error ? error.message : String(error),
              }
            ),
      };
    }
  }

  async deleteFile(filePath: string): Promise<{
    success: boolean;
    error?: ProcessingError;
  }> {
    try {
      const { error } = await this.supabase.storage
        .from(this.config.bucketName)
        .remove([filePath]);

      if (error) {
        throw this.createError(
          "DELETE_FAILED",
          `Delete failed: ${error.message}`,
          {
            storageError: error,
          }
        );
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: isProcessingError(error)
          ? error
          : this.createError(
              "DELETE_FAILED",
              `Delete failed: ${
                error instanceof Error ? error.message : String(error)
              }`,
              {
                originalError:
                  error instanceof Error ? error.message : String(error),
              }
            ),
      };
    }
  }

  async listFiles(
    folder?: string,
    limit?: number,
    offset?: number
  ): Promise<{
    success: boolean;
    files?: Array<{
      name: string;
      id: string;
      updated_at: string;
      created_at: string;
      last_accessed_at: string;
      metadata: Record<string, unknown>;
    }>;
    error?: ProcessingError;
  }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.config.bucketName)
        .list(folder, {
          limit,
          offset,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) {
        throw this.createError("LIST_FAILED", `List failed: ${error.message}`, {
          storageError: error,
        });
      }

      return {
        success: true,
        files: data,
      };
    } catch (error) {
      return {
        success: false,
        error: isProcessingError(error)
          ? error
          : this.createError(
              "LIST_FAILED",
              `List failed: ${
                error instanceof Error ? error.message : String(error)
              }`,
              {
                originalError:
                  error instanceof Error ? error.message : String(error),
              }
            ),
      };
    }
  }

  async validateFile(
    buffer: Buffer,
    filename: string
  ): Promise<FileValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check file size
      if (buffer.length === 0) {
        errors.push("File is empty");
      }

      if (buffer.length > (this.config.maxFileSize || MAX_FILE_SIZE)) {
        errors.push(
          `File size (${this.formatFileSize(
            buffer.length
          )}) exceeds maximum allowed size (${this.formatFileSize(
            this.config.maxFileSize || MAX_FILE_SIZE
          )})`
        );
      }

      // Check file type by content
      const detectedType = await fileTypeFromBuffer(buffer);
      const fileExtension = filename.toLowerCase().split(".").pop();

      // Validate file extension
      if (
        !fileExtension ||
        !(this.config.allowedFileTypes || SUPPORTED_FILE_TYPES).includes(
          fileExtension
        )
      ) {
        errors.push(
          `File type '${fileExtension}' is not supported. Supported types: ${(
            this.config.allowedFileTypes || SUPPORTED_FILE_TYPES
          ).join(", ")}`
        );
      }

      // Check MIME type matches extension
      if (detectedType && fileExtension) {
        const expectedMimeTypes =
          MIME_TYPE_MAP[fileExtension as keyof typeof MIME_TYPE_MAP];
        if (
          expectedMimeTypes &&
          !expectedMimeTypes.includes(detectedType.mime)
        ) {
          warnings.push(
            `File content type (${detectedType.mime}) doesn't match extension (${fileExtension})`
          );
        }
      }

      // Check for potentially dangerous files
      if (this.isDangerousFile(filename, buffer)) {
        errors.push("File appears to contain potentially dangerous content");
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        metadata: {
          filename,
          fileSize: buffer.length,
          fileType: fileExtension,
        } as any,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [
          `Validation failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ],
        warnings,
      };
    }
  }

  private generateFilePath(
    filename: string,
    userId: string,
    options?: {
      folder?: string;
      generateUniqueFilename?: boolean;
    }
  ): string {
    const folder = options?.folder || "documents";
    const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    let finalFilename = filename;
    if (options?.generateUniqueFilename) {
      const extension = filename.split(".").pop();
      const nameWithoutExt = filename.replace(`.${extension}`, "");
      const uniqueId = crypto.randomBytes(8).toString("hex");
      finalFilename = `${nameWithoutExt}-${uniqueId}.${extension}`;
    }

    return `${folder}/${userId}/${timestamp}/${finalFilename}`;
  }

  private generateFileHash(buffer: Buffer): string {
    return crypto.createHash("sha256").update(buffer).digest("hex");
  }

  private getMimeType(filename: string): string {
    const extension = filename.toLowerCase().split(".").pop();
    const mimeTypes = MIME_TYPE_MAP[extension as keyof typeof MIME_TYPE_MAP];
    return mimeTypes ? mimeTypes[0] : "application/octet-stream";
  }

  private async checkFileExists(filePath: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.config.bucketName)
        .list(filePath.split("/").slice(0, -1).join("/"));

      if (error || !data) return false;

      const filename = filePath.split("/").pop();
      return data.some((file) => file.name === filename);
    } catch {
      return false;
    }
  }

  private isDangerousFile(filename: string, buffer: Buffer): boolean {
    // Check for executable extensions
    const dangerousExtensions = [
      "exe",
      "bat",
      "cmd",
      "com",
      "scr",
      "pif",
      "vbs",
      "js",
      "jar",
      "app",
      "dmg",
      "pkg",
      "deb",
      "rpm",
      "sh",
      "bash",
      "ps1",
    ];

    const extension = filename.toLowerCase().split(".").pop();
    if (extension && dangerousExtensions.includes(extension)) {
      return true;
    }

    // Check for executable magic bytes
    const magicBytes = buffer.slice(0, 4);
    const dangerousMagic = [
      Buffer.from([0x4d, 0x5a]), // PE (Windows executable)
      Buffer.from([0x7f, 0x45, 0x4c, 0x46]), // ELF (Linux executable)
      Buffer.from([0xfe, 0xed, 0xfa]), // Mach-O (macOS executable)
    ];

    return dangerousMagic.some(
      (magic) =>
        magicBytes.length >= magic.length &&
        magicBytes.subarray(0, magic.length).equals(magic)
    );
  }

  private formatFileSize(bytes: number): string {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
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
    const retryableCodes = [
      "NETWORK_ERROR",
      "TIMEOUT",
      "TEMPORARY_FAILURE",
      "RATE_LIMITED",
    ];
    return retryableCodes.includes(code);
  }

  // Static factory method
  static create(config?: Partial<StorageConfig>): FileStorageService {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
      );
    }

    return new FileStorageService({
      supabaseUrl,
      supabaseKey,
      bucketName: "documents",
      ...config,
    });
  }
}
