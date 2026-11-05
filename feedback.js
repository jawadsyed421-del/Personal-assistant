// Feedback update: clearer assistant identity, optional assistant name, and a live-data dashboard.
moduleInfo.dashboard[0] = 'Assistant dashboard';
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
  const tasks = state.tasks.filter(task => state.activeClient === 'all' || task.clientId === state.activeClient);
  const approvals = scoped(state.approvals).filter(item => item.status === 'Pending');
  const invoices = scoped(state.invoices).filter(item => ['Sent', 'Partially Paid', 'Overdue'].includes(item.status));
  const today = dashboardDate();
  const dueToday = tasks.filter(task => taskDateStatus(task, today) === 'today');
  const overdue = tasks.filter(task => taskDateStatus(task, today) === 'overdue');
  const newRequests = tasks.filter(task => task.status === 'New Request');
  const waitingOn = [
    ...tasks.filter(task => task.status === 'Waiting for Client').map(task => `
      <div class="task-item"><span class="task-item-main"><b>${esc(task.title)}</b><small>${clientMark(task.clientId)}${esc(clientById(task.clientId)?.name || 'Client')}</small></span><span class="task-status">Client</span></div>`),
    ...approvals.map(item => `
      <div class="task-item"><span class="task-item-main"><b>${esc(item.title)}</b><small>${clientMark(item.clientId)}${esc(clientById(item.clientId)?.name || 'Client')}</small></span><span class="task-status">Approval</span></div>`)
  ];
  const attention = [
    ...overdue.map(task => `
      <div class="attention-item"><span class="attention-mark danger">!</span><span class="task-item-main"><b>${esc(task.title)}</b><small>${clientMark(task.clientId)}${esc(clientById(task.clientId)?.name || 'Client')} · Overdue</small></span><button class="button-text" data-view="tasks">Open</button></div>`),
    ...newRequests.map(task => `
      <div class="attention-item"><span class="attention-mark info">↗</span><span class="task-item-main"><b>${esc(task.title)}</b><small>${clientMark(task.clientId)}${esc(clientById(task.clientId)?.name || 'Client')} · New request</small></span><button class="button-text" data-view="tasks">Open</button></div>`),
    ...approvals.map(item => `
      <div class="attention-item"><span class="attention-mark waiting">◷</span><span class="task-item-main"><b>${esc(item.title)}</b><small>${clientMark(item.clientId)}${esc(clientById(item.clientId)?.name || 'Client')} · Awaiting approval</small></span><button class="button-text" data-view="approvals">Open</button></div>`)
  ];
  const appointments = scoped(state.events)
    .filter(item => !item.date || item.date >= today)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .map(item => `<div class="task-item"><span class="task-item-main"><b>${esc(item.title)}</b><small>${clientMark(item.clientId)}${esc(clientById(item.clientId)?.name || 'Client')} · ${esc(item.date)} ${esc(item.time)}</small></span><span class="task-status">Event</span></div>`);
  const reminders = scoped(state.reminders)
    .filter(item => item.status === 'Scheduled')
    .slice(0, 3)
    .map(item => `<div class="task-item"><span class="task-item-main"><b>${esc(item.title)}</b><small>${clientMark(item.clientId)}${esc(clientById(item.clientId)?.name || 'Client')} · ${esc(item.when)}</small></span><span class="task-status">Reminder</span></div>`);
  const todayRows = dueToday.map(task => `<div class="task-item"><span class="task-item-main"><b>${esc(task.title)}</b><small>${clientMark(task.clientId)}${esc(clientById(task.clientId)?.name || 'Client')}</small></span><span class="task-status">${esc(task.priority)}</span></div>`);
  const completed = tasks.filter(task => task.status === 'Completed').slice(0, 3).map(task => `<div class="task-item"><span class="task-item-main"><b>${esc(task.title)}</b><small>${clientMark(task.clientId)}${esc(clientById(task.clientId)?.name || 'Client')}</small></span><span class="task-status done">Completed</span></div>`);
  const openTasks = tasks.filter(task => !['Completed', 'Cancelled'].includes(task.status)).slice(0, 4).map(task => `<div class="task-item"><span class="task-item-main"><b>${esc(task.title)}</b><small>${clientMark(task.clientId)}${esc(clientById(task.clientId)?.name || 'Client')}</small></span><span class="task-status">${esc(task.status)}</span></div>`);

  return `<div class="dashboard-metrics">
    <div class="metric"><div class="metric-label">Active clients</div><div class="metric-value">${state.clients.length}</div></div>
    <div class="metric"><div class="metric-label">Due today</div><div class="metric-value">${dueToday.length}</div></div>
    <div class="metric metric-danger"><div class="metric-label">Overdue</div><div class="metric-value">${overdue.length}</div></div>
    <div class="metric"><div class="metric-label">New requests</div><div class="metric-value">${newRequests.length}</div></div>
    <div class="metric"><div class="metric-label">Pending approvals</div><div class="metric-value">${approvals.length}</div></div>
    <div class="metric"><div class="metric-label">Pending invoices</div><div class="metric-value">${invoices.length}</div></div>
  </div>
  <div class="quick-action-row">
    <button data-action="capture">＋ Capture message</button><button data-action="new-task">＋ New task</button><button data-action="new-event">＋ Add event</button><button data-action="new-expense">＋ Add expense</button><button data-action="new-approval">＋ Request approval</button>
  </div>
  <div class="dashboard-ops-grid">
    ${dashboardPanel('Needs attention', attention, 'Nothing needs your attention yet.', 'capture', 'Capture a conversation')}
    ${dashboardPanel('Due today', todayRows, 'No tasks due today.', 'new-task', 'Add a task')}
    ${dashboardPanel('Waiting on', waitingOn, 'Nothing is waiting on a client.', 'new-approval', 'Request approval')}
    ${dashboardPanel('Coming up', [...appointments, ...reminders], 'No appointments or reminders are coming up.', 'new-event', 'Add an appointment')}
    ${dashboardPanel('Taken care of', completed, 'Completed tasks will appear here.', null, '')}
    ${dashboardPanel('Open tasks', openTasks, 'No open tasks yet.', 'new-task', 'Create a task')}
  </div>
  <div class="dashboard-footnote"><span class="privacy-bullet"></span>Assistant workspace · Client information stays separate</div>`;
}

const renderWorkspaceBeforeFeedback = renderWorkspace;
renderWorkspace = function () {
  renderWorkspaceBeforeFeedback();
  const sidebarLabel = document.querySelector('.workspace-name');
  if (sidebarLabel) sidebarLabel.innerHTML = `ASSISTANT WORKSPACE <span>${state.clients.length} ACTIVE</span>`;
  document.querySelector('.main-heading p')?.remove();
};
