export type GithubClientOptions = {
  apiToken?: string;
  baseUrl?: string;
  fetchFn?: typeof fetch;
  signal?: AbortSignal;
  userAgent?: string;
};

export type GithubLookupResult = {
  slug: string;
  kind: "user" | "org" | "none";
  httpStatus: number;
  profileUrl?: string;
};

const DEFAULT_BASE_URL = "https://api.github.com";

function headers(options: GithubClientOptions): Headers {
  const result = new Headers({
    Accept: "application/vnd.github+json",
    "User-Agent": options.userAgent ?? "namescanner/0.1",
  });

  if (options.apiToken) {
    result.set("Authorization", `Bearer ${options.apiToken}`);
  }

  return result;
}

async function lookupEndpoint(
  path: string,
  options: GithubClientOptions,
): Promise<{ status: number; profileUrl?: string }> {
  const fetchFn = options.fetchFn ?? fetch;
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  const response = await fetchFn(`${baseUrl}${path}`, {
    headers: headers(options),
    signal: options.signal,
  });

  if (response.status === 200) {
    const payload = (await response.json()) as { html_url?: string };
    return { status: 200, profileUrl: payload.html_url };
  }

  return { status: response.status };
}

export async function lookupGithubSlug(
  slug: string,
  options: GithubClientOptions,
): Promise<GithubLookupResult> {
  const user = await lookupEndpoint(`/users/${encodeURIComponent(slug)}`, options);
  if (user.status === 200) {
    return {
      slug,
      kind: "user",
      httpStatus: 200,
      profileUrl: user.profileUrl,
    };
  }

  if (user.status !== 404) {
    return {
      slug,
      kind: "none",
      httpStatus: user.status,
    };
  }

  const org = await lookupEndpoint(`/orgs/${encodeURIComponent(slug)}`, options);
  if (org.status === 200) {
    return {
      slug,
      kind: "org",
      httpStatus: 200,
      profileUrl: org.profileUrl,
    };
  }

  return {
    slug,
    kind: "none",
    httpStatus: org.status,
  };
}

export function githubLookupToStatus(result: GithubLookupResult): "available" | "taken" | "error" {
  if (result.httpStatus === 200) {
    return "taken";
  }

  if (result.httpStatus === 404) {
    return "available";
  }

  return "error";
}
