import { describe, expect, it } from "vitest";
import { githubLookupToStatus, lookupGithubSlug } from "./github-client.js";

describe("lookupGithubSlug", () => {
  it("checks user then org endpoints", async () => {
    const requested: string[] = [];

    const result = await lookupGithubSlug("matrixdevworks", {
      fetchFn: async (input) => {
        requested.push(String(input));
        if (String(input).endsWith("/users/matrixdevworks")) {
          return new Response(null, { status: 404 });
        }
        if (String(input).endsWith("/orgs/matrixdevworks")) {
          return new Response(JSON.stringify({ html_url: "https://github.com/matrixdevworks" }), {
            status: 200,
          });
        }
        return new Response(null, { status: 500 });
      },
    });

    expect(requested).toHaveLength(2);
    expect(result.kind).toBe("org");
    expect(result.profileUrl).toBe("https://github.com/matrixdevworks");
    expect(githubLookupToStatus(result)).toBe("taken");
  });

  it("marks slug available when user and org are missing", async () => {
    const result = await lookupGithubSlug("unused-slug-xyz", {
      fetchFn: async () => new Response(null, { status: 404 }),
    });

    expect(githubLookupToStatus(result)).toBe("available");
  });
});
