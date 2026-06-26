import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "node:path";
import {
  getDefaultDatabasePath,
  initializeDatabase,
  type InitializedDatabase
} from "./db/database";
import { createTag, listTags } from "./db/repositories/tagsRepository";
import type { CreateTagInput } from "../shared/types";

let appDatabase: InitializedDatabase | undefined;

const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: "Aphorisms",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
};

const getDatabase = (): InitializedDatabase => {
  if (!appDatabase) {
    throw new Error("Database has not been initialized.");
  }

  return appDatabase;
};

const registerIpcHandlers = (): void => {
  ipcMain.handle("tags:create", (_event, input: CreateTagInput) => {
    return createTag(getDatabase().db, input);
  });

  ipcMain.handle("tags:list", () => {
    return listTags(getDatabase().db);
  });
};

app.whenReady().then(() => {
  appDatabase = initializeDatabase(getDefaultDatabasePath(app.getPath("userData")));
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  appDatabase?.db.close();
});
