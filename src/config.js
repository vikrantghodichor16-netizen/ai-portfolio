// ============================================================
// Configuration & Constants
// ============================================================

export const CONFIG = {
  // GitHub username — change this to your own
  GITHUB_USERNAME: 'vikrantghodichor16-netizen',

  // Display name (fallback if GitHub name is null)
  DISPLAY_NAME: 'Vikrant Ghodichor',

  // Taglines for the typewriter effect
  TAGLINES: [
    'Full Stack Developer',
    'Open Source Enthusiast',
    'Building the Future with Code',
    'AI & Web Technologies',
  ],

  // Number of top repos to show
  MAX_PROJECTS: 9,

  // GitHub API
  GITHUB_API: 'https://api.github.com',

  // Gemini API (for dev mode — production uses serverless proxy)
  GEMINI_MODEL: 'gemini-3.5-flash',
  GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models',

  // Chat settings
  CHAT_MAX_TOKENS: 500,
  CHAT_TEMPERATURE: 0.7,
  CHAT_RATE_LIMIT_MS: 3000,

  // Social links (update with your own)
  SOCIAL: {
    github: 'https://github.com/vikrantghodichor16-netizen',
    linkedin: '',
    email: '',
  },
};

// ============================================================
// Settings Panel (API Key Management)
// ============================================================

export function getApiKey() {
  return localStorage.getItem('gemini_api_key') || '';
}

export function setApiKey(key) {
  localStorage.setItem('gemini_api_key', key);
}

export function hasApiKey() {
  return !!getApiKey();
}
