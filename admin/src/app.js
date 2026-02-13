import './style.css';
import { renderLogin, checkSession, logout, renderUpdatePassword, renderRecoveryMessage, renderForgotPassword } from './auth.js';
import { supabase } from './supabase.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderUsers } from './pages/users.js';
import { renderInspections } from './pages/inspections.js';
import { renderQualityReports } from './pages/qualityReports.js';

const app = document.getElementById('app');
let currentPage = 'dashboard';
let currentUser = null;
let currentProfile = null;

// ICONS
const icons = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  inspections: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  quality: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
};

const pageTitles = {
  dashboard: 'Dashboard',
  users: 'User Management',
  inspections: 'Inspections',
  qualityReports: 'Quality Reports',
};

async function init() {
  // Check for recovery flow immediately before async calls might clear hash
  const isRecovery = window.location.hash.includes('type=recovery');

  // We listen to onAuthStateChange to catch these events
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      renderUpdatePassword(app, () => {
        // On success, we are logged in, so re-run init to route correctly
        window.location.hash = '';
        init();
      });
      return;
    }

    // If we are signed in (SIGNED_IN) causing a session:
    // Check if we are in a special flow
    if (event === 'SIGNED_IN') {
      // If we just signed in, check if we need to show dashboard or something else
      // If it was an Email Verification link (type=signup or invite)
      // We can check local storage or URL? URL is usually cleared by Supabase client.
      // But if the user is NOT a manager, we should verify logic.
    }
  });

  const session = await checkSession();

  // Special check: If session exists but role is not manager
  // It might be a mobile user verifying email or recovering password
  if (!session) {
    // Check if we have a raw session but it failed checkSession because of role
    const { data: { session: rawSession } } = await supabase.auth.getSession();
    if (rawSession) {
      // User is logged in but not a manager (checkSession returned null)

      // CRITICAL: If this is a Password Recovery flow, DO NOT show the success message yet.
      // The onAuthStateChange event 'PASSWORD_RECOVERY' will handle rendering the form.
      if (isRecovery) return;

      // Check if they are recovering password (handled by event above mostly, but let's be safe)
      // OR if they just verified their email.

      // If URL contained type=recovery, the event listener handles it.
      // If URL contained type=signup (confirmation), the user is now logged in.

      // We render a generic "Success" message for them.
      renderRecoveryMessage(app, "You are logged in. If you just verified your email or reset your password, you can now return to the mobile app.");
      return;
    }

    renderLogin(app, (user, profile) => {
      currentUser = user;
      currentProfile = profile;
      renderApp();
    });
  } else {
    currentUser = session.user;
    currentProfile = session.profile;
    renderApp();
  }
}

function getInitials(name) {
  if (!name) return 'A';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function renderApp() {
  app.innerHTML = `
    <div class="app-layout">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-brand">
            <div class="brand-icon">${icons.shield}</div>
            <div>
              <h2>SDI Admin</h2>
              <p>Control Panel</p>
            </div>
          </div>
        </div>
        <nav class="sidebar-nav">
          <div class="nav-section-label">Main</div>
          <button class="nav-item ${currentPage === 'dashboard' ? 'active' : ''}" data-page="dashboard">
            ${icons.dashboard} <span>Dashboard</span>
          </button>
          <button class="nav-item ${currentPage === 'users' ? 'active' : ''}" data-page="users">
            ${icons.users} <span>Users</span>
          </button>
          <div class="nav-section-label">Records</div>
          <button class="nav-item ${currentPage === 'inspections' ? 'active' : ''}" data-page="inspections">
            ${icons.inspections} <span>Inspections</span>
          </button>
          <button class="nav-item ${currentPage === 'qualityReports' ? 'active' : ''}" data-page="qualityReports">
            ${icons.quality} <span>Quality Reports</span>
          </button>
        </nav>
        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">${getInitials(currentProfile?.full_name)}</div>
            <div class="user-details">
              <div class="name">${currentProfile?.full_name || currentUser?.email}</div>
              <div class="role">Manager</div>
            </div>
          </div>
          <button class="nav-item" id="logout-btn">
            ${icons.logout} <span>Sign Out</span>
          </button>
        </div>
      </aside>
      <main class="main-content">
        <header class="topbar">
          <h1 class="topbar-title" id="page-title">${pageTitles[currentPage]}</h1>
          <div class="topbar-actions">
            <button class="btn-ghost" id="mobile-menu-btn" style="display:none;">☰ Menu</button>
          </div>
        </header>
        <div class="content-area" id="content-area"></div>
      </main>
    </div>
  `;

  // Nav click handlers
  document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = btn.dataset.page;
      renderApp();
    });
  });

  // Logout
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await logout();
    currentUser = null;
    currentProfile = null;
    currentPage = 'dashboard';
    renderLogin(app, (user, profile) => {
      currentUser = user;
      currentProfile = profile;
      renderApp();
    });
  });

  // Render current page
  const contentArea = document.getElementById('content-area');
  switch (currentPage) {
    case 'dashboard': renderDashboard(contentArea); break;
    case 'users': renderUsers(contentArea); break;
    case 'inspections': renderInspections(contentArea); break;
    case 'qualityReports': renderQualityReports(contentArea); break;
  }
}

init();
