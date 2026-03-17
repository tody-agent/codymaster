/* CodyMaster Dashboard v3 — Multi-Project, History, Deploy, Changelog */

(function () {
  'use strict';

  // ── Theme Management ──────────────────────
  const THEME_KEY = 'cm-theme';
  const darkMQ = window.matchMedia('(prefers-color-scheme: dark)');

  function getEffectiveTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return darkMQ.matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const sunIcon = document.getElementById('theme-icon-sun');
    const moonIcon = document.getElementById('theme-icon-moon');
    if (sunIcon && moonIcon) {
      sunIcon.style.display = theme === 'dark' ? 'block' : 'none';
      moonIcon.style.display = theme === 'dark' ? 'none' : 'block';
    }
  }

  // Apply immediately to avoid flash
  applyTheme(getEffectiveTheme());

  // Listen for OS preference changes (only when no manual override)
  darkMQ.addEventListener('change', () => {
    if (!localStorage.getItem(THEME_KEY)) {
      applyTheme(getEffectiveTheme());
    }
  });
  const API = '/api';
  const AGENT_COLORS = {
    'antigravity': '#3fb950', 'claude-code': '#bc8cff', 'cursor': '#58a6ff',
    'gemini-cli': '#d29922', 'windsurf': '#f97316', 'cline': '#a1887f',
    'copilot': '#8b949e', 'manual': '#e6edf3',
  };
  const AGENT_LABELS = {
    'antigravity': 'Antigravity', 'claude-code': 'Claude Code', 'cursor': 'Cursor',
    'gemini-cli': 'Gemini CLI', 'windsurf': 'Windsurf', 'cline': 'Cline',
    'copilot': 'Copilot', 'manual': 'Manual',
  };
  const ACTIVITY_ICONS = {
    'task_created': '✨', 'task_moved': '↔️', 'task_done': '✅', 'task_deleted': '🗑️', 'task_updated': '✏️',
    'task_dispatched': '🚀',
    'project_created': '📦', 'project_deleted': '🗑️',
    'deploy_staging': '🟡', 'deploy_production': '🚀', 'deploy_failed': '❌', 'rollback': '⏪',
    'git_push': '📤', 'changelog_added': '📝',
  };

  // ── State ──────────────────────────────────
  let projects = [], tasks = [], activities = [], deployments = [], changelog = [];
  let selectedProjectId = null;
  let draggedTaskId = null;
  let currentTab = 'kanban';

  // ── DOM Refs ───────────────────────────────
  const columns = {
    backlog: document.getElementById('list-backlog'),
    'in-progress': document.getElementById('list-in-progress'),
    review: document.getElementById('list-review'),
    done: document.getElementById('list-done'),
  };

  const sidebar = document.getElementById('sidebar');
  const projectListEl = document.getElementById('project-list');
  const agentListEl = document.getElementById('agent-list');
  const headerProjectName = document.getElementById('header-project-name');
  const taskStats = document.getElementById('task-stats');

  const modalOverlay = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const taskForm = document.getElementById('task-form');
  const formId = document.getElementById('form-id');
  const formTitle = document.getElementById('form-title');
  const formDescription = document.getElementById('form-description');
  const formPriority = document.getElementById('form-priority');
  const formColumn = document.getElementById('form-column');
  const formAgent = document.getElementById('form-agent');
  const formSkill = document.getElementById('form-skill');
  const btnSubmit = document.getElementById('btn-submit');

  const projectModalOverlay = document.getElementById('project-modal-overlay');
  const projectForm = document.getElementById('project-form');
  const projectNameInput = document.getElementById('project-name');
  const projectPathInput = document.getElementById('project-path');

  const deployModalOverlay = document.getElementById('deploy-modal-overlay');
  const deployForm = document.getElementById('deploy-form');
  const changelogModalOverlay = document.getElementById('changelog-modal-overlay');
  const changelogForm = document.getElementById('changelog-form');

  const deleteOverlay = document.getElementById('delete-overlay');
  const deleteTaskName = document.getElementById('delete-task-name');
  const deleteConfirm = document.getElementById('delete-confirm');

  const toastContainer = document.getElementById('toast-container');
  const refreshBtn = document.getElementById('btn-refresh');

  // ── API Helpers ────────────────────────────
  async function fetchJSON(url, opts) {
    const res = await fetch(url, opts);
    if (res.status === 204) return null;
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Request failed'); }
    return res.json();
  }

  // ── Data Loading ───────────────────────────
  async function loadAll() {
    const pq = selectedProjectId ? 'projectId=' + selectedProjectId : '';
    const aq = [pq, 'limit=100'].filter(Boolean).join('&');
    const qs = pq ? '?' + pq : '';
    const [p, t, a, d, c] = await Promise.all([
      fetchJSON(`${API}/projects`),
      fetchJSON(`${API}/tasks${qs}`),
      fetchJSON(`${API}/activities?${aq}`),
      fetchJSON(`${API}/deployments${qs}`),
      fetchJSON(`${API}/changelog${qs}`),
    ]);
    projects = p || []; tasks = t || [];
    activities = a || []; deployments = d || []; changelog = c || [];
  }

  async function refreshData() {
    refreshBtn.classList.add('refreshing');
    try {
      await loadAll();
      renderSidebar();
      renderCurrentTab();
      showToast('info', 'Refreshed');
    } catch (err) { showToast('error', 'Refresh failed: ' + err.message); }
    setTimeout(() => refreshBtn.classList.remove('refreshing'), 600);
  }

  // ── Tab Navigation ─────────────────────────
  function switchTab(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + tabName));
    renderCurrentTab();
  }

  function renderCurrentTab() {
    switch (currentTab) {
      case 'kanban': renderBoard(); break;
      case 'history': renderHistory(); break;
      case 'deploys': renderDeploys(); break;
      case 'changelog': renderChangelog(); break;
    }
  }

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // ── Sidebar Rendering ─────────────────────
  function renderSidebar() {
    let html = `<div class="project-item project-item-all ${!selectedProjectId ? 'active' : ''}" data-project-id="">
      <span class="project-icon">📁</span><span class="project-name">All Projects</span>
      <span class="project-task-count">${tasks.length || countAllTasks()}</span></div>`;
    projects.forEach(p => {
      html += `<div class="project-item ${selectedProjectId === p.id ? 'active' : ''}" data-project-id="${p.id}">
        <span class="project-icon">📦</span><span class="project-name" title="${esc(p.path)}">${esc(p.name)}</span>
        <span class="project-task-count">${p.taskCount || 0}</span>
        <button class="project-delete-btn" data-delete-project="${p.id}" title="Delete project">✕</button></div>`;
    });
    projectListEl.innerHTML = html;

    projectListEl.querySelectorAll('.project-item').forEach(el => {
      el.addEventListener('click', async e => {
        if (e.target.closest('.project-delete-btn')) return;
        selectedProjectId = el.dataset.projectId || null;
        await refreshData();
      });
    });

    projectListEl.querySelectorAll('.project-delete-btn').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        const pid = btn.dataset.deleteProject;
        const proj = projects.find(p => p.id === pid);
        if (!proj || !confirm(`Delete "${proj.name}" and all its tasks?`)) return;
        try {
          await fetchJSON(`${API}/projects/${pid}`, { method: 'DELETE' });
          if (selectedProjectId === pid) selectedProjectId = null;
          await refreshData();
          showToast('success', 'Project deleted');
        } catch (err) { showToast('error', err.message); }
      });
    });

    // Agents
    const allAgents = {};
    tasks.forEach(t => { if (t.agent) allAgents[t.agent] = (allAgents[t.agent] || 0) + 1; });
    if (Object.keys(allAgents).length === 0) {
      agentListEl.innerHTML = '<div class="agent-empty">No active agents</div>';
    } else {
      agentListEl.innerHTML = Object.entries(allAgents).sort((a, b) => b[1] - a[1]).map(([agent, count]) => {
        const color = AGENT_COLORS[agent] || '#8b949e';
        return `<div class="agent-badge"><span class="agent-dot" style="background:${color}"></span><span>${esc(AGENT_LABELS[agent] || agent)}</span><span class="agent-task-count">${count}</span></div>`;
      }).join('');
    }

    headerProjectName.textContent = selectedProjectId ? (projects.find(p => p.id === selectedProjectId)?.name || 'Unknown') : 'All Projects';
  }

  function countAllTasks() { return projects.reduce((s, p) => s + (p.taskCount || 0), 0); }

  // ── Board Rendering ────────────────────────
  function renderBoard() {
    const colNames = ['backlog', 'in-progress', 'review', 'done'];
    const emptyIcons = { backlog: '📋', 'in-progress': '⚡', review: '🔍', done: '✅' };
    const emptyTexts = { backlog: 'No tasks in backlog', 'in-progress': 'Nothing in progress', review: 'No tasks to review', done: 'No completed tasks' };

    colNames.forEach(col => {
      const list = columns[col];
      const colTasks = tasks.filter(t => t.column === col).sort((a, b) => a.order - b.order);
      list.innerHTML = '';
      if (colTasks.length === 0) {
        list.innerHTML = `<div class="empty-state"><span class="empty-state-icon">${emptyIcons[col]}</span><span class="empty-state-text">${emptyTexts[col]}</span></div>`;
      } else {
        colTasks.forEach(task => list.appendChild(createCard(task)));
      }
      const ce = document.querySelector(`[data-count="${col}"]`);
      if (ce) ce.textContent = colTasks.length;
    });
    renderStats();
  }

  function createCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card'; card.dataset.taskId = task.id; card.draggable = true;
    const ac = AGENT_COLORS[task.agent] || '#8b949e';
    const al = AGENT_LABELS[task.agent] || task.agent;
    const priLabels = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

    // Dispatch status badge
    let dispatchBadge = '';
    if (task.dispatchStatus === 'dispatched') {
      dispatchBadge = '<span class="dispatch-badge dispatched" title="Dispatched to agent">🚀 Dispatched</span>';
    } else if (task.dispatchStatus === 'failed') {
      dispatchBadge = `<span class="dispatch-badge failed" title="${esc(task.dispatchError || 'Dispatch failed')}">❌ Failed</span>`;
    }

    // Dispatch button (only if agent is assigned and not manual)
    let dispatchBtn = '';
    if (task.agent && task.agent !== 'manual') {
      const isRedispatch = task.dispatchStatus === 'dispatched';
      const dispatchTitle = isRedispatch ? 'Re-dispatch to agent' : 'Dispatch to agent';
      dispatchBtn = `<button class="card-action-btn dispatch" title="${dispatchTitle}" data-id="${task.id}"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1v10M4 8l4 4 4-4M2 14h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
    }

    let meta = '';
    if (task.agent || task.skill || dispatchBadge) {
      meta = '<div class="card-meta">';
      if (task.agent) meta += `<span class="card-agent-badge"><span class="card-agent-dot" style="background:${ac}"></span>${esc(al)}</span>`;
      if (task.skill) meta += `<span class="card-skill-badge">${esc(task.skill)}</span>`;
      if (dispatchBadge) meta += dispatchBadge;
      meta += '</div>';
    }
    card.innerHTML = `<div class="card-top"><span class="card-title">${esc(task.title)}</span>
      <div class="card-actions">
        ${dispatchBtn}
        <button class="card-action-btn edit" title="Edit" data-id="${task.id}"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <button class="card-action-btn delete" title="Delete" data-id="${task.id}"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4m2 0v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4h9.34z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      </div></div>
      ${task.description ? `<p class="card-description">${esc(task.description)}</p>` : ''}
      ${meta}
      <div class="card-footer"><span class="priority-badge priority-${task.priority}">${priLabels[task.priority] || task.priority}</span><span class="card-time">${formatTimeAgo(task.updatedAt)}</span></div>`;
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    card.querySelector('.edit').addEventListener('click', e => { e.stopPropagation(); openEditModal(task); });
    card.querySelector('.delete').addEventListener('click', e => { e.stopPropagation(); openDeleteModal(task); });
    const dispatchEl = card.querySelector('.dispatch');
    if (dispatchEl) {
      dispatchEl.addEventListener('click', e => { e.stopPropagation(); handleDispatch(task); });
    }
    return card;
  }

  function renderStats() {
    const total = tasks.length, done = tasks.filter(t => t.column === 'done').length, ip = tasks.filter(t => t.column === 'in-progress').length;
    taskStats.innerHTML = `<span class="stat"><span class="stat-dot" style="background:var(--col-in-progress)"></span>${ip} active</span>
      <span class="stat"><span class="stat-dot" style="background:var(--col-done)"></span>${done}/${total} done</span>`;
  }

  // ── History Rendering ──────────────────────
  function renderHistory() {
    const container = document.getElementById('timeline');
    const countEl = document.getElementById('activity-count');
    countEl.textContent = `${activities.length} events`;

    if (activities.length === 0) {
      container.innerHTML = '<div class="timeline-empty">No activity yet. Create tasks, deploy, or add changelog entries to see history.</div>';
      return;
    }

    container.innerHTML = activities.map(a => {
      const icon = ACTIVITY_ICONS[a.type] || '📌';
      const ac = AGENT_COLORS[a.agent] || '#8b949e';
      const al = AGENT_LABELS[a.agent] || a.agent;
      const agentHtml = a.agent ? `<span class="timeline-agent"><span class="timeline-agent-dot" style="background:${ac}"></span>${esc(al)}</span>` : '';
      const proj = projects.find(p => p.id === a.projectId);
      const projName = proj ? proj.name : '';

      return `<div class="timeline-item type-${a.type}">
        <span class="timeline-icon">${icon}</span>
        <div class="timeline-content">
          <div class="timeline-message">${esc(a.message)}</div>
          <div class="timeline-meta">
            <span>${formatTimeAgo(a.createdAt)}</span>
            ${agentHtml}
            ${projName ? `<span style="color:var(--text-muted)">📦 ${esc(projName)}</span>` : ''}
          </div>
        </div></div>`;
    }).join('');
  }

  // ── Deploys Rendering ──────────────────────
  function renderDeploys() {
    const container = document.getElementById('deploy-list');
    if (deployments.length === 0) {
      container.innerHTML = '<div class="deploy-empty">No deployments yet. Deploy from CLI with: <code>codymaster deploy staging</code></div>';
      return;
    }

    container.innerHTML = deployments.map(d => {
      const proj = projects.find(p => p.id === d.projectId);
      const canRollback = d.status === 'success' && !d.rollbackOf;
      return `<div class="deploy-card ${d.rollbackOf ? 'is-rollback' : ''}">
        <span class="deploy-status-dot ${d.status}"></span>
        <div class="deploy-info">
          <div class="deploy-message">${esc(d.message)}</div>
          <div class="deploy-detail">
            <span class="deploy-env-badge ${d.env}">${d.env}</span>
            <span class="deploy-status-badge ${d.status}">${d.status.replace('_', ' ')}</span>
            ${d.commit ? `<span>🔗 ${esc(d.commit.substring(0, 7))}</span>` : ''}
            ${d.branch ? `<span>🌿 ${esc(d.branch)}</span>` : ''}
            ${proj ? `<span>📦 ${esc(proj.name)}</span>` : ''}
            <span>${formatTimeAgo(d.startedAt)}</span>
          </div>
        </div>
        <div class="deploy-actions">
          ${canRollback ? `<button class="btn-rollback" data-rollback="${d.id}">⏪ Rollback</button>` : ''}
        </div></div>`;
    }).join('');

    container.querySelectorAll('.btn-rollback').forEach(btn => {
      btn.addEventListener('click', async () => {
        const depId = btn.dataset.rollback;
        if (!confirm('Rollback this deployment?')) return;
        try {
          await fetchJSON(`${API}/deployments/${depId}/rollback`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
          });
          await loadAll();
          renderDeploys();
          renderSidebar();
          showToast('success', 'Deployment rolled back');
        } catch (err) { showToast('error', err.message); }
      });
    });
  }

  // ── Changelog Rendering ────────────────────
  function renderChangelog() {
    const container = document.getElementById('changelog-list');
    if (changelog.length === 0) {
      container.innerHTML = '<div class="changelog-empty">No changelog entries yet. Add one with the button above or CLI: <code>codymaster changelog add</code></div>';
      return;
    }

    container.innerHTML = changelog.map(c => {
      const changesHtml = c.changes.length > 0 ? `<ul class="changelog-changes">${c.changes.map(ch => `<li>${esc(ch)}</li>`).join('')}</ul>` : '';
      return `<div class="changelog-entry">
        <div class="changelog-version">
          <span class="changelog-version-badge">${esc(c.version)}</span>
          <span class="changelog-title">${esc(c.title)}</span>
          <span class="changelog-date">${formatTimeAgo(c.createdAt)}</span>
        </div>
        ${changesHtml}
      </div>`;
    }).join('');
  }

  // ── Drag & Drop ────────────────────────────
  function handleDragStart(e) {
    draggedTaskId = e.currentTarget.dataset.taskId;
    // Store the source column for validation
    const sourceTask = tasks.find(t => t.id === draggedTaskId);
    e.currentTarget.dataset.sourceColumn = sourceTask ? sourceTask.column : '';
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedTaskId);
    e.dataTransfer.setData('source-column', sourceTask ? sourceTask.column : '');
    requestAnimationFrame(() => { e.currentTarget.style.opacity = '0.4'; });
  }
  function handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging'); e.currentTarget.style.opacity = '';
    draggedTaskId = null;
    document.querySelectorAll('.column').forEach(c => c.classList.remove('drag-over', 'drag-blocked'));
    document.querySelectorAll('.drop-placeholder').forEach(el => el.remove());
  }

  // Only allow: Backlog → In Progress
  function isDropAllowed(sourceColumn, targetColumn) {
    if (sourceColumn === targetColumn) return true; // Reorder within same column
    if (sourceColumn === 'backlog' && targetColumn === 'in-progress') return true;
    return false;
  }

  Object.keys(columns).forEach(colName => {
    const list = columns[colName];
    const column = list.closest('.column');

    list.addEventListener('dragover', e => {
      e.preventDefault();
      // Check if drop is allowed
      const sourceTask = tasks.find(t => t.id === draggedTaskId);
      const sourceCol = sourceTask ? sourceTask.column : '';
      const allowed = isDropAllowed(sourceCol, colName);

      if (allowed) {
        e.dataTransfer.dropEffect = 'move';
        column.classList.add('drag-over');
        column.classList.remove('drag-blocked');
        if (!list.querySelector('.drop-placeholder')) { const ph = document.createElement('div'); ph.className = 'drop-placeholder'; list.appendChild(ph); }
        const after = getDragAfterElement(list, e.clientY);
        const ph = list.querySelector('.drop-placeholder');
        if (after) list.insertBefore(ph, after); else list.appendChild(ph);
      } else {
        e.dataTransfer.dropEffect = 'none';
        column.classList.add('drag-blocked');
        column.classList.remove('drag-over');
      }
    });

    list.addEventListener('dragleave', e => {
      if (!column.contains(e.relatedTarget)) {
        column.classList.remove('drag-over', 'drag-blocked');
        const ph = list.querySelector('.drop-placeholder'); if (ph) ph.remove();
      }
    });

    list.addEventListener('drop', async e => {
      e.preventDefault(); column.classList.remove('drag-over', 'drag-blocked');
      const ph = list.querySelector('.drop-placeholder');
      // Save taskId locally — handleDragEnd will null draggedTaskId before async completes
      const taskId = draggedTaskId;
      if (!taskId) return;

      // Validate drop
      const sourceTask = tasks.find(t => t.id === taskId);
      const sourceCol = sourceTask ? sourceTask.column : '';
      if (!isDropAllowed(sourceCol, colName)) {
        if (ph) ph.remove();
        showToast('error', 'Chỉ cho phép kéo từ Backlog → In Progress');
        return;
      }

      let newOrder = 0;
      if (ph) {
        newOrder = [...list.children].slice(0, [...list.children].indexOf(ph)).filter(el => el.classList.contains('task-card') && el.dataset.taskId !== taskId).length;
        ph.remove();
      }

      const isMovingToInProgress = sourceCol === 'backlog' && colName === 'in-progress';

      try {
        await fetchJSON(`${API}/tasks/${taskId}/move`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ column: colName, order: newOrder }) });
        await loadAll(); renderBoard(); renderSidebar();

        if (isMovingToInProgress) {
          // Auto-dispatch if task has an agent assigned
          const movedTask = tasks.find(t => t.id === taskId);
          if (movedTask && movedTask.agent && movedTask.agent !== 'manual') {
            showToast('info', '⚡ Starting dispatch...');
            try {
              const forceParam = movedTask.dispatchStatus === 'dispatched' ? '?force=true' : '';
              await fetchJSON(`${API}/tasks/${taskId}/dispatch${forceParam}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
              });
              await loadAll(); renderBoard(); renderSidebar();
              const agentLabel = AGENT_LABELS[movedTask.agent] || movedTask.agent;
              showToast('success', `🚀 Dispatched to ${agentLabel}!`);
            } catch (dispatchErr) {
              showToast('error', 'Dispatch failed: ' + dispatchErr.message);
            }
          } else if (movedTask && !movedTask.agent) {
            showToast('success', 'Task moved to In Progress (no agent assigned — dispatch skipped)');
          } else {
            showToast('success', 'Task moved to In Progress');
          }
        } else {
          showToast('success', 'Task reordered');
        }
      } catch (err) { showToast('error', err.message); }
    });
  });

  function getDragAfterElement(list, y) {
    const cards = [...list.querySelectorAll('.task-card:not(.dragging)')];
    let closest = null, closestOffset = Number.NEGATIVE_INFINITY;
    cards.forEach(card => { const box = card.getBoundingClientRect(); const offset = y - box.top - box.height / 2; if (offset < 0 && offset > closestOffset) { closestOffset = offset; closest = card; } });
    return closest;
  }

  // ── Task Modal ─────────────────────────────
  function openAddModal() {
    modalTitle.textContent = 'New Task'; btnSubmit.textContent = 'Create Task';
    formId.value = ''; taskForm.reset();
    formPriority.value = 'medium'; formColumn.value = 'backlog'; formAgent.value = ''; formSkill.value = '';
    modalOverlay.classList.add('active');
    setTimeout(() => formTitle.focus(), 200);
  }
  function openEditModal(task) {
    modalTitle.textContent = 'Edit Task'; btnSubmit.textContent = 'Save Changes';
    formId.value = task.id; formTitle.value = task.title; formDescription.value = task.description;
    formPriority.value = task.priority; formColumn.value = task.column;
    formAgent.value = task.agent || ''; formSkill.value = task.skill || '';
    modalOverlay.classList.add('active');
    setTimeout(() => formTitle.focus(), 200);
  }
  function closeModal() { modalOverlay.classList.remove('active'); }

  // ── Project Modal ──────────────────────────
  function openProjectModal() { projectForm.reset(); projectModalOverlay.classList.add('active'); setTimeout(() => projectNameInput.focus(), 200); }
  function closeProjectModal() { projectModalOverlay.classList.remove('active'); }

  // ── Deploy Modal ───────────────────────────
  function openDeployModal() { deployForm.reset(); document.getElementById('deploy-branch').value = 'main'; deployModalOverlay.classList.add('active'); }
  function closeDeployModal() { deployModalOverlay.classList.remove('active'); }

  // ── Changelog Modal ────────────────────────
  function openChangelogModal() { changelogForm.reset(); changelogModalOverlay.classList.add('active'); }
  function closeChangelogModal() { changelogModalOverlay.classList.remove('active'); }

  // ── Delete Modal ───────────────────────────
  let deleteTaskId = null;
  function openDeleteModal(task) { deleteTaskId = task.id; deleteTaskName.textContent = task.title; deleteOverlay.classList.add('active'); }
  function closeDeleteModal() { deleteOverlay.classList.remove('active'); deleteTaskId = null; }

  // ── Event Handlers ─────────────────────────
  document.getElementById('btn-add-task').addEventListener('click', openAddModal);
  document.getElementById('btn-add-project').addEventListener('click', openProjectModal);
  document.getElementById('btn-new-deploy').addEventListener('click', openDeployModal);
  document.getElementById('btn-new-changelog').addEventListener('click', openChangelogModal);
  refreshBtn.addEventListener('click', refreshData);
  document.getElementById('sidebar-toggle').addEventListener('click', () => sidebar.classList.toggle('collapsed'));

  // Theme toggle
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const current = getEffectiveTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });

  // Close modals
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('btn-cancel').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
  document.getElementById('project-modal-close').addEventListener('click', closeProjectModal);
  document.getElementById('project-cancel').addEventListener('click', closeProjectModal);
  projectModalOverlay.addEventListener('click', e => { if (e.target === projectModalOverlay) closeProjectModal(); });
  document.getElementById('deploy-modal-close').addEventListener('click', closeDeployModal);
  document.getElementById('deploy-cancel').addEventListener('click', closeDeployModal);
  deployModalOverlay.addEventListener('click', e => { if (e.target === deployModalOverlay) closeDeployModal(); });
  document.getElementById('changelog-modal-close').addEventListener('click', closeChangelogModal);
  document.getElementById('cl-cancel').addEventListener('click', closeChangelogModal);
  changelogModalOverlay.addEventListener('click', e => { if (e.target === changelogModalOverlay) closeChangelogModal(); });
  document.getElementById('delete-close').addEventListener('click', closeDeleteModal);
  document.getElementById('delete-cancel').addEventListener('click', closeDeleteModal);
  deleteOverlay.addEventListener('click', e => { if (e.target === deleteOverlay) closeDeleteModal(); });

  // Delete confirm
  deleteConfirm.addEventListener('click', async () => {
    if (!deleteTaskId) return;
    try {
      await fetchJSON(`${API}/tasks/${deleteTaskId}`, { method: 'DELETE' });
      tasks = tasks.filter(t => t.id !== deleteTaskId);
      renderBoard(); renderSidebar(); closeDeleteModal();
      showToast('success', 'Task deleted');
    } catch (err) { showToast('error', err.message); }
  });

  // Task form submit
  taskForm.addEventListener('submit', async e => {
    e.preventDefault();
    const title = formTitle.value.trim(); if (!title) return;
    const data = {
      title, description: formDescription.value.trim(),
      priority: formPriority.value, column: formColumn.value,
      agent: formAgent.value, skill: formSkill.value,
      projectId: selectedProjectId || undefined,
    };
    try {
      if (formId.value) {
        await fetchJSON(`${API}/tasks/${formId.value}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const et = tasks.find(t => t.id === formId.value);
        if (et && et.column !== data.column) {
          await fetchJSON(`${API}/tasks/${formId.value}/move`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ column: data.column, order: 0 }) });
        }
        showToast('success', 'Task updated');
      } else {
        await fetchJSON(`${API}/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        showToast('success', 'Task created');
      }
      await loadAll(); renderBoard(); renderSidebar(); closeModal();
    } catch (err) { showToast('error', err.message); }
  });

  // Project form submit
  projectForm.addEventListener('submit', async e => {
    e.preventDefault();
    const name = projectNameInput.value.trim(); if (!name) return;
    try {
      await fetchJSON(`${API}/projects`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, path: projectPathInput.value.trim() }) });
      await loadAll(); renderSidebar(); closeProjectModal();
      showToast('success', 'Project created');
    } catch (err) { showToast('error', err.message); }
  });

  // Deploy form submit
  deployForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (!selectedProjectId && projects.length === 0) { showToast('error', 'Create a project first'); return; }
    const pid = selectedProjectId || (projects.length > 0 ? projects[0].id : '');
    try {
      await fetchJSON(`${API}/deployments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: pid, env: document.getElementById('deploy-env').value,
          message: document.getElementById('deploy-message').value.trim() || `Deploy to ${document.getElementById('deploy-env').value}`,
          commit: document.getElementById('deploy-commit').value.trim(),
          branch: document.getElementById('deploy-branch').value.trim() || 'main',
        }),
      });
      await loadAll(); renderDeploys(); renderSidebar(); closeDeployModal();
      showToast('success', 'Deployment recorded');
    } catch (err) { showToast('error', err.message); }
  });

  // Changelog form submit
  changelogForm.addEventListener('submit', async e => {
    e.preventDefault();
    const version = document.getElementById('cl-version').value.trim();
    const title = document.getElementById('cl-title').value.trim();
    if (!version || !title) return;
    const changes = document.getElementById('cl-changes').value.split('\n').map(l => l.trim()).filter(Boolean);
    const pid = selectedProjectId || (projects.length > 0 ? projects[0].id : '');
    try {
      await fetchJSON(`${API}/changelog`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: pid, version, title, changes }),
      });
      await loadAll(); renderChangelog(); closeChangelogModal();
      showToast('success', 'Changelog entry added');
    } catch (err) { showToast('error', err.message); }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); closeProjectModal(); closeDeployModal(); closeChangelogModal(); closeDeleteModal(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); openAddModal(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'r' && !e.shiftKey) { e.preventDefault(); refreshData(); }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 't' || e.key === 'T')) {
      e.preventDefault();
      const current = getEffectiveTheme();
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
    }
  });

  // ── Toast System ───────────────────────────
  function showToast(type, message) {
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || '📌'}</span><span>${esc(message)}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => { toast.classList.add('toast-out'); toast.addEventListener('animationend', () => toast.remove()); }, 2800);
  }

  // ── Utilities ──────────────────────────────
  function esc(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
  function formatTimeAgo(dateStr) {
    const ms = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(ms / 60000), h = Math.floor(ms / 3600000), d = Math.floor(ms / 86400000);
    if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`; if (h < 24) return `${h}h ago`;
    if (d < 7) return `${d}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // ── Dispatch Handler ────────────────────────
  async function handleDispatch(task) {
    const isRedispatch = task.dispatchStatus === 'dispatched';
    if (isRedispatch) {
      if (!confirm(`Task "${task.title}" was already dispatched. Re-dispatch?`)) return;
    }
    const forceParam = isRedispatch ? '?force=true' : '';
    try {
      const result = await fetchJSON(`${API}/tasks/${task.id}/dispatch${forceParam}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
      });
      await loadAll(); renderBoard(); renderSidebar();
      const agentLabel = AGENT_LABELS[task.agent] || task.agent;
      showToast('success', `🚀 Dispatched to ${agentLabel}`);
    } catch (err) {
      showToast('error', 'Dispatch failed: ' + err.message);
    }
  }

  // ── Init ───────────────────────────────────
  async function init() {
    try { await loadAll(); renderSidebar(); renderCurrentTab(); }
    catch (err) { showToast('error', 'Failed to load: ' + err.message); }
  }
  init();
})();
