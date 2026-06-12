// ============================================================
// AI Chatbot Widget
// Powered by Google Gemini with streaming responses
// ============================================================

import { CONFIG, getApiKey, setApiKey, hasApiKey } from './config.js';

let conversationHistory = [];
let portfolioContext = '';
let isStreaming = false;
let lastRequestTime = 0;

export function setPortfolioContext(profile, repos, languages) {
  const repoSummaries = repos.slice(0, 15).map(r =>
    `- ${r.name}: ${r.description || 'No description'} [${r.language || 'N/A'}] ⭐${r.stargazers_count} 🍴${r.forks_count}`
  ).join('\n');

  const langSummary = languages.slice(0, 10).map(l => `${l.name} (${l.percentage}%)`).join(', ');

  portfolioContext = `
PORTFOLIO OWNER: ${profile.name || profile.login}
GITHUB: https://github.com/${profile.login}
BIO: ${profile.bio || 'Developer'}
LOCATION: ${profile.location || 'Not specified'}
PUBLIC REPOS: ${profile.public_repos}
FOLLOWERS: ${profile.followers}
ACCOUNT CREATED: ${profile.created_at}

TOP LANGUAGES: ${langSummary}

REPOSITORIES:
${repoSummaries}
`.trim();
}

function getSystemPrompt() {
  return `You are an intelligent, friendly AI assistant embedded in ${CONFIG.DISPLAY_NAME}'s portfolio website.
Your goal is to help visitors learn about their skills, experience, and projects.

Guidelines:
- Base answers EXCLUSIVELY on the provided knowledge base below. Do NOT make up information.
- If you don't know the answer, politely say so and suggest visiting the GitHub profile.
- Keep responses concise (2-3 sentences max unless asked for detail).
- Use a professional yet warm, conversational tone.
- You may use emoji sparingly to keep things friendly.
- For project questions, mention the tech stack, description, and stats.
- Do not discuss anything unrelated to the portfolio owner's professional profile.

KNOWLEDGE BASE:
${portfolioContext}`;
}

async function sendToGemini(userMessage) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }

  conversationHistory.push({ role: 'user', parts: [{ text: userMessage }] });

  const body = {
    systemInstruction: { parts: [{ text: getSystemPrompt() }] },
    contents: conversationHistory,
    generationConfig: {
      temperature: CONFIG.CHAT_TEMPERATURE,
      maxOutputTokens: CONFIG.CHAT_MAX_TOKENS,
      topP: 0.9,
    },
  };

  const url = `${CONFIG.GEMINI_API_URL}/${CONFIG.GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 429) throw new Error('RATE_LIMITED');
    throw new Error(`API_ERROR: ${res.status} ${errText}`);
  }

  return res;
}

export function initChatbot() {
  const fab = document.getElementById('chatbot-fab');
  const panel = document.getElementById('chatbot-panel');
  const chatbot = document.getElementById('chatbot');
  const input = document.getElementById('chatbot-input');
  const sendBtn = document.getElementById('chatbot-send');
  const messages = document.getElementById('chatbot-messages');
  const chips = document.getElementById('chatbot-chips');
  const settingsBtn = document.getElementById('chatbot-settings-btn');
  const settingsPanel = document.getElementById('chatbot-settings');
  const apiKeyInput = document.getElementById('api-key-input');
  const apiKeySave = document.getElementById('api-key-save');

  let isOpen = false;

  // Toggle chat panel
  fab.addEventListener('click', () => {
    isOpen = !isOpen;
    chatbot.classList.toggle('chatbot--open', isOpen);
    if (isOpen) input.focus();
  });

  // Settings toggle
  settingsBtn.addEventListener('click', () => {
    settingsPanel.classList.toggle('chatbot__settings--open');
    if (settingsPanel.classList.contains('chatbot__settings--open')) {
      apiKeyInput.value = getApiKey();
    }
  });

  // Save API key
  apiKeySave.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
      setApiKey(key);
      settingsPanel.classList.remove('chatbot__settings--open');
      addMessage('assistant', '✅ API key saved! You can now chat with me.');
    }
  });

  // Send message
  async function handleSend() {
    const text = input.value.trim();
    if (!text || isStreaming) return;

    // Rate limiting
    const now = Date.now();
    if (now - lastRequestTime < CONFIG.CHAT_RATE_LIMIT_MS) {
      addMessage('assistant', '⏳ Please wait a moment before sending another message.');
      return;
    }
    lastRequestTime = now;

    addMessage('user', text);
    input.value = '';

    // Hide chips after first message
    if (chips) chips.style.display = 'none';

    if (!hasApiKey()) {
      addMessage('assistant', '🔑 Please set your Gemini API key first! Click the ⚙️ icon above to add your free API key from <a href="https://aistudio.google.com/apikey" target="_blank">Google AI Studio</a>.');
      return;
    }

    const typingEl = showTypingIndicator();
    isStreaming = true;

    try {
      const res = await sendToGemini(text);
      removeTypingIndicator(typingEl);

      const assistantEl = addMessage('assistant', '');
      const contentEl = assistantEl.querySelector('.chatbot__msg-content');
      let fullText = '';

      // Stream SSE response
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === '[DONE]') continue;
            try {
              const data = JSON.parse(jsonStr);
              const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                fullText += text;
                contentEl.innerHTML = formatMessage(fullText);
                scrollToBottom(messages);
              }
            } catch { /* skip malformed JSON */ }
          }
        }
      }

      // Store in history
      if (fullText) {
        conversationHistory.push({ role: 'model', parts: [{ text: fullText }] });
      }
    } catch (err) {
      removeTypingIndicator(typingEl);

      if (err.message === 'NO_API_KEY') {
        addMessage('assistant', '🔑 Please set your Gemini API key in settings (⚙️ icon).');
      } else if (err.message === 'RATE_LIMITED') {
        addMessage('assistant', '⏳ Rate limited by the API. Please wait a moment and try again.');
        // Remove last user message from history
        conversationHistory.pop();
      } else {
        addMessage('assistant', '❌ Something went wrong. Please try again.');
        console.error('Chatbot error:', err);
        conversationHistory.pop();
      }
    } finally {
      isStreaming = false;
    }
  }

  sendBtn.addEventListener('click', handleSend);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // Prompt chips
  document.querySelectorAll('.chatbot__chip').forEach(chip => {
    chip.addEventListener('click', () => {
      input.value = chip.dataset.prompt;
      handleSend();
    });
  });
}

function addMessage(role, content) {
  const messages = document.getElementById('chatbot-messages');
  const bubble = document.createElement('div');
  bubble.className = `chatbot__msg chatbot__msg--${role}`;
  bubble.innerHTML = `<div class="chatbot__msg-content">${formatMessage(content)}</div>`;
  messages.appendChild(bubble);
  scrollToBottom(messages);
  return bubble;
}

function formatMessage(text) {
  // Basic markdown-like formatting
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
}

function showTypingIndicator() {
  const messages = document.getElementById('chatbot-messages');
  const typing = document.createElement('div');
  typing.className = 'chatbot__typing';
  typing.innerHTML = '<span></span><span></span><span></span>';
  messages.appendChild(typing);
  scrollToBottom(messages);
  return typing;
}

function removeTypingIndicator(el) {
  if (el && el.parentNode) el.parentNode.removeChild(el);
}

function scrollToBottom(container) {
  container.scrollTop = container.scrollHeight;
}
