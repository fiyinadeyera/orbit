import type { Contact, ExistingConnection } from "./types";

function describeContact(contact: Contact): string {
  const parts: string[] = [`[${contact.id}] ${contact.name}`];

  const roleCompany = [contact.role, contact.company].filter(Boolean).join(" at ");
  if (roleCompany) parts.push(roleCompany);
  if (contact.location) parts.push(`(${contact.location})`);

  const detail: string[] = [];
  if (contact.interests && contact.interests.length) {
    detail.push(`Interests: ${contact.interests.join(", ")}`);
  }
  if (contact.lookingFor) detail.push(`Looking for: ${contact.lookingFor}`);
  if (contact.notes) detail.push(`Notes: ${contact.notes}`);
  if (contact.lastContactedDaysAgo != null) {
    detail.push(`Last spoke: ${contact.lastContactedDaysAgo}d ago`);
  }

  return detail.length ? `${parts.join(" ")} — ${detail.join(". ")}` : parts.join(" ");
}

/** Render the contact pool as compact, id-tagged lines for the prompt. */
export function formatRoster(contacts: Contact[]): string {
  return contacts.map(describeContact).join("\n");
}

/**
 * Render existing connections by name so the model can see (and avoid
 * re-suggesting) relationships that already exist.
 */
export function formatExistingConnections(
  contacts: Contact[],
  connections: ExistingConnection[],
): string {
  const nameById = new Map(contacts.map((c) => [c.id, c.name]));
  const lines = connections
    .map(({ aId, bId }) => {
      const a = nameById.get(aId);
      const b = nameById.get(bId);
      return a && b ? `${a} <-> ${b}` : null;
    })
    .filter((line): line is string => line !== null);
  return lines.length ? lines.join("\n") : "(none yet)";
}
