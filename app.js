'use strict';
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
if (!motionPreference.matches && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('js-motion');
  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
  }), { threshold: .08 });
  $$('.reveal').forEach(element => revealObserver.observe(element));
}
const updateThemeLabel = () => {
  $('.theme-toggle').setAttribute('aria-label', `Switch to ${document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'} theme`);
};
updateThemeLabel();
$('.theme-toggle').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('uk-theme', next); } catch (_) {}
  updateThemeLabel();
});
$('#year').textContent = new Date().getFullYear();
let scrollQueued = false;
function updateScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  $('.reading-progress').style.width = `${max > 0 ? window.scrollY / max * 100 : 0}%`;
  let section = '';
  ['work', 'about', 'contact'].forEach(id => { if ($(`#${id}`).getBoundingClientRect().top < window.innerHeight * .4) section = id; });
  $$('[data-nav]').forEach(link => {
    const active = link.dataset.nav === section;
    link.classList.toggle('current', active);
    if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  });
  scrollQueued = false;
}
window.addEventListener('scroll', () => { if (!scrollQueued) { requestAnimationFrame(updateScroll); scrollQueued = true; } }, { passive: true });
updateScroll();
const flowExplanations = [
  'The interface turns a small interaction into a request.',
  'The backend validates the request and applies the application rules.',
  'The database stores the result so it is ready for the next visit.'
];
function selectNode(index) {
  $$('.flow-node').forEach((node, i) => { node.classList.toggle('active', i === index); node.setAttribute('aria-pressed', i === index ? 'true' : 'false'); });
  $('#flow-explanation').textContent = flowExplanations[index];
}
$$('.flow-node').forEach(node => node.addEventListener('click', () => selectNode(Number(node.dataset.node))));
let requestTimers = [];
$('#run-request').addEventListener('click', () => {
  requestTimers.forEach(clearTimeout);
  const runButton = $('#run-request');
  runButton.disabled = true;
  $$('.flow-node').forEach(node => { node.disabled = true; });
  $('.system-window').classList.add('running');
  $('.request-status').textContent = 'Request on its way…';
  selectNode(0);
  const step = motionPreference.matches ? 90 : 650;
  requestTimers = [setTimeout(() => selectNode(1), step), setTimeout(() => selectNode(2), step * 2), setTimeout(() => {
    $('.system-window').classList.remove('running');
    $('.request-status').textContent = '200 OK · idea delivered';
    $('#flow-explanation').textContent = 'Interface → logic → data. A small simulation of the full journey.';
    runButton.disabled = false;
    $$('.flow-node').forEach(node => { node.disabled = false; });
  }, step * 3)];
});
const learningPaths = {
  backend: { title: 'Build better APIs', detail: 'Java · Spring Boot · REST', icon: '{ }' },
  frontend: { title: 'Bring interfaces to life', detail: 'React · JavaScript · CSS', icon: '⌘' },
  dsa: { title: 'Think through the problem', detail: 'Patterns · Algorithms · Practice', icon: '↗' }
};
$$('[data-skill]').forEach(button => button.addEventListener('click', () => {
  const path = learningPaths[button.dataset.skill];
  $$('[data-skill]').forEach(tab => tab.setAttribute('aria-pressed', tab === button ? 'true' : 'false'));
  $('#learning-name').textContent = path.title;
  $('#learning-description').textContent = path.detail;
  $('.learning-icon').textContent = path.icon;
}));
const initialLayout = [{ x:8, y:17, r:-7 }, { x:38, y:12, r:5 }, { x:66, y:26, r:-3 }];
const alternateLayout = [{ x:5, y:23, r:3 }, { x:37, y:8, r:-5 }, { x:70, y:25, r:7 }];
let wallLayout = initialLayout.map(item => ({ ...item }));
let wallAlternate = false;
function paintWall() {
  $$('.wall-frame').forEach((frame, index) => {
    frame.style.left = `${wallLayout[index].x}%`;
    frame.style.top = `${wallLayout[index].y}%`;
    frame.style.transform = `rotate(${wallLayout[index].r}deg)`;
  });
}
function constrainFrame(index, x, y) {
  const wall = $('#wall-canvas');
  const frame = $$('.wall-frame')[index];
  wallLayout[index].x = Math.max(1, Math.min(99 - frame.offsetWidth / wall.clientWidth * 100, x));
  wallLayout[index].y = Math.max(2, Math.min(98 - frame.offsetHeight / wall.clientHeight * 100, y));
  paintWall();
}
$$('.wall-frame').forEach((frame, index) => {
  let drag = null;
  frame.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    drag = { pointer: event.pointerId, x: event.clientX, y: event.clientY, startX: wallLayout[index].x, startY: wallLayout[index].y };
    frame.setPointerCapture(event.pointerId);
    frame.classList.add('dragging');
    frame.focus({ preventScroll: true });
  });
  frame.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.pointer) return;
    const wall = $('#wall-canvas');
    constrainFrame(index, drag.startX + (event.clientX - drag.x) / wall.clientWidth * 100, drag.startY + (event.clientY - drag.y) / wall.clientHeight * 100);
  });
  const stopDrag = () => { drag = null; frame.classList.remove('dragging'); };
  frame.addEventListener('pointerup', stopDrag);
  frame.addEventListener('pointercancel', stopDrag);
  frame.addEventListener('lostpointercapture', stopDrag);
  frame.addEventListener('keydown', event => {
    const delta = event.shiftKey ? 5 : 2;
    const keyMap = { ArrowLeft: [-delta, 0], ArrowRight: [delta, 0], ArrowUp: [0, -delta], ArrowDown: [0, delta] };
    if (keyMap[event.key]) {
      event.preventDefault();
      constrainFrame(index, wallLayout[index].x + keyMap[event.key][0], wallLayout[index].y + keyMap[event.key][1]);
    } else if (event.key.toLowerCase() === 'r') {
      event.preventDefault(); wallLayout[index].r = wallLayout[index].r >= 12 ? -12 : wallLayout[index].r + 3; paintWall();
    }
  });
});
$('#shuffle-wall').addEventListener('click', () => {
  wallAlternate = !wallAlternate;
  wallLayout = (wallAlternate ? alternateLayout : initialLayout).map(item => ({ ...item }));
  paintWall();
});
$('#reset-wall').addEventListener('click', () => { wallLayout = initialLayout.map(item => ({ ...item })); wallAlternate = false; paintWall(); });
paintWall();
const projectData = {
  skillsphere: {
    label: '01 / FULL-STACK WEB APPLICATION', name: 'SkillSphere', intro: 'Student collaboration, built end to end.',
    overview: 'A skill-exchange platform where students can build profiles, showcase projects, explore learning roadmaps, join communities, and send collaboration requests.',
    decisions: ['Java 21 and Spring Boot backend, with a React frontend and MySQL data layer.', 'JWT and Google OAuth2 authentication, BCrypt password hashing, and role-based access with Spring Security.', 'A controller → service → repository structure, request validation, and OpenAPI documentation.'],
    focus: 'Bringing identity, community, and learning features together while keeping responsibilities clear across the application.',
    links: [{ label: 'Open live app', url: 'https://skillsphere-tidb-utkarshk08.vercel.app' }, { label: 'Explore the source', url: 'https://github.com/utkarshk08/SkillSphere' }],
    note: 'The interactive preview on this portfolio is a small interface study, not an embedded version of the live application.'
  },
  cutroom: {
    label: '02 / CREATIVE TOOL · JAVA EDITION', name: 'CutRoom', intro: 'A hands-on studio for getting ideas onto the wall.',
    overview: 'An interactive wall-layout editor for arranging photos and text on a measured wall, cropping poster sheets, and preparing printable pages.',
    decisions: ['React frontend with resize, rotate, grouping, layers, and JSON backup features.', 'Spring Boot REST APIs and JWT authentication, with owner-scoped project persistence in MySQL.', 'In this Java edition, image data is embedded in saved project JSON; it does not use a separate image storage service.'],
    focus: 'Connecting a direct-manipulation interface to secure project storage, while making creative layouts editable and recoverable.',
    links: [{ label: 'Live app · original edition', url: 'https://cutroom.utkarshk0804.workers.dev' }, { label: 'Java edition source', url: 'https://github.com/utkarshk08/cutroom-java' }, { label: 'Original edition source', url: 'https://github.com/utkarshk08/CutRoom' }],
    note: 'The live app is the original TypeScript edition. The project details here describe the separate Java/Spring Boot edition. The wall preview is an interactive portfolio concept, not the complete editor.'
  }
};
Object.assign(projectData, {
  expense: {
    label: '03 / PERSONAL TOOL · DATA VISUALIZATION', name: 'Expense Trackr', intro: 'A clearer view of where the everyday goes.',
    overview: 'A mobile-friendly, read-only dashboard for an existing Google Sheets expense ledger. It brings transaction search, category breakdowns, and daily spending insights into a dedicated interface.',
    decisions: ['Google Apps Script reads the ledger through the Google Sheets API with a read-only scope.', 'Vanilla JavaScript, HTML, and CSS provide date, category, and payment filters, category donut and ranked views, and tappable daily details.', 'Manual refresh preserves the current filters. Transactions render in batches of 30, with mobile layouts and reduced-motion support.'],
    focus: 'Turning a practical personal workflow into a responsive, readable dashboard while keeping the source ledger unchanged.',
    links: [{ label: 'Open dashboard · Google sign-in', url: 'https://script.google.com/macros/s/AKfycbz7k0YoP2P3kUcXVX2nG6OhaJ1yNJ2j6NoKD_mFzWH4bxeBT0ua_R_pfRE7K1mZ43TzEw/exec' }, { label: 'Explore the source', url: 'https://github.com/utkarshk08/expense-trackr' }],
    note: 'Google sign-in is required for the live dashboard. This app reads expenses; the iPhone Shortcut used for entry is a separate workflow. The portfolio preview uses invented sample transactions and never connects to a real ledger.'
  },
  vitatrackr: {
    label: '04 / HEALTH & WELLNESS APPLICATION', name: 'VitaTrackr', intro: 'Everyday habits, in one place.',
    overview: 'A wellness project with recipe generation, meal and activity logging, personal profiles, and an overview dashboard.',
    decisions: ['Node.js and Express backend with MongoDB models and routes for users, meals, activities, recipes, and weight logs.', 'Google Gemini integration for recipe generation and ingredient-based ideas.', 'JavaScript interface with IndexedDB and local storage support for browser-side data.'],
    focus: 'Connecting multiple everyday tracking flows with a common profile and making external AI services part of a usable application.',
    links: [{label:'Explore the source',url:'https://github.com/utkarshk08/vita-trackr'}],
    note: 'A software portfolio project. AI-generated wellness content is not a clinical recommendation.'
  },
  gamestore: {
    label: '05 / E-COMMERCE LEARNING PROJECT', name: 'GameStore', intro: 'A game catalog with systems behind it.',
    overview: 'A digital storefront demonstration featuring game discovery, user profiles, virtual wallet purchases, subscription plans, and store analytics.',
    decisions: ['Spring Boot and Spring Data MongoDB backend, with a vanilla JavaScript interface.', 'Separate domain models for games, purchases, subscriptions, and user profiles.', 'REST endpoints for catalog search, purchase history, subscriptions, and aggregate store statistics.'],
    focus: 'Modeling connected commerce workflows and querying document data for useful aggregate views.',
    links: [{label:'Explore the source',url:'https://github.com/utkarshk08/gaminglol'}],
    note: 'A learning project with simulated wallet and purchase flows, not a production payment service.'
  }
});
const dialog = $('#project-dialog');
let lastProjectTrigger;
function openProject(id, trigger) {
  const project = projectData[id];
  if (!project) return;
  lastProjectTrigger = trigger;
  const content = $('#dialog-content');
  content.replaceChildren();
  const add = (tag, text, className, parent = content) => {
    const el = document.createElement(tag); el.textContent = text; if (className) el.className = className; parent.append(el); return el;
  };
  add('p', project.label, 'eyebrow');
  const title = add('h2', project.name); title.id = 'dialog-title';
  add('p', project.intro, 'dialog-intro');
  const overview = add('section', '', 'dialog-section'); add('h3', 'What it does', '', overview); add('p', project.overview, '', overview);
  const decisions = add('section', '', 'dialog-section'); add('h3', 'Under the hood', '', decisions); const list = add('ul', '', '', decisions); project.decisions.forEach(item => add('li', item, '', list));
  const focus = add('section', '', 'dialog-section'); add('h3', 'The engineering focus', '', focus); add('p', project.focus, '', focus);
  const links = add('div', '', 'dialog-links');
  project.links.forEach(link => { const a = add('a', `${link.label} ↗`, 'text-link', links); a.href = link.url; a.target = '_blank'; a.rel = 'noopener'; });
  if (project.note) add('p', project.note, 'dialog-note');
  dialog.showModal();
  document.body.style.overflow = 'hidden';
  $('.dialog-close').focus();
}
document.addEventListener('click', event => { const trigger = event.target.closest('[data-project]'); if (trigger) openProject(trigger.dataset.project, trigger); });
$('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
dialog.addEventListener('close', () => { document.body.style.overflow = ''; lastProjectTrigger?.focus({ preventScroll: true }); });
let toastTimer;
function showToast(message) { $('.toast').textContent = message; $('.toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('.toast').classList.remove('visible'), 3000); }
$('.copy-email').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText('utkarshk0804@gmail.com'); showToast('Email copied. Say hello when you’re ready.'); }
  catch (_) { showToast('You can select and copy the email above.'); }
});
$$('[data-filter]').forEach(button => button.addEventListener('click', () => {
  $$('[data-filter]').forEach(item => item.setAttribute('aria-pressed', item === button ? 'true' : 'false'));
  $$('.archive-row').forEach(row => { row.hidden = button.dataset.filter !== 'all' && row.dataset.category !== button.dataset.filter; });
}));

// Synthetic examples only: this portfolio never reads a financial account or spreadsheet.
const sampleExpenses = [
  { name: 'Groceries', category: 'Food', method: 'UPI', amount: 520 },
  { name: 'Bus pass', category: 'Travel', method: 'UPI', amount: 300 },
  { name: 'A good book', category: 'Learning', method: 'Card', amount: 450 },
  { name: 'Lunch with friends', category: 'Food', method: 'UPI', amount: 410 },
  { name: 'Auto ride', category: 'Travel', method: 'Cash', amount: 150 },
  { name: 'Course notes', category: 'Learning', method: 'UPI', amount: 350 }
];
const expenseCategories = ['Food', 'Travel', 'Learning'];
const rupees = value => `₹${value.toLocaleString('en-IN')}`;
function renderExpenses(category, announce = true) {
  const rows = sampleExpenses.filter(row => category === 'all' || row.category === category);
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  $('#expense-total').textContent = rupees(total);
  $('#expense-total-label').textContent = category === 'all' ? 'Total spending' : `${category} spending`;
  $('#expense-count').textContent = `${rows.length} sample transactions`;
  $$('[data-expense]').forEach(button => button.setAttribute('aria-pressed', button.dataset.expense === category ? 'true' : 'false'));
  const ledger = $('#expense-ledger');
  ledger.replaceChildren();
  rows.forEach(row => {
    const entry = document.createElement('div');
    const label = document.createElement('span'); label.textContent = row.name;
    const meta = document.createElement('small'); meta.textContent = `${row.category} · ${row.method}`;
    const amount = document.createElement('strong'); amount.textContent = rupees(row.amount);
    label.append(meta); entry.append(label, amount); ledger.append(entry);
  });
  const circumference = 2 * Math.PI * 39;
  let offset = 0;
  const accessibleParts = [];
  expenseCategories.forEach(name => {
    const value = rows.filter(row => row.category === name).reduce((sum, row) => sum + row.amount, 0);
    const length = total ? value / total * circumference : 0;
    const ring = $(`.expense-ring-${name.toLowerCase()}`);
    ring.style.strokeDasharray = `${length} ${circumference - length}`;
    ring.style.strokeDashoffset = `${-offset}`;
    offset += length;
    if (value) accessibleParts.push(`${name}: ${value} rupees`);
  });
  $('.expense-chart').setAttribute('aria-label', `Sample spending by category. ${accessibleParts.join(', ')}.`);
  if (announce) $('#expense-live-status').textContent = `${category === 'all' ? 'All categories' : category}: ${rows.length} sample transactions, totaling ${rupees(total)}.`;
}
$$('[data-expense]').forEach(button => button.addEventListener('click', () => renderExpenses(button.dataset.expense)));
renderExpenses('all', false);
