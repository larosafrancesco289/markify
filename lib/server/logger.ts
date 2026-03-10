function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { value: error };
}

export function logError(
  message: string,
  context: Record<string, unknown> = {}
): void {
  console.error(
    JSON.stringify({
      level: "error",
      message,
      ...context,
    })
  );
}

export function logUnexpectedError(
  message: string,
  error: unknown,
  context: Record<string, unknown> = {}
): void {
  logError(message, {
    ...context,
    error: serializeError(error),
  });
}
