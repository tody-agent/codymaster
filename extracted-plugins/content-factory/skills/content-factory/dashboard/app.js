/**
 * Content Factory Dashboard — Client Application
 * SSE connection with fallback to polling. Real-time UI updates.
 * Collapsible log, actionable errors, settings dialog.
 */

(function () {
    'use strict';

    // ─── Config ───
    const API_BASE = '';
    const POLL_INTERVAL = 2000;
    const SSE_RECONNECT_DELAY = 3000;

    // ─── State ───
    let currentState = null;
    let eventSource = null;
    let pollTimer = null;
    let activeLogFilter = 'all';
    let activeTaskFilter = 'all';
    let allEvents = [];
    let unseenLogCount = 0;

    // ─── DOM Cache ───
    const $ = (id) => document.getElementById(id);
    const $$ = (sel) => document.querySelectorAll(sel);

    // ─── Init ───
    document.addEventListener('DOMContentLoaded', () => {
        setupFilters();
        setupSettings();
        setupLogToggle();
        updateClock();
        setInterval(updateClock, 1000);
        connectSSE();
        fetchLogs();
    });

    // ─── SSE Connection ───
    function connectSSE() {
        setConnectionStatus('connecting');

        try {
            eventSource = new EventSource(`${API_BASE}/api/events`);

            eventSource.addEventListener('state', (e) => {
                try {
                    const data = JSON.parse(e.data);
                    currentState = data;
                    renderAll(data);
                    setConnectionStatus('connected');
                } catch (err) {
                    console.error('SSE parse error:', err);
                }
            });

            eventSource.onopen = () => {
                setConnectionStatus('connected');
            };

            eventSource.onerror = () => {
                setConnectionStatus('disconnected');
                eventSource.close();
                startPolling();
                setTimeout(connectSSE, SSE_RECONNECT_DELAY);
            };
        } catch (e) {
            startPolling();
        }
    }

    function startPolling() {
        if (pollTimer) return;
        pollTimer = setInterval(async () => {
            try {
                const res = await fetch(`${API_BASE}/api/state`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.status !== 'no_data') {
                        currentState = data;
                        renderAll(data);
                        setConnectionStatus('connected');
                    }
                }
            } catch { /* ignore */ }
        }, POLL_INTERVAL);
    }

    async function fetchLogs() {
        try {
            const res = await fetch(`${API_BASE}/api/logs`);
            if (res.ok) {
                const newEvents = await res.json();
                // Track unseen events when log is collapsed
                const logSection = $('logSection');
                if (logSection && !logSection.open && newEvents.length > allEvents.length) {
                    unseenLogCount += newEvents.length - allEvents.length;
                    updateLogBadge();
                }
                allEvents = newEvents;
                renderLogs(allEvents);

                // Auto-expand on error
                const hasError = newEvents.some(e => e.level === 'error');
                if (hasError && logSection && !logSection.open) {
                    logSection.open = true;
                    unseenLogCount = 0;
                    updateLogBadge();
                }
            }
        } catch { /* ignore */ }

        setTimeout(fetchLogs, POLL_INTERVAL * 2);
    }

    // ─── Render All ───
    function renderAll(state) {
        renderStatusBar(state);
        renderPipeline(state.pipeline);
        renderTasks(state.tasks || []);
        renderTokens(state.tokens || {});
        renderErrors(state.errors || []);
    }

    // ─── Status Bar ───
    function renderStatusBar(state) {
        const statusMap = {
            idle: 'Idle',
            running: 'Running',
            completed: 'Completed',
            error: 'Error',
        };

        setText('pipelineStatus', statusMap[state.status] || state.status);
        const stats = state.stats || {};
        setText('articlesCount', `${stats.articles_written || 0} / ${stats.articles_total || 0}`);
        setText('totalCost', `$${(state.tokens?.total_cost_usd || 0).toFixed(4)}`);
        setText('agentCount', (state.agents || []).length);

        const statusEl = $('pipelineStatus');
        if (statusEl) {
            statusEl.style.color = '';
            if (state.status === 'running') statusEl.style.color = 'var(--status-running)';
            else if (state.status === 'completed') statusEl.style.color = 'var(--status-done)';
            else if (state.status === 'error') statusEl.style.color = 'var(--status-failed)';
        }
    }

    // ─── Pipeline ───
    function renderPipeline(pipeline) {
        if (!pipeline?.phases) return;

        const phases = ['extract', 'plan', 'write', 'audit', 'seo', 'publish'];
        phases.forEach((phase) => {
            const node = document.querySelector(`.phase-node[data-phase="${phase}"]`);
            if (!node) return;

            const data = pipeline.phases[phase] || {};
            node.setAttribute('data-status', data.status || 'pending');

            const fill = node.querySelector('.phase-progress-fill');
            if (fill) {
                const pct = (data.progress || 0) * 100;
                fill.style.width = `${pct}%`;
            }
        });
    }

    // ─── Tasks ───
    function renderTasks(tasks) {
        const container = $('taskList');
        if (!container) return;

        const filtered = activeTaskFilter === 'all'
            ? tasks
            : tasks.filter((t) => t.status === activeTaskFilter);

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="1.5" opacity="0.3">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <path d="M3 9h18"/><path d="M9 21V9"/>
                    </svg>
                    <p>No ${activeTaskFilter === 'all' ? '' : activeTaskFilter + ' '}tasks${activeTaskFilter === 'all' ? '. Start a pipeline to see tasks here.' : '.'}</p>
                </div>`;
            return;
        }

        const sorted = [...filtered].reverse().slice(0, 50);
        container.innerHTML = sorted.map((task) => {
            const time = task.updated_at ? formatTime(task.updated_at) : '';
            const meta = task.meta?.topic ? ` — ${task.meta.topic}` : '';
            return `
                <div class="task-item">
                    <span class="task-status-dot ${task.status}"></span>
                    <span class="task-id">${escapeHtml(task.id)}${escapeHtml(meta)}</span>
                    <span class="task-time">${time}</span>
                </div>`;
        }).join('');
    }

    // ─── Tokens ───
    function renderTokens(tokens) {
        setText('inputTokens', formatNumber(tokens.total_input || 0));
        setText('outputTokens', formatNumber(tokens.total_output || 0));
        setText('tokenCost', `$${(tokens.total_cost_usd || 0).toFixed(4)}`);

        const budgetSection = $('budgetSection');
        if (budgetSection) {
            if (tokens.budget_limit_usd) {
                budgetSection.style.display = 'block';
                const spent = tokens.total_cost_usd || 0;
                const limit = tokens.budget_limit_usd;
                const pct = Math.min(100, (spent / limit) * 100);
                setText('budgetText', `$${spent.toFixed(4)} / $${limit.toFixed(2)}`);
                const fill = $('budgetFill');
                if (fill) {
                    fill.style.width = `${pct}%`;
                    fill.className = `budget-fill${pct > 80 ? ' warning' : ''}`;
                }
            } else {
                budgetSection.style.display = 'none';
            }
        }

        // Providers
        const providerList = $('providerList');
        if (!providerList) return;

        const providers = tokens.providers || {};
        const entries = Object.entries(providers);
        if (entries.length === 0) {
            providerList.innerHTML = '';
            return;
        }
        providerList.innerHTML = entries.map(([name, data]) => `
            <div class="provider-item">
                <span class="provider-name">${escapeHtml(name)}</span>
                <span class="provider-stats">${data.requests} req · $${data.cost_usd.toFixed(4)} · ${data.failures || 0} fail</span>
            </div>
        `).join('');
    }

    // ─── Logs ───
    function renderLogs(events) {
        const container = $('logViewer');
        if (!container) return;

        const filtered = activeLogFilter === 'all'
            ? events
            : events.filter((e) => e.level === activeLogFilter);

        if (filtered.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No events to show.</p></div>';
            return;
        }

        const recent = filtered.slice(-150);
        container.innerHTML = recent.map((e) => {
            const time = e.ts ? e.ts.slice(11, 19) : '';
            const lvl = (e.level || 'info').toLowerCase();
            return `
                <div class="log-entry">
                    <span class="log-time">${time}</span>
                    <span class="log-level ${lvl}">${lvl.toUpperCase().padEnd(5)}</span>
                    <span class="log-msg">${escapeHtml(e.msg || '')}</span>
                </div>`;
        }).join('');

        container.scrollTop = container.scrollHeight;
    }

    // ─── Errors — Actionable ───
    function classifyError(error) {
        const msg = (error.message || '').toLowerCase();
        const source = (error.source || '').toLowerCase();
        const combined = `${msg} ${source}`;

        if (/token|limit|quota|budget|exceeded|rate.?limit/.test(combined)) {
            return {
                action: 'Add Token',
                actionType: 'token',
                icon: '🔑',
            };
        }
        if (/api|service|provider|connection|timeout|network|refused|unreachable/.test(combined)) {
            return {
                action: 'Change Service',
                actionType: 'service',
                icon: '🔄',
            };
        }
        if (/model|capability|context.?length|not.?found|deprecated|unsupported/.test(combined)) {
            return {
                action: 'Switch Model',
                actionType: 'model',
                icon: '🤖',
            };
        }
        return {
            action: 'View Details',
            actionType: 'details',
            icon: '📋',
        };
    }

    function handleErrorAction(actionType) {
        const dialog = $('settingsDialog');
        if (!dialog) return;

        dialog.showModal();

        // Focus relevant field based on error type
        requestAnimationFrame(() => {
            switch (actionType) {
                case 'token':
                    const tokenInput = $('settingToken');
                    if (tokenInput) tokenInput.focus();
                    break;
                case 'service':
                    const serviceSelect = $('settingService');
                    if (serviceSelect) serviceSelect.focus();
                    break;
                case 'model':
                    const modelSelect = $('settingModel');
                    if (modelSelect) modelSelect.focus();
                    break;
                case 'details':
                    // Open log section
                    const logSection = $('logSection');
                    if (logSection) logSection.open = true;
                    dialog.close();
                    break;
            }
        });
    }

    function renderErrors(errors) {
        const section = $('errorSection');
        const list = $('errorList');
        if (!section || !list) return;

        if (errors.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        list.innerHTML = errors.slice(-10).reverse().map((err) => {
            const classified = classifyError(err);
            const time = err.timestamp ? formatTime(err.timestamp) : '';

            return `
                <div class="error-item">
                    <div class="error-top">
                        <span class="error-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="15" y1="9" x2="9" y2="15"/>
                                <line x1="9" y1="9" x2="15" y2="15"/>
                            </svg>
                        </span>
                        <div class="error-content">
                            <div class="error-source">${escapeHtml(err.source || 'unknown')}</div>
                            <div class="error-message">${escapeHtml(err.message || '')}</div>
                        </div>
                        <span class="error-time">${time}</span>
                    </div>
                    <div class="error-actions">
                        <button class="error-action-btn primary" data-action="${classified.actionType}"
                            aria-label="${classified.action}">
                            ${classified.action}
                        </button>
                        <button class="error-action-btn secondary" data-action="details"
                            aria-label="View log">
                            View Log
                        </button>
                    </div>
                </div>`;
        }).join('');

        // Attach event listeners to action buttons
        list.querySelectorAll('.error-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                handleErrorAction(btn.dataset.action);
            });
        });
    }

    // ─── Log Toggle ───
    function setupLogToggle() {
        const logSection = $('logSection');
        if (!logSection) return;

        logSection.addEventListener('toggle', () => {
            if (logSection.open) {
                unseenLogCount = 0;
                updateLogBadge();
            }
        });
    }

    function updateLogBadge() {
        const badge = $('logBadge');
        if (!badge) return;

        if (unseenLogCount > 0) {
            badge.textContent = unseenLogCount > 99 ? '99+' : unseenLogCount;
            badge.hidden = false;
        } else {
            badge.hidden = true;
        }
    }

    // ─── Settings Dialog ───
    function setupSettings() {
        const dialog = $('settingsDialog');
        const openBtn = $('settingsBtn');
        const closeBtn = $('settingsClose');
        const cancelBtn = $('settingsCancel');
        const saveBtn = $('settingsSave');
        const toggleVisBtn = $('toggleTokenVisibility');

        if (!dialog) return;

        // Open
        if (openBtn) {
            openBtn.addEventListener('click', () => {
                dialog.showModal();
            });
        }

        // Close
        const closeDialog = () => dialog.close();
        if (closeBtn) closeBtn.addEventListener('click', closeDialog);
        if (cancelBtn) cancelBtn.addEventListener('click', closeDialog);

        // Click backdrop to close
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) closeDialog();
        });

        // Toggle token visibility
        if (toggleVisBtn) {
            toggleVisBtn.addEventListener('click', () => {
                const input = $('settingToken');
                if (!input) return;
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                toggleVisBtn.setAttribute('aria-label', isPassword ? 'Hide token' : 'Show token');
            });
        }

        // Save (dispatch custom event for future backend integration)
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const settings = {
                    service: $('settingService')?.value,
                    model: $('settingModel')?.value,
                    token: $('settingToken')?.value,
                    budget: parseFloat($('settingBudget')?.value) || null,
                };

                // Dispatch custom event
                window.dispatchEvent(new CustomEvent('cf:settings-update', {
                    detail: settings,
                }));

                console.log('[Dashboard] Settings updated:', {
                    ...settings,
                    token: settings.token ? '***' : null,
                });

                dialog.close();
            });
        }
    }

    // ─── Filters ───
    function setupFilters() {
        // Task filters
        $$('.task-filters .filter-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                $$('.task-filters .filter-btn').forEach((b) => {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');
                activeTaskFilter = btn.dataset.filter;
                if (currentState) renderTasks(currentState.tasks || []);
            });
        });

        // Log filters — stop propagation to prevent details toggle
        $$('.log-filters .filter-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                $$('.log-filters .filter-btn').forEach((b) => {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');
                activeLogFilter = btn.dataset.level;
                renderLogs(allEvents);
            });
        });
    }

    // ─── Connection Status ───
    function setConnectionStatus(status) {
        const el = $('connectionStatus');
        if (!el) return;
        el.className = `connection-status ${status}`;
        const text = el.querySelector('.status-text');
        const labels = { connecting: 'Connecting...', connected: 'Connected', disconnected: 'Reconnecting...' };
        if (text) text.textContent = labels[status] || status;
    }

    // ─── Clock ───
    function updateClock() {
        const now = new Date();
        setText('headerTime', now.toLocaleTimeString('en-US', { hour12: false }));
        setText('footerTime', now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }));
    }

    // ─── Helpers ───
    function setText(id, value) {
        const el = $(id);
        if (el) el.textContent = value;
    }

    function formatNumber(n) {
        return n.toLocaleString('en-US');
    }

    function formatTime(isoStr) {
        try {
            return new Date(isoStr).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
})();
