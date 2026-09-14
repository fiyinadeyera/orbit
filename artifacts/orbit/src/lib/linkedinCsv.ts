import type { ImportCandidate } from './importCandidates';

// Parse the `Connections.csv` LinkedIn hands users from "Get a copy of your
// data". There is no API for connections, so this export file is the only
// route. Pure and defensive: LinkedIn adds a notes preamble above the real
// header and quotes fields that contain commas.

/** RFC-4180-ish tokenizer: rows of fields, honouring quotes and CRLF/LF. */
function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch !== '\r') {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function columnIndex(header: string[], name: string): number {
  return header.findIndex((h) => h.trim().toLowerCase() === name);
}

export function parseLinkedInConnections(text: string): ImportCandidate[] {
  const rows = parseCsvRows(text);

  // LinkedIn prepends a few "Notes:" lines, so the real header is the first row
  // that actually looks like the connections header.
  const headerIndex = rows.findIndex(
    (row) =>
      columnIndex(row, 'first name') !== -1 && columnIndex(row, 'last name') !== -1,
  );
  if (headerIndex === -1) return [];

  const header = rows[headerIndex];
  const col = {
    first: columnIndex(header, 'first name'),
    last: columnIndex(header, 'last name'),
    email: columnIndex(header, 'email address'),
    company: columnIndex(header, 'company'),
    position: columnIndex(header, 'position'),
  };

  const candidates: ImportCandidate[] = [];
  for (let i = headerIndex + 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (row.length === 0 || row.every((v) => v.trim() === '')) continue;

    const cell = (index: number) => (index >= 0 ? (row[index] ?? '').trim() : '');
    const name = [cell(col.first), cell(col.last)].filter(Boolean).join(' ').trim();
    if (!name) continue;

    candidates.push({
      key: name,
      name,
      email: cell(col.email) || undefined,
      company: cell(col.company) || undefined,
      role: cell(col.position) || undefined,
    });
  }

  return candidates;
}
