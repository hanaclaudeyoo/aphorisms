import type {
  AphorismEntry,
  AphorismTag,
  CreateEntryInput,
  CreateTagInput
} from "./types";

export {};

declare global {
  interface Window {
    aphorisms: {
      platform: NodeJS.Platform;
      entries: {
        create: (input: CreateEntryInput) => Promise<AphorismEntry>;
      };
      tags: {
        create: (input: CreateTagInput) => Promise<AphorismTag>;
        list: () => Promise<AphorismTag[]>;
      };
    };
  }
}
