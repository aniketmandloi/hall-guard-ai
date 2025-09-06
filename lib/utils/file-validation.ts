import { fileTypeFromBuffer } from "file-type";
import {
  SUPPORTED_FILE_TYPES,
  MIME_TYPE_MAP,
  MAX_FILE_SIZE,
  FileValidationResult,
  SupportedFileType,
} from "@/lib/types/document-processing";

export interface ValidationOptions {
  maxFileSize?: number;
  allowedTypes?: SupportedFileType[];
  allowExecutables?: boolean;
  strictMimeTypeCheck?: boolean;
}

export class FileValidationUtil {
  static async validateFile(
    file: File | Buffer,
    filename?: string,
    options?: ValidationOptions
  ): Promise<FileValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const maxSize = options?.maxFileSize || MAX_FILE_SIZE;
    const allowedTypes = options?.allowedTypes || SUPPORTED_FILE_TYPES;
    const strictMime = options?.strictMimeTypeCheck ?? true;

    try {
      // Get file data
      let buffer: Buffer;
      let name: string;
      let size: number;

      if (file instanceof Buffer) {
        buffer = file;
        name = filename || "unknown";
        size = buffer.length;
      } else {
        // It's a File object
        const fileObj = file as File;
        const fileBuffer = await fileObj.arrayBuffer();
        buffer = Buffer.from(fileBuffer);
        name = fileObj.name;
        size = fileObj.size;
      }

      // Basic validations
      if (size === 0) {
        errors.push("File is empty");
      }

      if (size > maxSize) {
        errors.push(
          `File size (${this.formatFileSize(
            size
          )}) exceeds maximum allowed size (${this.formatFileSize(maxSize)})`
        );
      }

      // File extension validation
      const extension = this.getFileExtension(name);
      if (!extension) {
        errors.push("File must have an extension");
      } else if (!allowedTypes.includes(extension as SupportedFileType)) {
        errors.push(
          `File type '${extension}' is not supported. Supported types: ${allowedTypes.join(
            ", "
          )}`
        );
      }

      // MIME type validation
      if (buffer.length > 0) {
        const detectedType = await fileTypeFromBuffer(buffer);

        if (extension && strictMime) {
          const expectedMimeTypes =
            MIME_TYPE_MAP[extension as keyof typeof MIME_TYPE_MAP];

          if (detectedType) {
            if (
              expectedMimeTypes &&
              !expectedMimeTypes.includes(detectedType.mime)
            ) {
              if (this.isLikelyMislabeled(detectedType.mime, extension)) {
                errors.push(
                  `File content (${detectedType.mime}) doesn't match extension (.${extension})`
                );
              } else {
                warnings.push(
                  `File content type (${detectedType.mime}) differs from expected type for .${extension} files`
                );
              }
            }
          } else if (expectedMimeTypes) {
            // If we can't detect the type but expect a specific one
            warnings.push(`Could not verify file type for .${extension} file`);
          }
        }
      }

      // Security checks
      if (!options?.allowExecutables) {
        const securityCheck = await this.checkFileSecurity(buffer, name);
        errors.push(...securityCheck.errors);
        warnings.push(...securityCheck.warnings);
      }

      // Content-specific validation
      if (extension && errors.length === 0) {
        const contentCheck = await this.validateFileContent(
          buffer,
          extension as SupportedFileType
        );
        errors.push(...contentCheck.errors);
        warnings.push(...contentCheck.warnings);
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        metadata: {
          filename: name,
          fileSize: size,
          fileType: extension || "unknown",
        },
      };
    } catch (error) {
      return {
        valid: false,
        errors: [
          `Validation failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ],
        warnings,
      };
    }
  }

  static async validateMultipleFiles(
    files: File[],
    options?: ValidationOptions
  ): Promise<{ results: FileValidationResult[]; hasErrors: boolean }> {
    const results: FileValidationResult[] = [];

    for (const file of files) {
      const result = await this.validateFile(file, undefined, options);
      results.push(result);
    }

    const hasErrors = results.some((result) => !result.valid);

    return { results, hasErrors };
  }

  private static getFileExtension(filename: string): string | null {
    const parts = filename.toLowerCase().split(".");
    return parts.length > 1 ? parts.pop() || null : null;
  }

  private static async checkFileSecurity(
    buffer: Buffer,
    filename: string
  ): Promise<{
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for dangerous file extensions
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
      "msi",
      "bin",
      "run",
      "action",
      "workflow",
    ];

    const extension = this.getFileExtension(filename);
    if (extension && dangerousExtensions.includes(extension)) {
      errors.push(
        `File type '${extension}' is not allowed for security reasons`
      );
    }

    // Check magic bytes for executables
    if (buffer.length >= 4) {
      const magicBytes = buffer.subarray(0, 4);

      // Common executable signatures
      const executableSignatures = [
        { signature: [0x4d, 0x5a], name: "PE (Windows executable)" },
        { signature: [0x7f, 0x45, 0x4c, 0x46], name: "ELF (Linux executable)" },
        {
          signature: [0xfe, 0xed, 0xfa, 0xce],
          name: "Mach-O (macOS executable)",
        },
        {
          signature: [0xce, 0xfa, 0xed, 0xfe],
          name: "Mach-O (macOS executable)",
        },
        {
          signature: [0xcf, 0xfa, 0xed, 0xfe],
          name: "Mach-O (macOS executable)",
        },
      ];

      for (const { signature, name } of executableSignatures) {
        if (this.matchesSignature(magicBytes, signature)) {
          errors.push(`File contains executable code (${name})`);
          break;
        }
      }
    }

    // Check for script content in text files
    if (extension === "txt" && buffer.length > 0) {
      const content = buffer.toString("utf8", 0, Math.min(1000, buffer.length));
      const scriptPatterns = [
        /^\s*<script/i,
        /^\s*#!\s*\/bin/,
        /^\s*@echo\s+off/i,
        /^\s*powershell/i,
      ];

      if (scriptPatterns.some((pattern) => pattern.test(content))) {
        warnings.push("Text file appears to contain script content");
      }
    }

    return { errors, warnings };
  }

  private static async validateFileContent(
    buffer: Buffer,
    fileType: SupportedFileType
  ): Promise<{ errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      switch (fileType) {
        case "pdf":
          await this.validatePDFContent(buffer, errors, warnings);
          break;
        case "docx":
        case "doc":
          await this.validateWordContent(buffer, errors, warnings);
          break;
        case "txt":
          await this.validateTextContent(buffer, errors, warnings);
          break;
        case "rtf":
          await this.validateRTFContent(buffer, errors, warnings);
          break;
      }
    } catch (error) {
      warnings.push(
        `Content validation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    return { errors, warnings };
  }

  private static async validatePDFContent(
    buffer: Buffer,
    errors: string[],
    warnings: string[]
  ): Promise<void> {
    // Basic PDF structure validation
    const pdfHeader = buffer.subarray(0, 4);
    if (!pdfHeader.equals(Buffer.from("%PDF"))) {
      errors.push("Invalid PDF file structure");
      return;
    }

    // Check for PDF version
    const headerLine = buffer.toString("ascii", 0, Math.min(20, buffer.length));
    const versionMatch = headerLine.match(/%PDF-(\d+\.\d+)/);
    if (versionMatch) {
      const version = parseFloat(versionMatch[1]);
      if (version > 2.0) {
        warnings.push(`PDF version ${version} may not be fully supported`);
      }
    }
  }

  private static async validateWordContent(
    buffer: Buffer,
    errors: string[],
    _warnings: string[]
  ): Promise<void> {
    // DOCX files are ZIP archives
    const zipSignature = buffer.subarray(0, 4);
    if (buffer.length >= 4) {
      // DOCX should start with ZIP signature
      if (
        !zipSignature.equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])) &&
        !zipSignature.equals(Buffer.from([0x50, 0x4b, 0x07, 0x08]))
      ) {
        // Check if it's an old DOC format
        const docSignature = buffer.subarray(0, 8);
        const validDocSignatures = [
          Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), // OLE format
        ];

        if (!validDocSignatures.some((sig) => docSignature.equals(sig))) {
          errors.push("Invalid Word document structure");
        }
      }
    }
  }

  private static async validateTextContent(
    buffer: Buffer,
    _errors: string[],
    warnings: string[]
  ): Promise<void> {
    // Check if file is actually text
    const sample = buffer.subarray(0, Math.min(1000, buffer.length));
    let nonTextBytes = 0;

    for (let i = 0; i < sample.length; i++) {
      const byte = sample[i];
      // Allow common control characters (tab, newline, carriage return)
      if (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13) {
        nonTextBytes++;
      }
    }

    const nonTextRatio = nonTextBytes / sample.length;
    if (nonTextRatio > 0.1) {
      // More than 10% non-text characters
      warnings.push("File may contain binary data despite .txt extension");
    }
  }

  private static async validateRTFContent(
    buffer: Buffer,
    errors: string[],
    _warnings: string[]
  ): Promise<void> {
    const rtfHeader = buffer.toString("ascii", 0, Math.min(10, buffer.length));
    if (!rtfHeader.startsWith("{\\rtf")) {
      errors.push("Invalid RTF file structure");
    }
  }

  private static matchesSignature(
    buffer: Buffer,
    signature: number[]
  ): boolean {
    if (buffer.length < signature.length) return false;

    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) return false;
    }

    return true;
  }

  private static isLikelyMislabeled(
    detectedMime: string,
    extension: string
  ): boolean {
    // Common cases where files are intentionally mislabeled
    const commonMislabeling = [
      { mime: "application/octet-stream", extensions: ["pdf", "docx"] },
      { mime: "text/plain", extensions: ["pdf", "docx"] }, // Sometimes happens with small files
    ];

    return commonMislabeling.some(
      (case_) =>
        case_.mime === detectedMime && case_.extensions.includes(extension)
    );
  }

  private static formatFileSize(bytes: number): string {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  }

  // Utility methods for common validation scenarios
  static isValidFileSize(
    size: number,
    maxSize: number = MAX_FILE_SIZE
  ): boolean {
    return size > 0 && size <= maxSize;
  }

  static isValidFileType(
    filename: string,
    allowedTypes: SupportedFileType[] = SUPPORTED_FILE_TYPES
  ): boolean {
    const extension = this.getFileExtension(filename);
    return extension
      ? allowedTypes.includes(extension as SupportedFileType)
      : false;
  }

  static getSupportedExtensions(): SupportedFileType[] {
    return [...SUPPORTED_FILE_TYPES];
  }

  static getMaxFileSize(): number {
    return MAX_FILE_SIZE;
  }
}
