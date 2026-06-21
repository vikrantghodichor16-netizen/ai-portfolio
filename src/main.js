// ============================================================
// Main Entry Point
// Initializes the portfolio application
// ============================================================

import { CONFIG } from './config.js';
import { fetchProfile, fetchRepos, aggregateLanguages, computeStats } from './github.js';
import {
  renderHero, renderStats, renderAbout, renderSkills, renderProjects,
  initTypewriter, initScrollReveal, initNavScrollSpy, initNavScroll,
  initMobileNav, initParticles,
} from './ui.js';
import { initChatbot, setPortfolioContext } from './chatbot.js';

async function init() {
  // Initialize UI features immediately
  initParticles();
  initNavScroll();
  initMobileNav();
  initTypewriter('typewriter', CONFIG.TAGLINES);
  initChatbot();

  // Set footer year
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Fetch GitHub data
  try {
    const [profile, repos] = await Promise.all([
      fetchProfile(CONFIG.GITHUB_USERNAME),
      fetchRepos(CONFIG.GITHUB_USERNAME),
    ]);

    const languages = aggregateLanguages(repos);
    const stats = computeStats(profile, repos);

    // Render sections
    renderHero(profile);
    renderStats(stats);
    renderAbout(profile);
    renderSkills(languages);
    renderProjects(repos);

    // Set chatbot context
    setPortfolioContext(profile, repos, languages);

    // Initialize scroll reveal AFTER content is rendered
    setTimeout(() => {
      initScrollReveal();
      initNavScrollSpy();
    }, 100);

  } catch (error) {
    console.error('Failed to fetch GitHub data:', error);
    document.getElementById('hero-bio').textContent = 'Unable to load profile data. Please check back later.';
    document.getElementById('skills-grid').innerHTML = '<p style="color: var(--text-muted)">Unable to load skills data</p>';
    document.getElementById('projects-grid').innerHTML = '<p style="color: var(--text-muted)">Unable to load projects</p>';

    // Set a minimal fallback context so the chatbot still responds
    setPortfolioContext(
      { name: CONFIG.DISPLAY_NAME, login: CONFIG.GITHUB_USERNAME, bio: 'Developer', location: null, public_repos: 0, followers: 0, created_at: null },
      [],
      []
    );

    initScrollReveal();
    initNavScrollSpy();
  }
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
