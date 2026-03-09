export function assertSafePath(path: string): void {
  if (!path || typeof path !== "string") throw new Error("Invalid path");
  if (path.includes("\\0")) throw new Error("Path contains null byte");
  if (path.includes("..")) throw new Error("Path traversal blocked");
  if (path.startsWith("/") || path.startsWith("\\")) throw new Error("Absolute paths are blocked");
  if (path.includes("\\")) throw new Error("Backslashes are blocked");
}
