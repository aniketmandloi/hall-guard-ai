import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/prisma/db";
import { ProcessingProgress } from "@/lib/types/document-processing";

export async function GET(
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

    // Map database status to processing progress
    const progress = mapDocumentStatusToProgress(document);

    return NextResponse.json(progress);
  } catch (error) {
    console.error("Status API error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function mapDocumentStatusToProgress(document: any): ProcessingProgress {
  const now = new Date();
  const startTime = document.processingStartedAt || document.createdTime;
  const elapsedMs = now.getTime() - startTime.getTime();
  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  switch (document.status) {
    case "UPLOADED":
      return {
        stage: "uploading",
        progress: 100,
        message: "File uploaded successfully. Starting processing...",
        estimatedTimeRemaining: 30,
      };

    case "PROCESSING":
      // Estimate progress based on elapsed time
      // This is a simplified estimation - in a real system you'd track actual progress
      const estimatedTotalTime = estimateProcessingTime(
        document.fileSize,
        document.fileType
      );
      const progressPercentage = Math.min(
        95,
        (elapsedSeconds / estimatedTotalTime) * 100
      );

      let stage: ProcessingProgress["stage"] = "extracting";
      let message = "Extracting text from document...";
      const estimatedRemaining = Math.max(
        5,
        estimatedTotalTime - elapsedSeconds
      );

      if (progressPercentage > 30) {
        stage = "chunking";
        message = "Creating document chunks for analysis...";
      }
      if (progressPercentage > 60) {
        stage = "analyzing";
        message = "Running AI analysis on content...";
      }

      return {
        stage,
        progress: Math.round(progressPercentage),
        message,
        estimatedTimeRemaining: estimatedRemaining,
      };

    case "COMPLETED":
      return {
        stage: "completed",
        progress: 100,
        message: `Document processed successfully! Created ${
          document.chunkCount || 0
        } chunks.`,
      };

    case "FAILED":
      return {
        stage: "failed",
        progress: 0,
        message: "Document processing failed. Please try uploading again.",
        error: {
          code: "PROCESSING_FAILED",
          message: "Document processing failed due to an internal error",
          retryable: true,
        },
      };

    default:
      return {
        stage: "uploading",
        progress: 0,
        message: "Starting document processing...",
      };
  }
}

function estimateProcessingTime(fileSize: bigint, fileType: string): number {
  // Convert bigint to number for calculation (in bytes)
  const sizeInBytes = Number(fileSize);
  const sizeInMB = sizeInBytes / (1024 * 1024);

  // Base time estimates per MB by file type (in seconds)
  const timePerMB = {
    pdf: 3.0, // PDFs take longer due to parsing complexity
    docx: 2.0, // DOCX processing is moderate
    doc: 2.5, // Legacy DOC format takes a bit longer
    txt: 1.0, // Plain text is fastest
    rtf: 1.5, // RTF is relatively simple
  };

  const multiplier = timePerMB[fileType as keyof typeof timePerMB] || 2.0;
  const estimatedTime = Math.max(10, sizeInMB * multiplier); // Minimum 10 seconds

  return Math.ceil(estimatedTime);
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
