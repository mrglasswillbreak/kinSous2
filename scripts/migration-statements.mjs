export function migrationStatements(content) {
  // Explicit boundaries preserve complete PL/pgSQL function bodies.
  return content
    .split("-- statement-break")
    .flatMap((section) =>
      section.includes("$$") ? [section] : section.split(/;\s*(?:\n|$)/),
    )
    .filter((statement) => statement.trim());
}
