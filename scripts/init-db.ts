import { resolve } from "node:path";
import { initializeDatabase } from "../src/main/db/database";

const databasePath =
  process.env.APHORISMS_DB_PATH ?? resolve(process.cwd(), ".local/aphorisms.sqlite3");

const initialized = initializeDatabase(databasePath);
initialized.db.close();

console.log(
  `Initialized Aphorisms database v${initialized.schemaVersion} at ${initialized.path}`
);
