import { describe, expect, it } from "vitest";
import { loadEnv } from "./env.js";

describe("loadEnv", () => {
  it("applies defaults for local development", () => {
    const env = loadEnv({});

    expect(env.API_PORT).toBe(3001);
    expect(env.PROBE_TIMEOUT_MS).toBe(3000);
    expect(env.WEB_ORIGIN).toBe("http://localhost:5173");
    expect(env.PROBE_MODE).toBe("live");
  });
});
