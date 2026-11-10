// Feedback update: clearer assistant identity, optional assistant name, and a live-data dashboard.
moduleInfo.dashboard[0] = 'Today';
moduleInfo.dashboard[1] = '';

const renderOnboardingBeforeFeedback = renderOnboarding;
renderOnboarding = function () {
  renderOnboardingBeforeFeedback();
  if (state.step === 1) {
    const label = document.querySelector('label[for="profileName"] .optional');
    if (label) label.textContent = 'OPTIONAL';
  }
};

// This runs before the existing click handler so an empty name advances without an error toast.
document.addEventListener('click', event => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action !== 'profile-next') return;

  const name = document.querySelector('#profileName');
  state.profile.name = name.value.trim() || 'Assistant';
  state.profile.email = document.querySelector('#profileEmail').value.trim();
  state.profile.timezone = document.querySelector('#profileTimezone').value;
  state.step = 2;
  event.preventDefault();
  event.stopImmediatePropagation();
  render();
  window.scrollTo(0, 0);
}, true);

function dashboardDate() {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: state.profile.timezone || undefined
  });
}

function taskDateStatus(task, today = dashboardDate()) {
  const dueDate = String(task.due || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || task.status === 'Completed') return 'later';
  if (dueDate < today) return 'overdue';
  return dueDate === today ? 'today' : 'later';
}

function dashboardPanel(title, items, emptyMessage, action, actionLabel) {
  return `<section class="workflow-panel dashboard-panel">
    <div class="panel-head"><h2>${title}</h2><span>${items.length ? `${items.length} item${items.length === 1 ? '' : 's'}` : ''}</span></div>
    ${items.length ? items.join('') : `<div class="dashboard-empty"><span class="empty-mini-icon">✓</span><b>${emptyMessage}</b>${action ? `<button class="button-text" data-action="${action}">${actionLabel}</button>` : ''}</div>`}
  </section>`;
}

function renderDashboard() {
  const tasks = scoped(state.tasks);
  const openTasks = tasks.filter(task => !['Completed', 'Cancelled'].includes(task.status));
  const waiting = openTasks.filter(task => ['Waiting for Client', 'Waiting for Approval'].includes(task.status)).length;
  const pendingApprovals = scoped(state.approvals).filter(item => item.status === 'Pending').length;
  const clients = state.activeClient === 'all'
    ? state.clients
    : state.clients.filter(client => client.id === state.activeClient);
  const hasClient = clients.length > 0;
  const needsDecision = waiting + pendingApprovals;
  const currentStep = !hasClient ? 0 : openTasks.length ? 2 : 1;
  const taskWord = openTasks.length === 1 ? 'task' : 'tasks';
  const title = !hasClient
    ? 'Start with one client'
    : openTasks.length
      ? 'Your next steps, clearly in view'
      : 'Capture your first request';
  const description = !hasClient
    ? 'Create a private workspace for a client. Then capture a request and review the next step before it is added.'
    : openTasks.length
      ? `You have ${openTasks.length} open ${taskWord}. Review each task and update its status as the work moves.`
      : 'Choose a client, capture what they need, and review the task before it enters your list.';

  return `
    <section class="dashboard-summary" aria-label="Workspace overview">
      <div class="summary-stat"><span>Active clients</span><strong>${clients.length}</strong></div>
      <div class="summary-stat"><span>Open tasks</span><strong>${openTasks.length}</strong></div>
      <div class="summary-stat"><span>Needs a decision</span><strong>${needsDecision}</strong></div>
    </section>
    <section class="dashboard-start">
      <div class="dashboard-start-copy">
        <div class="dashboard-kicker">${hasClient ? 'YOUR WORKSPACE' : 'A SIMPLE PLACE TO START'}</div>
        <h2>${title}</h2>
        <p>${description}</p>
        ${openTasks.length
          ? `<button class="button button-primary" data-view="tasks">Review open tasks <span class="button-arrow">→</span></button>`
          : `<button class="button button-primary" data-action="${hasClient ? 'capture' : 'new-client'}">${hasClient ? 'Capture a request' : 'Add your first client'} <span class="button-arrow">→</span></button>`}
      </div>
      <div class="dashboard-flow" aria-label="How the workflow works">
        <div class="flow-step ${currentStep === 0 ? 'is-current' : hasClient ? 'is-complete' : ''}">
          <span class="flow-number">01</span>
          <span><b>${hasClient ? 'Choose a client' : 'Add a client'}</b><small>Keep each workspace separate</small></span>
        </div>
        <div class="flow-step ${currentStep === 1 ? 'is-current' : openTasks.length ? 'is-complete' : ''}">
          <span class="flow-number">02</span>
          <span><b>Capture a request</b><small>Record what they need</small></span>
        </div>
        <div class="flow-step ${currentStep === 2 ? 'is-current' : ''}">
          <span class="flow-number">03</span>
          <span><b>Review the next step</b><small>Confirm before it is added</small></span>
        </div>
      </div>
    </section>
    ${openTasks.length
      ? `<section class="dashboard-next"><div class="dashboard-section-heading"><h2>Next steps</h2><button class="button-text" data-view="tasks">View all tasks</button></div>${openTasks.slice(0, 3).map(taskRow).join('')}</section>`
      : ''}
  `;
}
const renderWorkspaceBeforeFeedback = renderWorkspace;
renderWorkspace = function () {
  renderWorkspaceBeforeFeedback();
  const sidebarLabel = document.querySelector('.workspace-name');
  if (sidebarLabel) sidebarLabel.innerHTML = `ASSISTANT WORKSPACE <span>${state.clients.length} ACTIVE</span>`;
  document.querySelector('.main-heading p')?.remove();
};

state.theme = 'light';
const renderWorkspaceBeforeTools = renderWorkspace;
renderWorkspace = function () {
  renderWorkspaceBeforeTools();
  const mobileCreate = document.querySelector('.mobile-bottom [data-action="new-task"]');
  if (mobileCreate) mobileCreate.dataset.action = 'quick-create';
  const header = document.querySelector('.header-right');
  if (header) {
    header.insertAdjacentHTML('afterbegin', `
      <button class="top-tool" data-action="open-search" aria-label="Search workspace"><span class="top-tool-icon">⌕</span><span class="top-tool-label">Search</span><span class="shortcut">Ctrl K</span></button>
      <button class="top-tool" data-action="quick-create" aria-label="Quick create"><span class="top-tool-icon">＋</span><span class="top-tool-label">Create</span></button>
      <button class="top-tool" data-action="toggle-theme" aria-label="Switch color theme" title="Switch color theme"><span class="top-tool-icon theme-icon">◐</span></button>`);
  }
  applyTheme();
};

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  const button = document.querySelector('[data-action="toggle-theme"]');
  if (button) {
    const dark = state.theme === 'dark';
    button.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
    button.title = `Switch to ${dark ? 'light' : 'dark'} theme`;
    button.querySelector('.theme-icon').textContent = dark ? '☼' : '◐';
  }
}

function searchDialog() {
  return `<button class="modal-close" data-action="close-modal" aria-label="Close">×</button>
    <h2>Search your workspace</h2><p>Find a client, task, message, approval or invoice.</p>
    <div class="search-field-wrap"><span class="search-glyph">⌕</span><input class="input" id="workspaceSearch" type="search" autocomplete="off" placeholder="Start typing…" aria-label="Search workspace"></div>
    <div class="search-results" id="searchResults"><div class="search-empty">Search only includes records added in this preview.</div></div>`;
}

function quickCreateDialog() {
  const actions = [['capture','▤','Capture a message'],['new-task','☑','Create a task'],['new-event','◷','Add an appointment'],['new-approval','✓','Request approval'],['new-expense','＄','Add an expense'],['new-reminder','♧','Create a reminder']];
  return `<button class="modal-close" data-action="close-modal" aria-label="Close">×</button><h2>Quick create</h2><p>Choose what you want to add to this workspace.</p><div class="quick-create-grid">${actions.map(([action,icon,label])=>`<button class="button button-secondary" data-action="${action}"><span>${icon}</span>${label}</button>`).join('')}</div>`;
}

function findWorkspaceMatches(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const matches = [];
  for (const client of state.clients) if (client.name.toLowerCase().includes(q)) matches.push({title:client.name,detail:'Client workspace',view:'clients',clientId:client.id});
  for (const task of state.tasks) if (task.title.toLowerCase().includes(q)) matches.push({title:task.title,detail:`Task · ${clientById(task.clientId)?.name||'Client'} · ${task.status}`,view:'tasks',clientId:task.clientId});
  for (const message of state.messages) if (message.text.toLowerCase().includes(q)) matches.push({title:message.text.slice(0,64),detail:`Message · ${clientById(message.clientId)?.name||'Client'} · ${message.channel}`,view:'inbox',clientId:message.clientId});
  for (const approval of state.approvals) if (approval.title.toLowerCase().includes(q)) matches.push({title:approval.title,detail:`Approval · ${clientById(approval.clientId)?.name||'Client'} · ${approval.status}`,view:'approvals',clientId:approval.clientId});
  for (const invoice of state.invoices) if (invoice.title.toLowerCase().includes(q)) matches.push({title:invoice.title,detail:`Invoice · ${clientById(invoice.clientId)?.name||'Client'} · ${invoice.status}`,view:'invoices',clientId:invoice.clientId});
  return matches.slice(0,8);
}

document.addEventListener('click', event => {
  const result = event.target.closest('[data-search-view]');
  if (result) {
    state.view = result.dataset.searchView;
    if (result.dataset.clientId) state.activeClient = result.dataset.clientId;
    state.modal = '';
    document.querySelector('.modal-backdrop')?.remove();
    state.screen = 'workspace';
    render();
    return;
  }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'toggle-theme') {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme();
    toast(`${state.theme === 'dark' ? 'Dark' : 'Light'} theme for this preview.`);
  } else if (action === 'open-search') {
    showModal(searchDialog());
    document.querySelector('#workspaceSearch')?.focus();
  } else if (action === 'quick-create') {
    showModal(quickCreateDialog());
  }
});

document.addEventListener('input', event => {
  if (event.target.id !== 'workspaceSearch') return;
  const matches = findWorkspaceMatches(event.target.value);
  const target = document.querySelector('#searchResults');
  if (!target) return;
  target.innerHTML = matches.length ? matches.map(match => `
    <button class="search-result" data-search-view="${match.view}" data-client-id="${match.clientId}">
      <span class="search-result-dot">${clientMark(match.clientId)}</span><span><b>${esc(match.title)}</b><small>${esc(match.detail)}</small></span>
    </button>`).join('') : `<div class="search-empty">${event.target.value.trim() ? 'No matching records in this preview.' : 'Type to search the records you added.'}</div>`;
});

document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    event.stopImmediatePropagation();
    showModal(searchDialog());
    document.querySelector('#workspaceSearch')?.focus();
  }
}, true);

document.addEventListener('click', event => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action !== 'new-task') return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (!state.clients.length) {
    showModal(`<button class="modal-close" data-action="close-modal" aria-label="Close">×</button><h2>Add a client first</h2><p>Tasks belong to one private client workspace. Add a client before creating a task.</p><button class="button button-primary button-full" data-action="new-client">Add a client</button>`);
    return;
  }
  showModal(taskForm());
  const priority = document.querySelector('#taskPriority');
  if (priority) priority.value = 'Normal';
}, true);

document.addEventListener('click', event => {
  const action = event.target.closest('.onboard [data-action]')?.dataset.action;
  if (!['start', 'explore', 'client-next', 'email-next', 'skip-email', 'back', 'enter-workspace'].includes(action)) return;
  requestAnimationFrame(() => window.scrollTo(0, 0));
}, true);
