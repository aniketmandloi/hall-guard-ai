import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/prisma/db";
import { DocumentProcessor } from "@/lib/services/document-processing";
import { FileStorageService } from "@/lib/services/file-storage";
import { FileValidationUtil } from "@/lib/utils/file-validation";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const customFilename = formData.get("filename") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = customFilename || file.name;

    // Validate file
    const validation = await FileValidationUtil.validateFile(file, filename);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "File validation failed",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Check file size limit (additional server-side check)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (buffer.length > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 100MB limit" },
        { status: 400 }
      );
    }

    // Generate file hash for deduplication check
    const crypto = await import("crypto");
    const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");

    // Check if file already exists for this user
    const existingDocument = await prisma.document.findFirst({
      where: {
        fileHash,
        uploadedBy: userId,
      },
    });

    if (existingDocument) {
      return NextResponse.json(
        {
          error: "File already exists",
          documentId: existingDocument.id,
          message: "This file has already been uploaded",
        },
        { status: 409 }
      );
    }

    // Initialize services
    const storageService = FileStorageService.create();

    // Upload to storage
    const uploadResult = await storageService.uploadFile(
      buffer,
      filename,
      userId,
      {
        folder: "documents",
        generateUniqueFilename: true,
      }
    );

    if (!uploadResult.success) {
      return NextResponse.json(
        {
          error: "Storage upload failed",
          details: uploadResult.error?.message,
        },
        { status: 500 }
      );
    }

    // Create database record
    const document = await prisma.document.create({
      data: {
        filename: uploadResult.filePath!.split("/").pop()!,
        originalFilename: filename,
        fileType: filename.split(".").pop()?.toLowerCase() || "unknown",
        fileSize: BigInt(buffer.length),
        fileHash,
        uploadedBy: userId,
        status: "UPLOADED",
        workflowStatus: "DRAFT",
        storagePath: uploadResult.filePath,
        title: filename.replace(/\.[^/.]+$/, ""), // Remove extension for title
      },
    });

    // Start background processing
    processDocumentInBackground(document.id, buffer, filename);

    return NextResponse.json({
      success: true,
      documentId: document.id,
      filename: document.originalFilename,
      fileSize: Number(document.fileSize),
      status: document.status,
      message: "File uploaded successfully. Processing started.",
    });
  } catch (error) {
    console.error("Upload API error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Background processing function
async function processDocumentInBackground(
  documentId: number,
  buffer: Buffer,
  filename: string
): Promise<void> {
  try {
    // Update status to processing
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "PROCESSING",
        processingStartedAt: new Date(),
      },
    });

    // Initialize document processor
    const processor = new DocumentProcessor();

    // Process document with progress tracking
    const result = await processor.processDocument(
      buffer,
      filename,
      async (progress) => {
        // Store progress in cache/database if needed
        // For now, we'll rely on the status endpoint to track progress
        console.log(`Document ${documentId} progress:`, progress);
      }
    );

    if (result.success && result.chunks && result.metadata) {
      // Save extracted text and metadata
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: "COMPLETED",
          processingCompletedAt: new Date(),
          extractedText: result.extractedText,
          chunkCount: result.chunks.length,
          title: result.metadata.title || filename.replace(/\.[^/.]+$/, ""),
          author: result.metadata.author,
          documentDate: result.metadata.creationDate,
        },
      });

      // Save document chunks
      const chunkData = result.chunks.map((chunk) => ({
        documentId,
        chunkIndex: chunk.index,
        content: chunk.content,
        tokenCount: chunk.tokenCount,
        startPosition: chunk.startPosition,
        endPosition: chunk.endPosition,
        semanticType: chunk.semanticType,
      }));

      await prisma.documentChunk.createMany({
        data: chunkData,
      });

      console.log(
        `Document ${documentId} processed successfully. Created ${result.chunks.length} chunks.`
      );
    } else {
      // Processing failed
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: "FAILED",
          processingCompletedAt: new Date(),
        },
      });

      console.error(`Document ${documentId} processing failed:`, result.error);
    }
  } catch (error) {
    console.error(
      `Background processing failed for document ${documentId}:`,
      error
    );

    // Mark as failed
    try {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: "FAILED",
          processingCompletedAt: new Date(),
        },
      });
    } catch (updateError) {
      console.error(`Failed to update document status:`, updateError);
    }
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
