import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { CREATE_SCHEMA_SQL, CURRENT_SCHEMA_VERSION } from "./schema";

export interface InitializedDatabase {
  db: Database.Database;
  path: string;
  schemaVersion: number;
}

export function getDefaultDatabasePath(userDataPath: string): string {
  return join(userDataPath, "aphorisms.sqlite3");
}

export function initializeDatabase(databasePath: string): InitializedDatabase {
  mkdirSync(dirname(databasePath), { recursive: true });

  const db = new Database(databasePath);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.exec(CREATE_SCHEMA_SQL);
  db.pragma(`user_version = ${CURRENT_SCHEMA_VERSION}`);

  return {
    db,
    path: databasePath,
    schemaVersion: CURRENT_SCHEMA_VERSION
  };
}
