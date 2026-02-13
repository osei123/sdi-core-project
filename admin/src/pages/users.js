import { supabase } from '../supabase.js';

let allUsers = [];

export async function renderUsers(container) {
  container.innerHTML = `
    <div class="table-card animate-in">
      <div class="table-header">
        <h3>All Users</h3>
        <div class="table-filters">
          <input type="text" class="filter-input" id="user-search" placeholder="Search by name or email..." />
          <select class="filter-select" id="user-role-filter">
            <option value="">All Roles</option>
            <option value="inspector">Inspector</option>
            <option value="manager">Manager</option>
          </select>
          <button class="btn-primary" id="create-user-btn" style="padding: 8px 16px; display: flex; align-items: center; gap: 6px;">
            <span>+</span> Add User
          </button>
        </div>
      </div>
      <div id="users-table-body">
        <div style="padding: 20px 24px;">
          <div class="skeleton skeleton-row"></div>
          <div class="skeleton skeleton-row"></div>
          <div class="skeleton skeleton-row"></div>
          <div class="skeleton skeleton-row"></div>
        </div>
      </div>
    </div>
  `;

  await loadUsers();

  document.getElementById('user-search').addEventListener('input', renderTable);
  document.getElementById('user-role-filter').addEventListener('change', renderTable);
  document.getElementById('create-user-btn').addEventListener('click', showCreateUserModal);
}

async function loadUsers() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    allUsers = data || [];
    renderTable();
  } catch (e) {
    console.error('Error loading users:', e);
    document.getElementById('users-table-body').innerHTML = `
      <div class="empty-state"><p>Error loading users: ${e.message}</p></div>
    `;
  }
}

function renderTable() {
  const search = (document.getElementById('user-search')?.value || '').toLowerCase();
  const role = document.getElementById('user-role-filter')?.value || '';

  let filtered = allUsers.filter(u => {
    const matchSearch = !search ||
      (u.full_name || '').toLowerCase().includes(search) ||
      (u.username || '').toLowerCase().includes(search);
    const matchRole = !role || u.role === role;
    return matchSearch && matchRole;
  });

  const tbody = document.getElementById('users-table-body');

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        <p>No users found</p>
      </div>
    `;
    return;
  }

  tbody.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>User</th>
          <th>Username</th>
          <th>Role</th>
          <th>Last Updated</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(u => `
          <tr>
            <td>
              <div style="display:flex;align-items:center;gap:10px;">
                <div class="user-avatar" style="width:32px;height:32px;font-size:0.72rem;">${getInitials(u.full_name)}</div>
                <span style="color:var(--text-primary);font-weight:500;">${u.full_name || 'No Name'}</span>
              </div>
            </td>
            <td>${u.username || '—'}</td>
            <td><span class="badge ${u.role === 'manager' ? 'badge-info' : 'badge-default'}">${u.role || 'inspector'}</span></td>
            <td>${u.updated_at ? new Date(u.updated_at).toLocaleDateString() : '—'}</td>
            <td>
              <div class="table-actions">
                <button class="action-btn" data-view="${u.id}" title="View details">👁 View</button>
                <button class="action-btn danger" data-delete="${u.id}" title="Delete user">🗑 Delete</button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  // View handlers
  tbody.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const user = allUsers.find(u => u.id === btn.dataset.view);
      if (user) showUserDetail(user);
    });
  });

  // Delete handlers
  tbody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => {
      const user = allUsers.find(u => u.id === btn.dataset.delete);
      if (user) confirmDeleteUser(user);
    });
  });
}

function showUserDetail(user) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>User Details</h3>
        <button class="modal-close" id="modal-close-btn">✕</button>
      </div>
      <div class="modal-body">
        <div class="detail-grid">
          <div class="detail-item">
            <label>Full Name</label>
            <div class="value">${user.full_name || 'N/A'}</div>
          </div>
          <div class="detail-item">
            <label>Username</label>
            <div class="value">${user.username || 'N/A'}</div>
          </div>
          <div class="detail-item">
            <label>Role</label>
            <div class="value"><span class="badge ${user.role === 'manager' ? 'badge-info' : 'badge-default'}">${user.role || 'inspector'}</span></div>
          </div>
          <div class="detail-item">
            <label>Last Updated</label>
            <div class="value">${user.updated_at ? new Date(user.updated_at).toLocaleString() : 'N/A'}</div>
          </div>
          <div class="detail-item">
            <label>User ID</label>
            <div class="value" style="font-size:0.78rem;font-family:monospace;color:var(--text-muted);">${user.id}</div>
          </div>
          <div class="detail-item">
            <label>Website</label>
            <div class="value">${user.website || 'N/A'}</div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => { overlay.remove(); };
  overlay.querySelector('#modal-close-btn').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
}

function confirmDeleteUser(user) {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-box">
      <h4>Delete User</h4>
      <p>Are you sure you want to delete <strong>${user.full_name || user.username || 'this user'}</strong>? This will also remove all their inspections and quality reports.</p>
      <div class="confirm-actions">
        <button class="btn-ghost" id="cancel-delete">Cancel</button>
        <button class="btn-danger" id="confirm-delete" style="padding:10px 20px;">Delete</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#cancel-delete').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#confirm-delete').addEventListener('click', async () => {
    const btn = overlay.querySelector('#confirm-delete');
    btn.textContent = 'Deleting...';
    btn.disabled = true;

    try {
      // Delete user via Edge Function (handles Auth + Data)
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: user.id }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Remove from local array
      allUsers = allUsers.filter(u => u.id !== user.id);
      renderTable();
      overlay.remove();
    } catch (e) {
      console.error('Delete error:', e);
      btn.textContent = 'Error!';

      const errorMsg = overlay.querySelector('#delete-error-msg') || document.createElement('div');
      errorMsg.id = 'delete-error-msg';
      errorMsg.style.color = '#ff4d4f';
      errorMsg.style.marginTop = '12px';
      errorMsg.style.fontSize = '0.9rem';
      errorMsg.textContent = e.message || 'Failed to delete user';

      if (!overlay.querySelector('#delete-error-msg')) {
        overlay.querySelector('.confirm-box').appendChild(errorMsg);
      }
    }
  });
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function showCreateUserModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-content" style="max-width: 400px;">
      <div class="modal-header">
        <h3>Create New User</h3>
        <button class="modal-close" id="modal-close-btn">✕</button>
      </div>
      <div class="modal-body">
        <form id="create-user-form" style="display: flex; flex-direction: column; gap: 16px;">
          <div class="form-group">
            <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 0.9rem;">Full Name</label>
            <input type="text" id="new-user-name" class="filter-input" style="width: 100%; box-sizing: border-box;" required placeholder="e.g. John Doe" />
          </div>
          <div class="form-group">
            <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 0.9rem;">Email Address</label>
            <input type="email" id="new-user-email" class="filter-input" style="width: 100%; box-sizing: border-box;" required placeholder="e.g. john@company.com" />
          </div>
          <div class="form-group">
            <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 0.9rem;">Password</label>
            <input type="password" id="new-user-password" class="filter-input" style="width: 100%; box-sizing: border-box;" required placeholder="Min 6 characters" minlength="6" />
          </div>
          <div class="form-group">
            <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 0.9rem;">Role</label>
            <select id="new-user-role" class="filter-select" style="width: 100%; box-sizing: border-box;" required>
              <option value="inspector">Inspector</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          
          <div id="create-error" style="color: #ff4d4f; font-size: 0.85rem; display: none;"></div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
            <button type="button" class="btn-ghost" id="cancel-create">Cancel</button>
            <button type="submit" class="btn-primary" id="submit-create">Create User</button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelector('#modal-close-btn').addEventListener('click', close);
  overlay.querySelector('#cancel-create').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  const form = overlay.querySelector('#create-user-form');
  const errorEl = overlay.querySelector('#create-error');
  const submitBtn = overlay.querySelector('#submit-create');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';

    const name = document.getElementById('new-user-name').value;
    const email = document.getElementById('new-user-email').value;
    const password = document.getElementById('new-user-password').value;
    const role = document.getElementById('new-user-role').value;

    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { full_name: name, email, password, role }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Success
      close();
      // Show toast or alert? Just refresh list for now.
      // Ideally we'd show a success toast.
      const toast = document.createElement('div');
      toast.style.cssText = `
                position: fixed; bottom: 24px; right: 24px;
                background: #10b981; color: white; padding: 12px 24px;
                border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                animation: slideIn 0.3s ease-out; z-index: 9999;
            `;
      toast.textContent = 'User created successfully!';
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
      }, 3000);

      loadUsers(); // Refresh table
    } catch (err) {
      console.error('Create user error:', err);
      errorEl.textContent = err.message || 'Failed to create user';
      errorEl.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create User';
    }
  });
}
