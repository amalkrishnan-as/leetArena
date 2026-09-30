// LeetCode web GraphQL client.
// Uses the public web GraphQL endpoint to fetch recent accepted submissions.
// This is NOT a stable public developer API — it is LeetCode's internal web API.
// Do NOT ask for LeetCode credentials (password, cookies, tokens).
// Only the user's public LeetCode username is required.

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql/";

const RECENT_AC_SUBMISSIONS_QUERY = `
  query recentAcSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
      id
      title
      titleSlug
      timestamp
    }
  }
`;

export interface LeetCodeSubmission {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: string; // Unix timestamp string, e.g. "1716012345"
}

export interface FetchRecentAcResult {
  submissions: LeetCodeSubmission[];
  error?: "UNAVAILABLE" | "PROFILE_NOT_FOUND";
}

/**
 * Fetches the most recent accepted submissions for a given LeetCode username.
 * Returns up to `limit` submissions (max 20 recommended for the prototype).
 *
 * LIMITATIONS:
 * - Only returns recent accepted submissions. If the user solved the problem
 *   long ago and it has rolled off the list, verification will fail.
 * - This is LeetCode's internal web API and may change without notice.
 */
export async function fetchRecentAcSubmissions(
  username: string,
  limit = 20
): Promise<FetchRecentAcResult> {
  try {
    const response = await fetch(LEETCODE_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Minimal headers to look like a browser request
        Referer: "https://leetcode.com/",
      },
      body: JSON.stringify({
        query: RECENT_AC_SUBMISSIONS_QUERY,
        variables: { username, limit },
      }),
      // Short timeout — don't hang the verify request
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error(
        `[LeetCode] HTTP ${response.status} for username: ${username}`
      );
      return { submissions: [], error: "UNAVAILABLE" };
    }

    const json = await response.json();

    const submissions: LeetCodeSubmission[] | null =
      json?.data?.recentAcSubmissionList ?? null;

    if (submissions === null) {
      // null result typically means the username doesn't exist or profile is private
      console.error(`[LeetCode] Null submission list for username: ${username}`);
      return { submissions: [], error: "PROFILE_NOT_FOUND" };
    }

    return { submissions };
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      console.error("[LeetCode] Request timed out");
    } else {
      console.error("[LeetCode] Fetch error:", err);
    }
    return { submissions: [], error: "UNAVAILABLE" };
  }
}
