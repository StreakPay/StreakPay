import type { ZodError } from "zod";

export function getZodErrorMessage(error: ZodError): string {
  const firstIssue = error.issues?.[0];
  if (!firstIssue) return "Validation failed";

  const path = firstIssue.path?.join(".");
  const message = firstIssue.message;

  return path ? `${path}: ${message}` : message;
}
