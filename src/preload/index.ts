import { contextBridge, ipcRenderer } from "electron";
import type {
  AphorismEntry,
  AphorismTag,
  CreateEntryInput,
  CreateTagInput
} from "../shared/types";

contextBridge.exposeInMainWorld("aphorisms", {
  platform: process.platform,
  entries: {
    create: (input: CreateEntryInput): Promise<AphorismEntry> => {
      return ipcRenderer.invoke("entries:create", input);
    }
  },
  tags: {
    create: (input: CreateTagInput): Promise<AphorismTag> => {
      return ipcRenderer.invoke("tags:create", input);
    },
    list: (): Promise<AphorismTag[]> => {
      return ipcRenderer.invoke("tags:list");
    }
  }
});
