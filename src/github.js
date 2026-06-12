// ============================================================
// GitHub API Integration
// Fetches profile, repos, and language data from GitHub REST API
// Caches results in sessionStorage to avoid rate limits
// ============================================================

const GITHUB_API = 'https://api.github.com';

function getCached(key) {
  try {
    const item = sessionStorage.getItem(key);
    if (!item) return null;
    const { data, expiry } = JSON.parse(item);
    if (Date.now() > expiry) {
      sessionStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setCache(key, data, ttlMs = 30 * 60 * 1000) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, expiry: Date.now() + ttlMs }));
  } catch { /* quota exceeded, ignore */ }
}

export async function fetchProfile(username) {
  const cacheKey = `gh_profile_${username}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${GITHUB_API}/users/${username}`);
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const data = await res.json();
  setCache(cacheKey, data);
  return data;
}

export async function fetchRepos(username) {
  const cacheKey = `gh_repos_${username}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // Fetch up to 100 repos sorted by pushed time
  const res = await fetch(`${GITHUB_API}/users/${username}/repos?per_page=100&sort=pushed&direction=desc`);
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const data = await res.json();

  // Filter out forks
  const ownRepos = data.filter(r => !r.fork);
  setCache(cacheKey, ownRepos);
  return ownRepos;
}

export function aggregateLanguages(repos) {
  const langs = {};
  for (const repo of repos) {
    if (repo.language) {
      langs[repo.language] = (langs[repo.language] || 0) + (repo.size || 0);
    }
  }

  // Sort by bytes descending
  const sorted = Object.entries(langs).sort((a, b) => b[1] - a[1]);
  const totalBytes = sorted.reduce((sum, [, bytes]) => sum + bytes, 0);

  return sorted.map(([name, bytes]) => ({
    name,
    bytes,
    percentage: totalBytes > 0 ? Math.round((bytes / totalBytes) * 100) : 0,
  }));
}

export function computeStats(profile, repos) {
  const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  const totalForks = repos.reduce((sum, r) => sum + (r.forks_count || 0), 0);

  return {
    repos: profile.public_repos || repos.length,
    stars: totalStars,
    forks: totalForks,
    followers: profile.followers || 0,
  };
}
