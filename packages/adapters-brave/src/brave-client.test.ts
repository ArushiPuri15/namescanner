import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { detectWebCollision, searchWeb } from "./brave-client.js";

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "../fixtures");
const fixture = JSON.parse(
  readFileSync(join(fixtureDir, "web-search-response.json"), "utf8"),
) as { web: { results: Array<{ title: string; url: string; description: string }> } };

describe("detectWebCollision", () => {
  it("flags a collision when result text matches the candidate", () => {
    const { collision, matched } = detectWebCollision(
      "Matrix Infotech",
      fixture.web.results,
    );

    expect(collision).toBe(true);
    expect(matched).toHaveLength(1);
  });

  it("returns available when there are no results", () => {
    expect(detectWebCollision("Matrix Devworks", []).collision).toBe(false);
  });
});

describe("searchWeb", () => {
  it("calls Brave with the subscription token header", async () => {
    const requested: { url: string; headers: Headers }[] = [];

    await searchWeb("matrix devworks", {
      apiKey: "test-key",
      fetchFn: async (input, init) => {
        requested.push({
          url: String(input),
          headers: new Headers(init?.headers),
        });
        return new Response(JSON.stringify(fixture), { status: 200 });
      },
    });

    expect(requested[0]?.url).toContain("api.search.brave.com");
    expect(requested[0]?.headers.get("X-Subscription-Token")).toBe("test-key");
  });
});
