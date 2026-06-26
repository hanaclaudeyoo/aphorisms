import type {
  AphorismEntry,
  AphorismTag,
  CreateEntryInput,
  CreateTagInput,
  ListEntriesInput,
  ListEntriesResult
} from "./types";

export {};

declare global {
  interface Window {
    aphorisms: {
      platform: NodeJS.Platform;
      entries: {
        create: (input: CreateEntryInput) => Promise<AphorismEntry>;
        list: (input: ListEntriesInput) => Promise<ListEntriesResult>;
      };
      tags: {
        create: (input: CreateTagInput) => Promise<AphorismTag>;
        list: () => Promise<AphorismTag[]>;
      };
    };
  }
}
