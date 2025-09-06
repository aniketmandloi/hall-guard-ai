"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  File,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { FileValidationUtil } from "@/lib/utils/file-validation";
import {
  SUPPORTED_FILE_TYPES,
  MAX_FILE_SIZE,
  SupportedFileType,
  FileValidationResult,
  MIME_TYPE_MAP,
} from "@/lib/types/document-processing";

interface DocumentFile {
  file: File;
  id: string;
  validation?: FileValidationResult;
  uploadProgress?: number;
  uploadStatus: "pending" | "uploading" | "completed" | "error";
  error?: string;
}

interface DocumentUploadProps {
  onUploadComplete?: (documents: { id: string; filename: string }[]) => void;
  onUploadProgress?: (fileId: string, progress: number) => void;
  onValidationError?: (errors: string[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

export function DocumentUpload({
  onUploadComplete,
  onUploadProgress,
  onValidationError,
  maxFiles = 5,
  disabled = false,
  className,
}: DocumentUploadProps) {
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (disabled) return;

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const errors = rejectedFiles.map(({ errors }) =>
          errors.map(({ message }: { message: string }) => message).join(", ")
        );
        onValidationError?.(errors);
      }

      // Process accepted files
      if (acceptedFiles.length > 0) {
        setIsValidating(true);

        const newFiles: DocumentFile[] = acceptedFiles.map((file) => ({
          file,
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          uploadStatus: "pending" as const,
        }));

        // Validate files
        for (const docFile of newFiles) {
          try {
            const validation = await FileValidationUtil.validateFile(
              docFile.file
            );
            docFile.validation = validation;

            if (!validation.valid) {
              docFile.uploadStatus = "error";
              docFile.error = validation.errors.join(", ");
            }
          } catch (error) {
            docFile.uploadStatus = "error";
            docFile.error = `Validation failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`;
          }
        }

        setFiles((prevFiles) => {
          const combined = [...prevFiles, ...newFiles];
          // Enforce max files limit
          return combined.slice(0, maxFiles);
        });

        setIsValidating(false);

        // Report validation errors
        const validationErrors = newFiles
          .filter((f) => !f.validation?.valid)
          .map((f) => `${f.file.name}: ${f.error}`)
          .filter(Boolean);

        if (validationErrors.length > 0) {
          onValidationError?.(validationErrors);
        }
      }
    },
    [disabled, maxFiles, onValidationError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: SUPPORTED_FILE_TYPES.reduce((acc, type) => {
      // Use correct MIME types from MIME_TYPE_MAP
      const mimeTypes = MIME_TYPE_MAP[type];
      mimeTypes.forEach((mimeType) => {
        acc[mimeType] = [`.${type}`];
      });
      return acc;
    }, {} as Record<string, string[]>),
    maxFiles,
    maxSize: MAX_FILE_SIZE,
    disabled: disabled || isUploading,
    multiple: maxFiles > 1,
  });

  const removeFile = (id: string) => {
    if (disabled || isUploading) return;
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadFiles = async () => {
    if (disabled || isUploading) return;

    const validFiles = files.filter(
      (f) => f.validation?.valid && f.uploadStatus === "pending"
    );
    if (validFiles.length === 0) return;

    setIsUploading(true);
    const uploadedDocuments: { id: string; filename: string }[] = [];

    try {
      for (const docFile of validFiles) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === docFile.id
              ? { ...f, uploadStatus: "uploading", uploadProgress: 0 }
              : f
          )
        );

        try {
          // Create FormData
          const formData = new FormData();
          formData.append("file", docFile.file);
          formData.append("filename", docFile.file.name);

          // Upload with progress tracking
          const response = await fetch("/api/documents/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }

          const result = await response.json();

          setFiles((prev) =>
            prev.map((f) =>
              f.id === docFile.id
                ? { ...f, uploadStatus: "completed", uploadProgress: 100 }
                : f
            )
          );

          uploadedDocuments.push({
            id: result.documentId,
            filename: docFile.file.name,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Upload failed";

          setFiles((prev) =>
            prev.map((f) =>
              f.id === docFile.id
                ? { ...f, uploadStatus: "error", error: errorMessage }
                : f
            )
          );
        }
      }

      if (uploadedDocuments.length > 0) {
        onUploadComplete?.(uploadedDocuments);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const clearFiles = () => {
    if (disabled || isUploading) return;
    setFiles([]);
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    return <File className="h-4 w-4" />;
  };

  const validFilesCount = files.filter((f) => f.validation?.valid).length;
  const hasValidFiles = validFilesCount > 0;
  const allFilesProcessed =
    files.length > 0 &&
    files.every(
      (f) => f.uploadStatus === "completed" || f.uploadStatus === "error"
    );
  const uploadedDocuments = files.filter((f) => f.uploadStatus === "completed");

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Drop Zone */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
              isDragActive && "border-primary bg-primary/5",
              !isDragActive &&
                "border-muted-foreground/25 hover:border-muted-foreground/50",
              (disabled || isUploading) && "cursor-not-allowed opacity-50"
            )}
          >
            <input {...getInputProps()} />

            <div className="flex flex-col items-center gap-3">
              <Upload className="h-8 w-8 text-muted-foreground" />

              {isDragActive ? (
                <p className="text-sm text-muted-foreground">
                  Drop the files here...
                </p>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Drop files here or{" "}
                    <span className="text-primary underline">browse</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports {SUPPORTED_FILE_TYPES.join(", ").toUpperCase()} up
                    to {formatFileSize(MAX_FILE_SIZE)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Validation Status */}
          {isValidating && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>Validating files...</AlertDescription>
            </Alert>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  Files ({files.length}/{maxFiles})
                </h3>
                {!isUploading && (
                  <Button variant="ghost" size="sm" onClick={clearFiles}>
                    Clear All
                  </Button>
                )}
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {files.map((docFile) => (
                  <div
                    key={docFile.id}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      {getFileIcon(docFile.file)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {docFile.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(docFile.file.size)}
                      </p>

                      {/* Validation Messages */}
                      {docFile.validation?.warnings &&
                        docFile.validation.warnings.length > 0 && (
                          <div className="text-xs text-amber-600 mt-1">
                            {docFile.validation.warnings.join(", ")}
                          </div>
                        )}

                      {/* Upload Progress */}
                      {docFile.uploadStatus === "uploading" && (
                        <div className="mt-2">
                          <Progress
                            value={docFile.uploadProgress || 0}
                            className="h-1"
                          />
                        </div>
                      )}

                      {/* Error Message */}
                      {docFile.error && (
                        <div className="text-xs text-destructive mt-1">
                          {docFile.error}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Status Badge */}
                      {docFile.uploadStatus === "pending" &&
                        docFile.validation?.valid && (
                          <Badge variant="secondary">Ready</Badge>
                        )}
                      {docFile.uploadStatus === "uploading" && (
                        <Badge variant="secondary">
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          Uploading
                        </Badge>
                      )}
                      {docFile.uploadStatus === "completed" && (
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Uploaded
                        </Badge>
                      )}
                      {(docFile.uploadStatus === "error" ||
                        !docFile.validation?.valid) && (
                        <Badge variant="destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Error
                        </Badge>
                      )}

                      {/* Remove Button */}
                      {!isUploading && docFile.uploadStatus !== "completed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(docFile.id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Button */}
          {hasValidFiles && !allFilesProcessed && (
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={uploadFiles}
                disabled={disabled || isUploading || !hasValidFiles}
                className="min-w-32"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  `Upload ${validFilesCount} File${
                    validFilesCount > 1 ? "s" : ""
                  }`
                )}
              </Button>
            </div>
          )}

          {/* Success Message */}
          {allFilesProcessed && uploadedDocuments.length > 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Successfully uploaded {uploadedDocuments.length} file
                {uploadedDocuments.length > 1 ? "s" : ""}!
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
