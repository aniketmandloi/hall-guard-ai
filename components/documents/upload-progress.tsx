"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { ProcessingProgress } from "@/lib/types/document-processing";

interface UploadProgressProps {
  documentId: string;
  fileName: string;
  onComplete?: (documentId: string, success: boolean) => void;
  onError?: (documentId: string, error: string) => void;
  className?: string;
}

interface ProgressStage {
  key: ProcessingProgress["stage"];
  label: string;
  description: string;
  weight: number; // For progress calculation
}

const PROCESSING_STAGES: ProgressStage[] = [
  {
    key: "uploading",
    label: "Uploading",
    description: "Uploading file to secure storage...",
    weight: 10,
  },
  {
    key: "extracting",
    label: "Extracting",
    description: "Extracting text from document...",
    weight: 30,
  },
  {
    key: "chunking",
    label: "Processing",
    description: "Creating document chunks for analysis...",
    weight: 20,
  },
  {
    key: "analyzing",
    label: "Analyzing",
    description: "Running AI analysis on content...",
    weight: 35,
  },
  {
    key: "completed",
    label: "Completed",
    description: "Document processing completed successfully!",
    weight: 5,
  },
];

export function UploadProgress({
  documentId,
  fileName,
  onComplete,
  onError,
  className,
}: UploadProgressProps) {
  const [progress, setProgress] = useState<ProcessingProgress>({
    stage: "uploading",
    progress: 0,
    message: "Starting upload...",
  });
  const [startTime] = useState(Date.now());
  const [estimatedTotal, setEstimatedTotal] = useState<number>();

  useEffect(() => {
    // Start polling for progress updates
    const pollProgress = async () => {
      try {
        const response = await fetch(`/api/documents/${documentId}/status`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: ProcessingProgress = await response.json();
        setProgress(data);

        // Update estimated total time if provided
        if (data.estimatedTimeRemaining) {
          const elapsed = (Date.now() - startTime) / 1000;
          const estimated = elapsed + data.estimatedTimeRemaining;
          setEstimatedTotal(estimated);
        }

        // Handle completion
        if (data.stage === "completed") {
          onComplete?.(documentId, true);
          return; // Stop polling
        }

        // Handle failure
        if (data.stage === "failed") {
          onError?.(documentId, data.error?.message || "Processing failed");
          return; // Stop polling
        }

        // Continue polling if still processing
        setTimeout(pollProgress, 1000);
      } catch (error) {
        console.error("Progress polling error:", error);
        onError?.(
          documentId,
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    };

    // Start polling after a short delay
    const timeoutId = setTimeout(pollProgress, 500);

    return () => clearTimeout(timeoutId);
  }, [documentId, onComplete, onError, startTime]);

  const getCurrentStageIndex = () => {
    return PROCESSING_STAGES.findIndex((stage) => stage.key === progress.stage);
  };

  const getOverallProgress = () => {
    const currentStageIndex = getCurrentStageIndex();
    const currentStage = PROCESSING_STAGES[currentStageIndex];

    if (!currentStage) return progress.progress;

    // Calculate progress based on completed stages + current stage progress
    const completedWeight = PROCESSING_STAGES.slice(
      0,
      currentStageIndex
    ).reduce((sum, stage) => sum + stage.weight, 0);

    const currentStageProgress =
      (progress.progress / 100) * currentStage.weight;

    return Math.min(100, completedWeight + currentStageProgress);
  };

  const formatElapsedTime = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const formatEstimatedTime = () => {
    if (!estimatedTotal) return null;

    const remaining = Math.max(
      0,
      estimatedTotal - (Date.now() - startTime) / 1000
    );
    const minutes = Math.floor(remaining / 60);
    const seconds = Math.floor(remaining % 60);

    if (remaining < 5) return "Almost done...";
    if (minutes > 0) return `~${minutes}m ${seconds}s remaining`;
    return `~${seconds}s remaining`;
  };

  const getStageIcon = (stage: ProcessingProgress["stage"]) => {
    switch (stage) {
      case "uploading":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "extracting":
        return <FileText className="h-4 w-4" />;
      case "chunking":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "analyzing":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (progress.stage) {
      case "completed":
        return "text-green-600";
      case "failed":
        return "text-red-600";
      default:
        return "text-blue-600";
    }
  };

  const overallProgress = getOverallProgress();
  const currentStageIndex = getCurrentStageIndex();
  const estimatedTimeRemaining = formatEstimatedTime();

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {getStageIcon(progress.stage)}
            Processing Document
          </CardTitle>
          <Badge
            variant={progress.stage === "completed" ? "default" : "secondary"}
            className={cn(getStatusColor())}
          >
            {PROCESSING_STAGES[currentStageIndex]?.label || progress.stage}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground truncate" title={fileName}>
          {fileName}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Current Stage Progress */}
        {progress.stage !== "completed" && progress.stage !== "failed" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{progress.message}</span>
              <span>{progress.progress}%</span>
            </div>
            <Progress value={progress.progress} className="h-1" />
          </div>
        )}

        {/* Stage List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Processing Stages</h4>
          <div className="space-y-1">
            {PROCESSING_STAGES.filter((stage) => stage.key !== "failed").map(
              (stage, index) => {
                const isCurrentStage = stage.key === progress.stage;
                const isCompletedStage = index < currentStageIndex;
                const isFutureStage = index > currentStageIndex;

                return (
                  <div
                    key={stage.key}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded text-sm",
                      isCurrentStage && "bg-blue-50 dark:bg-blue-950/50",
                      isCompletedStage && "text-muted-foreground",
                      isFutureStage && "text-muted-foreground/60"
                    )}
                  >
                    <div className="flex-shrink-0">
                      {isCompletedStage ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : isCurrentStage ? (
                        getStageIcon(stage.key)
                      ) : (
                        <div className="h-4 w-4 border-2 rounded-full border-muted-foreground/30" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{stage.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {isCurrentStage ? progress.message : stage.description}
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Timing Information */}
        <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Elapsed: {formatElapsedTime()}
          </div>
          {estimatedTimeRemaining && <div>{estimatedTimeRemaining}</div>}
        </div>

        {/* Error Display */}
        {progress.stage === "failed" && progress.error && (
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Processing Failed</div>
              <div className="text-sm mt-1">{progress.error.message}</div>
              {progress.error.retryable && (
                <div className="text-xs mt-2 text-muted-foreground">
                  This error may be temporary. Please try uploading again.
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Success Display */}
        {progress.stage === "completed" && (
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Processing Complete!</div>
              <div className="text-sm mt-1">
                Document has been successfully processed and is ready for
                analysis.
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
