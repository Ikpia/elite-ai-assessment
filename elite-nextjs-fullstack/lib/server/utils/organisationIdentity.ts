export function normalizeOrganisationName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function buildOrganisationKey(orgName: string): string {
  const normalizedName = normalizeOrganisationName(orgName)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

  const key = normalizedName.replace(/[^a-z0-9]+/g, "");

  if (!key) {
    throw new Error("Organisation name must contain letters or numbers.");
  }

  return key;
}
