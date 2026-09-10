// Only log fixed operation names and SQLSTATE codes; never database error
// messages, queries or connection strings, which may contain private data.
export function logDatabaseFailure(operation: string, error: unknown) {
  const code = error && typeof error === "object" && "code" in error
    ? error.code : null;
  console.error(JSON.stringify({
    event: "database_operation_failed",
    operation,
    code: typeof code === "string" && /^[A-Z0-9]{5}$/.test(code) ? code : "UNKNOWN",
  }));
}
