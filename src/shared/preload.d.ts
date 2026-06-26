export {};

declare global {
  interface Window {
    aphorisms: {
      platform: NodeJS.Platform;
    };
  }
}
