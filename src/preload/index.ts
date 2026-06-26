import { contextBridge, ipcRenderer } from "electron";
import type { AphorismTag, CreateTagInput } from "../shared/types";

contextBridge.exposeInMainWorld("aphorisms", {
  platform: process.platform,
  tags: {
    create: (input: CreateTagInput): Promise<AphorismTag> => {
      return ipcRenderer.invoke("tags:create", input);
    },
    list: (): Promise<AphorismTag[]> => {
      return ipcRenderer.invoke("tags:list");
    }
  }
});
