export class HttpError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;

  constructor(code: string, message: string, status = 400, details?: Record<string, unknown>) {
    super(message);
    this.name = "HttpError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return {
      status: error.status,
      body: {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details ?? null,
        },
      },
    };
  }

  const message = error instanceof Error ? error.message : "Unexpected error";
  return {
    status: 500,
    body: {
      success: false,
      error: {
        code: "SCAN_FAILED",
        message,
        details: null,
      },
    },
  };
}
