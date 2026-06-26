import type Database from "better-sqlite3";
import type {
  AphorismEntry,
  CreateEntryInput,
  ListEntriesInput,
  ListEntriesResult
} from "../../../shared/types";

interface EntryRow {
  id: number;
  body: string;
  entry_date: string;
  created_at: string;
}

interface ListedEntryRow extends EntryRow {
  tag_ids: string | null;
}

const ENTRY_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

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

export function listEntries(
  db: Database.Database,
  input: ListEntriesInput = {}
): ListEntriesResult {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? DEFAULT_PAGE_SIZE;
  const startDate = input.startDate?.trim() || undefined;
  const endDate = input.endDate?.trim() || undefined;
  const sortDirection = input.sortDirection ?? "desc";

  if (!Number.isSafeInteger(page) || page < 1) {
    throw new Error("Page must be a positive integer.");
  }

  if (
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > MAX_PAGE_SIZE
  ) {
    throw new Error(`Page size must be between 1 and ${MAX_PAGE_SIZE}.`);
  }

  if (startDate && !isValidEntryDate(startDate)) {
    throw new Error("Start date must be a valid date in YYYY-MM-DD format.");
  }

  if (endDate && !isValidEntryDate(endDate)) {
    throw new Error("End date must be a valid date in YYYY-MM-DD format.");
  }

  if (startDate && endDate && startDate > endDate) {
    throw new Error("Start date cannot be after end date.");
  }

  if (sortDirection !== "asc" && sortDirection !== "desc") {
    throw new Error("Sort direction must be either asc or desc.");
  }

  let tagId: number | undefined;
  if (input.tagId !== undefined && input.tagId !== "") {
    [tagId] = normalizeTagIds([input.tagId]);
  }

  const conditions: string[] = [];
  const filterValues: Array<string | number> = [];

  if (startDate) {
    conditions.push("e.entry_date >= ?");
    filterValues.push(startDate);
  }

  if (endDate) {
    conditions.push("e.entry_date <= ?");
    filterValues.push(endDate);
  }

  if (tagId !== undefined) {
    conditions.push(
      "EXISTS (SELECT 1 FROM entry_tags filtered_et WHERE filtered_et.entry_id = e.id AND filtered_et.tag_id = ?)"
    );
    filterValues.push(tagId);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const totalEntries = (
    db
      .prepare(`SELECT COUNT(*) AS count FROM entries e ${whereClause}`)
      .get(...filterValues) as { count: number }
  ).count;
  const offset = (page - 1) * pageSize;
  const sqlSortDirection = sortDirection.toUpperCase();

  const rows = db
    .prepare(
      `
      SELECT
        e.id,
        e.body,
        e.entry_date,
        e.created_at,
        (
          SELECT GROUP_CONCAT(et.tag_id)
          FROM entry_tags et
          WHERE et.entry_id = e.id
        ) AS tag_ids
      FROM entries e
      ${whereClause}
      ORDER BY e.entry_date ${sqlSortDirection}, e.id ${sqlSortDirection}
      LIMIT ? OFFSET ?
      `
    )
    .all(...filterValues, pageSize, offset) as ListedEntryRow[];

  return {
    entries: rows.map((entry) => ({
      id: String(entry.id),
      text: entry.body,
      entryDate: entry.entry_date,
      createdAt: entry.created_at,
      tagIds: entry.tag_ids ? entry.tag_ids.split(",") : []
    })),
    page,
    pageSize,
    totalEntries,
    totalPages: Math.ceil(totalEntries / pageSize)
  };
}
