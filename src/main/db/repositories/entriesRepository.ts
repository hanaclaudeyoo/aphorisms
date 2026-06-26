import type Database from "better-sqlite3";
import type {
  AphorismEntry,
  CreateEntryInput
} from "../../../shared/types";

interface EntryRow {
  id: number;
  body: string;
  entry_date: string;
  created_at: string;
}

const ENTRY_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function normalizeTagIds(tagIds: string[]): number[] {
  const normalizedIds = tagIds.map((tagId) => Number(tagId));

  if (
    normalizedIds.some(
      (tagId) => !Number.isSafeInteger(tagId) || tagId <= 0
    )
  ) {
    throw new Error("Entry contains an invalid tag.");
  }

  return [...new Set(normalizedIds)];
}

function isValidEntryDate(entryDate: string): boolean {
  if (!ENTRY_DATE_PATTERN.test(entryDate)) {
    return false;
  }

  const [year, month, day] = entryDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function createEntry(
  db: Database.Database,
  input: CreateEntryInput
): AphorismEntry {
  const text = input.text.trim();
  const entryDate = input.entryDate.trim();
  const tagIds = normalizeTagIds(input.tagIds);

  if (!text) {
    throw new Error("Entry text is required.");
  }

  if (!isValidEntryDate(entryDate)) {
    throw new Error("Entry date must be a valid date in YYYY-MM-DD format.");
  }

  const createEntryTransaction = db.transaction(() => {
    if (tagIds.length > 0) {
      const placeholders = tagIds.map(() => "?").join(", ");
      const result = db
        .prepare(`SELECT COUNT(*) AS count FROM tags WHERE id IN (${placeholders})`)
        .get(...tagIds) as { count: number };

      if (result.count !== tagIds.length) {
        throw new Error("One or more selected tags do not exist.");
      }
    }

    const insertResult = db
      .prepare(
        `
        INSERT INTO entries(body, entry_date)
        VALUES (?, ?)
        `
      )
      .run(text, entryDate);
    const entryId = Number(insertResult.lastInsertRowid);

    db.prepare(
      `
      INSERT INTO entry_chunks(entry_id, chunk_index, body, start_offset, end_offset)
      VALUES (?, 0, ?, 0, ?)
      `
    ).run(entryId, text, text.length);

    const attachTag = db.prepare(
      "INSERT INTO entry_tags(entry_id, tag_id) VALUES (?, ?)"
    );
    for (const tagId of tagIds) {
      attachTag.run(entryId, tagId);
    }

    return db
      .prepare(
        `
        SELECT id, body, entry_date, created_at
        FROM entries
        WHERE id = ?
        `
      )
      .get(entryId) as EntryRow;
  });

  const entry = createEntryTransaction();

  return {
    id: String(entry.id),
    text: entry.body,
    entryDate: entry.entry_date,
    createdAt: entry.created_at,
    tagIds: tagIds.map(String)
  };
}
