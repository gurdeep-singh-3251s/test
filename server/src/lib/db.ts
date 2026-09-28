export function hasNeonUrl() {
  if (process.env.USE_NEON !== "true") return false;
  const url = process.env.DATABASE_URL ?? "";
  return url.startsWith("postgres") && !url.includes("USER:PASSWORD@HOST");
}
