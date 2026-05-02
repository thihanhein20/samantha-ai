export type BatchStatus =
  | "pending"
  | "uploading"
  | "extracting"
  | "ready"
  | "saving"
  | "done"
  | "error";

export interface BatchItem {
  id: string;
  file: File;
  status: BatchStatus;
  error?: string;
  fileUrl?: string;
  s3Key?: string;
  formData?: Record<string, string>;
}
