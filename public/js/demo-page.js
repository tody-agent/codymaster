/* ============================================
   Interactive Demo Page — Simulated AI Chat
   ============================================ */

(function () {
  'use strict';

  let translations = {};
  let demoT = {};
  let isRunning = false;

  // Demo scenarios with skill sequences
  const SCENARIOS = {
    'landing': { skills: ['cm-planning', 'cm-ux-master', 'cm-execution', 'cm-safe-deploy'], preview: '☕ My Coffee Shop' },
    'portfolio': { skills: ['cm-planning', 'cm-content-factory', 'cm-ux-master', 'cm-execution'], preview: '🎨 Portfolio' },
    'dashboard': { skills: ['cm-brainstorm-idea', 'cm-planning', 'cm-ux-master', 'cm-execution'], preview: '📊 SaaS Dashboard' },
    'seo': { skills: ['cm-content-factory', 'cm-safe-i18n', 'cm-readit'], preview: '📝 Blog SEO' }
  };

  const SCENARIO_KEYS = Object.keys(SCENARIOS);

  async function init() {
    const lang = localStorage.getItem('kit-lang') ||
      (new URLSearchParams(window.location.search).get('lang')) ||
      (navigator.language?.startsWith('vi') ? 'vi' : 'en');

    try {
      const res = await fetch(`i18n/${lang}.json`);
      translations = await res.json();
    } catch (e) {
      const res = await fetch('i18n/en.json');
      translations = await res.json();
    }

    demoT = translations.demoPage || {};

    // Update placeholder
    const input = document.getElementById('demoInput');
    if (input && demoT.inputPlaceholder) {
      input.placeholder = demoT.inputPlaceholder;
    }

    // Show welcome message
    addAiMessage(demoT.welcomeMessage || 'Hi! I\'m Cody Master.');

    // Show suggestions
    showSuggestions();

    // Setup send
    const sendBtn = document.getElementById('demoSend');
    sendBtn?.addEventListener('click', handleSend);
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSend();
    });

    if (window.lucide) lucide.createIcons();
  }

  function showSuggestions() {
    const container = document.getElementById('demoMessages');
    const sugDiv = document.createElement('div');
    sugDiv.className = 'demo-suggestions';
    sugDiv.id = 'demoSuggestions';

    const suggestions = demoT.suggestions || [
      'Build a landing page for my coffee shop',
      'Create a portfolio website',
      'Design a SaaS dashboard',
      'Write SEO content for my blog'
    ];

    suggestions.forEach((text, i) => {
      const btn = document.createElement('button');
      btn.className = 'demo-suggestion';
      btn.textContent = text;
      btn.addEventListener('click', () => {
        document.getElementById('demoInput').value = text;
        handleSend(SCENARIO_KEYS[i]);
      });
      sugDiv.appendChild(btn);
    });

    container.appendChild(sugDiv);
  }

  function handleSend(scenarioKey) {
    if (isRunning) return;

    const input = document.getElementById('demoInput');
    const text = input.value.trim();
    if (!text) return;

    // Remove suggestions
    const sug = document.getElementById('demoSuggestions');
    if (sug) sug.remove();

    // Add user message
    addUserMessage(text);
    input.value = '';

    // Determine scenario
    const key = scenarioKey || guessScenario(text);
    const scenario = SCENARIOS[key] || SCENARIOS['landing'];

    // Run demo sequence
    runDemo(scenario, text);
  }

  function guessScenario(text) {
    const lower = text.toLowerCase();
    if (lower.includes('portfolio') || lower.includes('cv')) return 'portfolio';
    if (lower.includes('dashboard') || lower.includes('saas') || lower.includes('analytics')) return 'dashboard';
    if (lower.includes('seo') || lower.includes('blog') || lower.includes('content') || lower.includes('nội dung')) return 'seo';
    return 'landing';
  }

  async function runDemo(scenario, userText) {
    isRunning = true;
    const phases = demoT.phases || {};

    // 1. Thinking
    const thinkingMsg = addTypingMessage();
    await delay(1500);
    replaceWithAiMessage(thinkingMsg, phases.thinking || 'Analyzing your request...');

    await delay(800);

    // 2. Skills detection
    const skillsLabel = demoT.skillsUsed || 'Skills activated:';
    const skillMsg = addAiMessage(skillsLabel);
    addSkillTags(skillMsg, scenario.skills);

    await delay(1000);

    // 3. Progress steps
    const phaseKeys = ['planning', 'designing', 'coding', 'deploying', 'done'];
    const progressMsg = addAiMessage('');
    const progressDiv = document.createElement('div');
    progressDiv.className = 'demo-progress';
    progressMsg.appendChild(progressDiv);

    for (let i = 0; i < phaseKeys.length; i++) {
      const key = phaseKeys[i];
      const text = phases[key] || key;

      // Mark previous as done
      const prev = progressDiv.querySelector('.demo-progress__step--active');
      if (prev) {
        prev.classList.remove('demo-progress__step--active');
        prev.classList.add('demo-progress__step--done');
      }

      const step = document.createElement('div');
      step.className = `demo-progress__step ${i < phaseKeys.length - 1 ? 'demo-progress__step--active' : 'demo-progress__step--done'}`;
      step.style.animationDelay = `${i * 0.1}s`;
      step.innerHTML = `<span class="demo-progress__dot"></span> ${text}`;
      progressDiv.appendChild(step);

      scrollToBottom();
      await delay(i === phaseKeys.length - 1 ? 600 : 1200);
    }

    // 4. Result
    await delay(500);
    showResult(scenario.preview);

    // Confetti!
    launchConfetti();

    isRunning = false;
  }

  function showResult(previewText) {
    const container = document.getElementById('demoMessages');
    const result = document.createElement('div');
    result.className = 'demo-result';
    result.innerHTML = `
      <div class="demo-result__title">${demoT.resultTitle || 'Your project is ready!'}</div>
      <div class="demo-result__preview">${previewText}</div>
      <a href="start.html" class="btn btn--primary">${demoT.resultCta || 'Install for real →'}</a>
      <br>
      <button class="demo-suggestion" style="margin-top:12px" onclick="location.reload()">${demoT.tryAnother || 'Try another prompt'}</button>
    `;
    container.appendChild(result);
    scrollToBottom();
  }

  // ─── Message Helpers ────────────────────────
  function addAiMessage(text) {
    const container = document.getElementById('demoMessages');
    const msg = document.createElement('div');
    msg.className = 'demo-msg demo-msg--ai';
    msg.innerHTML = `<span class="demo-msg__name">${demoT.aiName || 'Cody Master AI'}</span>${text}`;
    container.appendChild(msg);
    scrollToBottom();
    return msg;
  }

  function addUserMessage(text) {
    const container = document.getElementById('demoMessages');
    const msg = document.createElement('div');
    msg.className = 'demo-msg demo-msg--user';
    msg.textContent = text;
    container.appendChild(msg);
    scrollToBottom();
  }

  function addTypingMessage() {
    const container = document.getElementById('demoMessages');
    const msg = document.createElement('div');
    msg.className = 'demo-msg demo-msg--ai';
    msg.innerHTML = `
      <span class="demo-msg__name">${demoT.aiName || 'Cody Master AI'}</span>
      <div class="demo-typing">
        <span class="demo-typing__dot"></span>
        <span class="demo-typing__dot"></span>
        <span class="demo-typing__dot"></span>
      </div>
    `;
    container.appendChild(msg);
    scrollToBottom();
    return msg;
  }

  function replaceWithAiMessage(el, text) {
    el.innerHTML = `<span class="demo-msg__name">${demoT.aiName || 'Cody Master AI'}</span>${text}`;
  }

  function addSkillTags(msgEl, skills) {
    const tagsDiv = document.createElement('div');
    tagsDiv.className = 'demo-msg__skills';
    skills.forEach(skill => {
      const tag = document.createElement('span');
      tag.className = 'demo-msg__skill-tag';
      tag.textContent = skill;
      tagsDiv.appendChild(tag);
    });
    msgEl.appendChild(tagsDiv);
  }

  function scrollToBottom() {
    const chat = document.querySelector('.demo-chat');
    if (chat) {
      requestAnimationFrame(() => {
        chat.scrollTop = chat.scrollHeight;
      });
    }
  }

  // ─── Confetti ───────────────────────────────
  function launchConfetti() {
    const colors = ['#C4F82A', '#7C3AED', '#2563EB', '#F97316', '#06D6A0', '#06B6D4'];
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDuration = (Math.random() * 2 + 1) + 's';
      confetti.style.animationDelay = Math.random() * 0.5 + 's';
      confetti.style.width = (Math.random() * 8 + 4) + 'px';
      confetti.style.height = confetti.style.width;
      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 4000);
    }
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
