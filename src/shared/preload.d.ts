export {};

import type { AphorismTag, CreateTagInput } from "./types";

declare global {
  interface Window {
    aphorisms: {
      platform: NodeJS.Platform;
      tags: {
        create: (input: CreateTagInput) => Promise<AphorismTag>;
        list: () => Promise<AphorismTag[]>;
      };
    };
  }
}
