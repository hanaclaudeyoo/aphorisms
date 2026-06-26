import { contextBridge, ipcRenderer } from "electron";
import type {
  AphorismEntry,
  AphorismTag,
  CreateEntryInput,
  CreateTagInput,
  ListEntriesInput,
  ListEntriesResult
} from "../shared/types";

contextBridge.exposeInMainWorld("aphorisms", {
  platform: process.platform,
  entries: {
    create: (input: CreateEntryInput): Promise<AphorismEntry> => {
      return ipcRenderer.invoke("entries:create", input);
    },
    list: (input: ListEntriesInput): Promise<ListEntriesResult> => {
      return ipcRenderer.invoke("entries:list", input);
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
