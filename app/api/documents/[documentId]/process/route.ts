import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/prisma/db";
import { DocumentProcessor } from "@/lib/services/document-processing";
import { FileStorageService } from "@/lib/services/file-storage";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const documentId = parseInt(resolvedParams.documentId);
    if (isNaN(documentId)) {
      return NextResponse.json(
        { error: "Invalid document ID" },
        { status: 400 }
      );
    }

    // Get document with ownership check
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        uploadedBy: userId,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check if document is in a processable state
    if (document.status === "PROCESSING") {
      return NextResponse.json(
        { error: "Document is already being processed" },
        { status: 409 }
      );
    }

    if (document.status === "COMPLETED") {
      return NextResponse.json({
        message: "Document has already been processed",
        documentId: document.id,
        chunkCount: document.chunkCount,
      });
    }

    // Validate that we have a storage path
    if (!document.storagePath) {
      return NextResponse.json(
        { error: "Document file not found in storage" },
        { status: 404 }
      );
    }

    // Start processing in background
    processDocumentAsync(document);

    return NextResponse.json({
      success: true,
      message: "Document processing started",
      documentId: document.id,
      status: "PROCESSING",
    });
  } catch (error) {
    console.error("Process API error:", error);

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
async function processDocumentAsync(document: any): Promise<void> {
  try {
    console.log(`Starting background processing for document ${document.id}`);

    // Update status to processing
    await prisma.document.update({
      where: { id: document.id },
      data: {
        status: "PROCESSING",
        processingStartedAt: new Date(),
      },
    });

    // Download file from storage
    const storageService = FileStorageService.create();
    const downloadResult = await storageService.downloadFile(
      document.storagePath
    );

    if (!downloadResult.success || !downloadResult.buffer) {
      throw new Error(
        `Failed to download file: ${downloadResult.error?.message}`
      );
    }

    // Initialize document processor
    const processor = new DocumentProcessor();

    // Process document with progress tracking
    const result = await processor.processDocument(
      downloadResult.buffer,
      document.originalFilename,
      async (progress) => {
        console.log(`Document ${document.id} progress:`, progress);

        // In a production system, you might store progress in Redis or similar
        // For now, we just log it
      }
    );

    if (result.success && result.chunks && result.metadata) {
      // Save extracted text and metadata
      await prisma.document.update({
        where: { id: document.id },
        data: {
          status: "COMPLETED",
          processingCompletedAt: new Date(),
          extractedText: result.extractedText,
          chunkCount: result.chunks.length,
          title:
            result.metadata.title ||
            document.originalFilename.replace(/\.[^/.]+$/, ""),
          author: result.metadata.author,
          documentDate: result.metadata.creationDate,
        },
      });

      // Save document chunks
      const chunkData = result.chunks.map((chunk) => ({
        documentId: document.id,
        chunkIndex: chunk.index,
        content: chunk.content,
        tokenCount: chunk.tokenCount,
        startPosition: chunk.startPosition,
        endPosition: chunk.endPosition,
        semanticType: chunk.semanticType,
      }));

      // Delete existing chunks first (in case of reprocessing)
      await prisma.documentChunk.deleteMany({
        where: { documentId: document.id },
      });

      // Create new chunks
      await prisma.documentChunk.createMany({
        data: chunkData,
      });

      console.log(
        `Document ${document.id} processed successfully. Created ${result.chunks.length} chunks.`
      );

      // Update workflow status to ready for review if it's still in draft
      if (document.workflowStatus === "DRAFT") {
        await prisma.document.update({
          where: { id: document.id },
          data: {
            workflowStatus: "IN_REVIEW",
            currentAssignee: document.uploadedBy, // Assign back to uploader for review
          },
        });
      }
    } else {
      // Processing failed
      const errorMessage = result.error?.message || "Unknown processing error";

      await prisma.document.update({
        where: { id: document.id },
        data: {
          status: "FAILED",
          processingCompletedAt: new Date(),
        },
      });

      console.error(`Document ${document.id} processing failed:`, errorMessage);
    }
  } catch (error) {
    console.error(
      `Background processing failed for document ${document.id}:`,
      error
    );

    // Mark as failed
    try {
      await prisma.document.update({
        where: { id: document.id },
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

// Endpoint to retry failed processing
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const documentId = parseInt(resolvedParams.documentId);
    if (isNaN(documentId)) {
      return NextResponse.json(
        { error: "Invalid document ID" },
        { status: 400 }
      );
    }

    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        uploadedBy: userId,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Only allow retry if document has failed
    if (document.status !== "FAILED") {
      return NextResponse.json(
        { error: "Document is not in a failed state" },
        { status: 400 }
      );
    }

    // Reset status and start processing
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "UPLOADED",
        processingStartedAt: null,
        processingCompletedAt: null,
      },
    });

    // Start processing again
    processDocumentAsync(document);

    return NextResponse.json({
      success: true,
      message: "Document processing retry started",
      documentId: document.id,
    });
  } catch (error) {
    console.error("Retry processing error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST to start processing." },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
