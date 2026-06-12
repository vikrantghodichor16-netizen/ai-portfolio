// ============================================================
// UI Rendering & Animations
// Handles all DOM manipulation, scroll reveals, typewriter, etc.
// ============================================================

import { CONFIG } from './config.js';

// Language colors (matches GitHub's linguist colors)
const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
  Java: '#b07219', 'C++': '#f34b7d', C: '#555555', 'C#': '#178600',
  Go: '#00ADD8', Rust: '#dea584', Ruby: '#701516',
  PHP: '#4F5D95', Swift: '#F05138', Kotlin: '#A97BFF',
  Dart: '#00B4AB', HTML: '#e34c26', CSS: '#563d7c',
  Shell: '#89e051', Lua: '#000080', R: '#198CE7',
  Scala: '#c22d40', Vue: '#41b883', Svelte: '#ff3e00',
  Jupyter: '#DA5B0B', Dockerfile: '#384d54', Makefile: '#427819',
  SCSS: '#c6538c', Sass: '#a53b70', Less: '#1d365d',
};

function getLanguageColor(lang) {
  return LANG_COLORS[lang] || '#7c3aed';
}

// ---- Hero ----
export function renderHero(profile) {
  const avatar = document.getElementById('hero-avatar');
  const name = document.getElementById('hero-name');
  const bio = document.getElementById('hero-bio');

  if (profile.avatar_url) {
    avatar.src = profile.avatar_url;
    avatar.alt = `${profile.name || profile.login}'s avatar`;
  }
  if (profile.name) {
    name.textContent = profile.name;
  }
  if (profile.bio) {
    bio.textContent = profile.bio;
  } else {
    bio.textContent = 'Passionate developer building open-source projects on GitHub.';
  }
}

// ---- Stats (animated counters) ----
export function renderStats(stats) {
  animateCounter('stat-repos', stats.repos);
  animateCounter('stat-stars', stats.stars);
  animateCounter('stat-forks', stats.forks);
  animateCounter('stat-followers', stats.followers);
}

function animateCounter(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.setAttribute('data-target', target);

  const duration = 2000;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target);
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = target;
    }
  }
  requestAnimationFrame(update);
}

// ---- About ----
export function renderAbout(profile) {
  const textEl = document.getElementById('about-text');
  const locationEl = document.getElementById('about-location');
  const joinedEl = document.getElementById('about-joined');
  const companyEl = document.getElementById('about-company');

  const bio = profile.bio || 'A passionate developer sharing open-source projects on GitHub.';
  textEl.innerHTML = `<p>${bio}</p><p>With <strong>${profile.public_repos || 0}</strong> public repositories and an active presence on GitHub, I'm constantly building, learning, and contributing to the developer community.</p>`;

  if (profile.location) {
    locationEl.querySelector('span').textContent = profile.location;
  }

  if (profile.created_at) {
    const joined = new Date(profile.created_at);
    joinedEl.querySelector('span').textContent = `Joined ${joined.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
  }

  if (profile.company) {
    companyEl.querySelector('span').textContent = profile.company;
  } else {
    companyEl.style.display = 'none';
  }
}

// ---- Skills ----
export function renderSkills(languages) {
  const grid = document.getElementById('skills-grid');
  grid.innerHTML = '';

  if (languages.length === 0) {
    grid.innerHTML = '<p class="text-muted">No language data available</p>';
    return;
  }

  languages.forEach((lang, i) => {
    const card = document.createElement('div');
    card.className = 'skill-card reveal';
    card.style.animationDelay = `${i * 0.05}s`;

    const color = getLanguageColor(lang.name);
    const formattedBytes = lang.bytes > 1024 * 1024
      ? `${(lang.bytes / (1024 * 1024)).toFixed(1)} MB`
      : `${(lang.bytes / 1024).toFixed(1)} KB`;

    card.innerHTML = `
      <div class="skill-card__header">
        <span class="skill-card__dot" style="background: ${color}"></span>
        <span class="skill-card__name">${lang.name}</span>
        <span class="skill-card__pct">${lang.percentage}%</span>
      </div>
      <div class="skill-card__bar">
        <div class="skill-card__fill" style="--fill-width: ${lang.percentage}%; --fill-color: ${color}" data-width="${lang.percentage}"></div>
      </div>
      <span class="skill-card__bytes">${formattedBytes}</span>
    `;
    grid.appendChild(card);
  });

  // Trigger progress bar animations after render
  requestAnimationFrame(() => {
    document.querySelectorAll('.skill-card__fill').forEach(bar => {
      bar.style.width = bar.style.getPropertyValue('--fill-width');
    });
  });
}

// ---- Projects ----
export function renderProjects(repos) {
  const grid = document.getElementById('projects-grid');
  grid.innerHTML = '';

  const topRepos = repos
    .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
    .slice(0, CONFIG.MAX_PROJECTS);

  if (topRepos.length === 0) {
    grid.innerHTML = '<p class="text-muted">No projects found</p>';
    return;
  }

  topRepos.forEach((repo, i) => {
    const card = document.createElement('article');
    card.className = 'project-card reveal';
    card.style.animationDelay = `${i * 0.05}s`;

    const langColor = getLanguageColor(repo.language);
    const topics = (repo.topics || []).slice(0, 4);
    const topicHTML = topics.map(t => `<span class="project-card__tag">${t}</span>`).join('');

    card.innerHTML = `
      <div class="project-card__header">
        <svg class="project-card__repo-icon" viewBox="0 0 16 16" fill="currentColor" width="16" height="16"><path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1h-8a1 1 0 00-1 1v6.708A2.486 2.486 0 014.5 9h8.5V1.5zm-8 11a1 1 0 100-2 1 1 0 000 2z"/></svg>
        <a href="${repo.html_url}" target="_blank" rel="noopener" class="project-card__name">${repo.name}</a>
      </div>
      <p class="project-card__desc">${repo.description || 'No description provided'}</p>
      <div class="project-card__meta">
        ${repo.language ? `<span class="project-card__lang"><span class="project-card__lang-dot" style="background: ${langColor}"></span>${repo.language}</span>` : ''}
        <span class="project-card__stat">⭐ ${repo.stargazers_count || 0}</span>
        <span class="project-card__stat">🍴 ${repo.forks_count || 0}</span>
      </div>
      ${topicHTML ? `<div class="project-card__tags">${topicHTML}</div>` : ''}
    `;
    grid.appendChild(card);
  });
}

// ---- Typewriter Effect ----
export function initTypewriter(elementId, texts, typeSpeed = 80, deleteSpeed = 50, pauseTime = 2000) {
  const el = document.getElementById(elementId);
  if (!el) return;

  let textIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function tick() {
    const currentText = texts[textIndex];

    if (isDeleting) {
      el.textContent = currentText.substring(0, charIndex - 1);
      charIndex--;
    } else {
      el.textContent = currentText.substring(0, charIndex + 1);
      charIndex++;
    }

    let delay = isDeleting ? deleteSpeed : typeSpeed;

    if (!isDeleting && charIndex === currentText.length) {
      delay = pauseTime;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      textIndex = (textIndex + 1) % texts.length;
      delay = 400;
    }

    setTimeout(tick, delay);
  }

  tick();
}

// ---- Scroll Reveal (IntersectionObserver) ----
export function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ---- Active Nav Link on Scroll ----
export function initNavScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav__link');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => link.classList.remove('active'));
          const activeLink = document.querySelector(`.nav__link[href="#${entry.target.id}"]`);
          if (activeLink) activeLink.classList.add('active');
        }
      });
    },
    { threshold: 0.3 }
  );

  sections.forEach(section => observer.observe(section));
}

// ---- Navbar scroll effect ----
export function initNavScroll() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }
  });
}

// ---- Mobile nav toggle ----
export function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    links.classList.toggle('active');
  });

  // Close on link click
  links.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      links.classList.remove('active');
    });
  });
}

// ---- Particles Background ----
export function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let particles = [];
  const PARTICLE_COUNT = 40;
  const CONNECTION_DISTANCE = 120;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.4 + 0.1,
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: PARTICLE_COUNT }, createParticle);
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(124, 58, 237, ${p.opacity})`;
      ctx.fill();
    });

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECTION_DISTANCE) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(124, 58, 237, ${0.1 * (1 - dist / CONNECTION_DISTANCE)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resize);
  init();
  animate();
}
