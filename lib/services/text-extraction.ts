import * as mammoth from "mammoth";
import { fileTypeFromBuffer } from "file-type";
import {
  DocumentMetadata,
  ProcessingError,
  ExtractionOptions,
  DEFAULT_EXTRACTION_OPTIONS,
  SupportedFileType,
  isProcessingError,
  createProcessingError,
} from "@/lib/types/document-processing";

export class TextExtractionService {
  private options: ExtractionOptions;

  constructor(options: ExtractionOptions = DEFAULT_EXTRACTION_OPTIONS) {
    this.options = { ...DEFAULT_EXTRACTION_OPTIONS, ...options };
  }

  async extractText(
    buffer: Buffer,
    filename: string
  ): Promise<{
    text: string;
    metadata: Partial<DocumentMetadata>;
  }> {
    try {
      const fileType = await this.detectFileType(buffer, filename);

      switch (fileType) {
        case "pdf":
          return await this.extractFromPDF(buffer);
        case "docx":
        case "doc":
          return await this.extractFromWord(buffer);
        case "txt":
          return await this.extractFromText(buffer);
        case "rtf":
          return await this.extractFromRTF(buffer);
        default:
          throw this.createError(
            "UNSUPPORTED_FILE_TYPE",
            `File type ${fileType} is not supported`,
            { fileType }
          );
      }
    } catch (error) {
      if (isProcessingError(error)) {
        throw error;
      }

      throw this.createError(
        "EXTRACTION_FAILED",
        `Failed to extract text: ${
          error instanceof Error ? error.message : String(error)
        }`,
        {
          originalError: error instanceof Error ? error.message : String(error),
          filename,
        }
      );
    }
  }

  private async detectFileType(
    buffer: Buffer,
    filename: string
  ): Promise<SupportedFileType> {
    try {
      const detectedType = await fileTypeFromBuffer(buffer);

      if (detectedType) {
        switch (detectedType.mime) {
          case "application/pdf":
            return "pdf";
          case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            return "docx";
          case "application/msword":
            return "doc";
          case "text/plain":
            return "txt";
          case "application/rtf":
          case "text/rtf":
            return "rtf";
        }
      }

      // Fallback to file extension
      const extension = filename.toLowerCase().split(".").pop();
      switch (extension) {
        case "pdf":
          return "pdf";
        case "docx":
          return "docx";
        case "doc":
          return "doc";
        case "txt":
          return "txt";
        case "rtf":
          return "rtf";
        default:
          throw this.createError(
            "UNKNOWN_FILE_TYPE",
            `Cannot determine file type for ${filename}`,
            {
              filename,
              detectedMime: detectedType?.mime,
              extension,
            }
          );
      }
    } catch (error) {
      throw this.createError(
        "FILE_TYPE_DETECTION_FAILED",
        `Failed to detect file type: ${
          error instanceof Error ? error.message : String(error)
        }`,
        {
          filename,
        }
      );
    }
  }

  private async extractFromPDF(buffer: Buffer): Promise<{
    text: string;
    metadata: Partial<DocumentMetadata>;
  }> {
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);

      return {
        text: data.text,
        metadata: {
          title: data.info?.Title || undefined,
          author: data.info?.Author || undefined,
          creationDate: data.info?.CreationDate
            ? new Date(data.info.CreationDate)
            : undefined,
          pages: data.numpages,
        },
      };
    } catch (error) {
      throw this.createError(
        "PDF_EXTRACTION_FAILED",
        `Failed to extract PDF: ${
          error instanceof Error ? error.message : String(error)
        }`,
        {
          originalError: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  private async extractFromWord(buffer: Buffer): Promise<{
    text: string;
    metadata: Partial<DocumentMetadata>;
  }> {
    try {
      const result = await mammoth.extractRawText({ buffer });

      if (result.messages.length > 0) {
        console.warn("Word extraction warnings:", result.messages);
      }

      return {
        text: result.value,
        metadata: {
          // Word files don't easily provide metadata through mammoth
          // Could be enhanced with additional libraries if needed
        },
      };
    } catch (error) {
      throw this.createError(
        "WORD_EXTRACTION_FAILED",
        `Failed to extract Word document: ${
          error instanceof Error ? error.message : String(error)
        }`,
        {
          originalError: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  private async extractFromText(buffer: Buffer): Promise<{
    text: string;
    metadata: Partial<DocumentMetadata>;
  }> {
    try {
      // Try different encodings
      const encodings = ["utf8", "ascii", "latin1"];
      let text = "";
      let encoding = "utf8";

      for (const enc of encodings) {
        try {
          text = buffer.toString(enc as BufferEncoding);
          encoding = enc;
          break;
        } catch (error) {
          continue;
        }
      }

      if (!text) {
        throw new Error("Could not decode text with any supported encoding");
      }

      return {
        text,
        metadata: {
          // Basic text file metadata
        },
      };
    } catch (error) {
      throw this.createError(
        "TEXT_EXTRACTION_FAILED",
        `Failed to extract text file: ${
          error instanceof Error ? error.message : String(error)
        }`,
        {
          originalError: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  private async extractFromRTF(buffer: Buffer): Promise<{
    text: string;
    metadata: Partial<DocumentMetadata>;
  }> {
    try {
      // Basic RTF text extraction - strips RTF formatting
      const rtfText = buffer.toString("ascii");

      // Simple RTF parser to extract plain text
      let text = rtfText.replace(/\\[a-z]+\d*\s?/g, ""); // Remove RTF control words
      text = text.replace(/[{}]/g, ""); // Remove braces
      text = text.replace(/\\\\/g, "\\"); // Unescape backslashes
      text = text.replace(/\\'/g, "'"); // Unescape quotes
      text = text.replace(/\s+/g, " ").trim(); // Normalize whitespace

      return {
        text,
        metadata: {},
      };
    } catch (error) {
      throw this.createError(
        "RTF_EXTRACTION_FAILED",
        `Failed to extract RTF file: ${
          error instanceof Error ? error.message : String(error)
        }`,
        {
          originalError: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  private createError(
    code: string,
    message: string,
    details?: Record<string, unknown>
  ): ProcessingError {
    return createProcessingError(code, message, details, false);
  }

  async validateFile(
    buffer: Buffer,
    filename: string
  ): Promise<{
    valid: boolean;
    errors: string[];
    metadata?: Partial<DocumentMetadata>;
  }> {
    const errors: string[] = [];

    try {
      // Check file size
      if (buffer.length === 0) {
        errors.push("File is empty");
      }

      if (buffer.length > 100 * 1024 * 1024) {
        // 100MB
        errors.push("File size exceeds 100MB limit");
      }

      // Check file type
      const fileType = await this.detectFileType(buffer, filename);

      // Try to extract a small portion to verify the file is readable
      if (errors.length === 0) {
        try {
          await this.extractText(buffer, filename);
        } catch (error) {
          errors.push(
            `File appears to be corrupted or unreadable: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        metadata: {
          fileType,
          fileSize: buffer.length,
          filename: filename,
        },
      };
    } catch (error) {
      return {
        valid: false,
        errors: [
          `Validation failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ],
      };
    }
  }
}
