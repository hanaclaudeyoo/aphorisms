import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("aphorisms", {
  platform: process.platform
});
