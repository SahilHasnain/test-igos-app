import { defineConfig } from "@playwright/test";

const mode = process.env.IGOS_E2E_MODE ?? "demo";
const isAppwrite = mode === "appwrite";
const testPort = isAppwrite ? 3002 : 3001;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: isAppwrite ? 1 : 0,
  workers: isAppwrite ? 1 : 6,
  use: {
    baseURL: `http://localhost:${testPort}`,
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    port: testPort,
    timeout: 60_000,
    reuseExistingServer: false,
    env: {
      ...process.env,
      IGOS_E2E_MODE: mode,
      PORT: String(testPort),
      ...(isAppwrite
        ? {}
        : {
            NEXT_PUBLIC_APPWRITE_ENDPOINT: "",
            NEXT_PUBLIC_APPWRITE_PROJECT_ID: "",
          }),
    },
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],
  reporter: [["list"], ["html", { open: "never" }]],
});
