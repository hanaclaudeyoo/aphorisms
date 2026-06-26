import type Database from "better-sqlite3";
import type { AphorismTag, CreateTagInput } from "../../../shared/types";

interface TagGroupRow {
  id: number;
  name: string;
}

interface TagRow {
  id: number;
  name: string;
  group_id: number;
  color_hex: string | null;
}

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export function createTag(
  db: Database.Database,
  input: CreateTagInput
): AphorismTag {
  const name = input.name.trim();
  const groupName = input.groupName.trim();
  const colorHex = input.colorHex.trim();

  if (!name) {
    throw new Error("Tag name is required.");
  }

  if (!groupName) {
    throw new Error("Tag group name is required.");
  }

  if (!HEX_COLOR_PATTERN.test(colorHex)) {
    throw new Error("Tag color must be a hex color like #AABBCC.");
  }

  const createTagTransaction = db.transaction(() => {
    db.prepare(
      `
      INSERT INTO tag_groups(name)
      VALUES (?)
      ON CONFLICT(name) DO NOTHING
      `
    ).run(groupName);

    const group = db
      .prepare("SELECT id, name FROM tag_groups WHERE name = ?")
      .get(groupName) as TagGroupRow | undefined;

    if (!group) {
      throw new Error("Failed to create or find tag group.");
    }

    const existingTag = db
      .prepare("SELECT id FROM tags WHERE group_id = ? AND name = ?")
      .get(group.id, name);

    if (existingTag) {
      throw new Error("A tag with that name already exists in this group.");
    }

    const result = db
      .prepare(
        `
        INSERT INTO tags(group_id, name, color_hex)
        VALUES (?, ?, ?)
        `
      )
      .run(group.id, name, colorHex);

    return db
      .prepare(
        `
        SELECT id, name, group_id, color_hex
        FROM tags
        WHERE id = ?
        `
      )
      .get(result.lastInsertRowid) as TagRow;
  });

  const tag = createTagTransaction();

  return {
    id: String(tag.id),
    name: tag.name,
    groupId: String(tag.group_id),
    colorHex: tag.color_hex
  };
}

export function listTags(db: Database.Database): AphorismTag[] {
  const rows = db
    .prepare(
      `
      SELECT id, name, group_id, color_hex
      FROM tags
      ORDER BY name COLLATE NOCASE ASC
      `
    )
    .all() as TagRow[];

  return rows.map((tag) => ({
    id: String(tag.id),
    name: tag.name,
    groupId: String(tag.group_id),
    colorHex: tag.color_hex
  }));
}
