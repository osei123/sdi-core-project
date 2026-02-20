import { supabase } from '../supabase.js';
import { downloadPDF } from '../utils/pdfGenerator.js';

let allInspections = [];

export async function renderInspections(container) {
  container.innerHTML = `
    <div class="table-card animate-in">
      <div class="table-header">
        <h3>All Inspections</h3>
        <div class="table-filters">
          <input type="text" class="filter-input" id="insp-search" placeholder="Search truck, driver, inspector..." />
          <select class="filter-select" id="insp-status-filter">
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="draft">Draft</option>
          </select>
          <select class="filter-select" id="insp-depot-filter">
            <option value="">All Depots</option>
          </select>
        </div>
      </div>
      <div id="insp-table-body">
        <div style="padding: 20px 24px;">
          <div class="skeleton skeleton-row"></div>
          <div class="skeleton skeleton-row"></div>
          <div class="skeleton skeleton-row"></div>
          <div class="skeleton skeleton-row"></div>
        </div>
      </div>
    </div>
  `;

  await loadInspections();

  document.getElementById('insp-search').addEventListener('input', renderTable);
  document.getElementById('insp-status-filter').addEventListener('change', renderTable);
  document.getElementById('insp-depot-filter').addEventListener('change', renderTable);
}

async function loadInspections() {
  try {
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allInspections = data || [];

    // Populate depot filter
    const depots = [...new Set(allInspections.map(i => i.depot).filter(Boolean))];
    const depotSelect = document.getElementById('insp-depot-filter');
    if (depotSelect) {
      depots.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        depotSelect.appendChild(opt);
      });
    }

    renderTable();
  } catch (e) {
    console.error('Error loading inspections:', e);
    document.getElementById('insp-table-body').innerHTML = `
      <div class="empty-state"><p>Error loading inspections: ${e.message}</p></div>
    `;
  }
}

function renderTable() {
  const search = (document.getElementById('insp-search')?.value || '').toLowerCase();
  const status = document.getElementById('insp-status-filter')?.value || '';
  const depot = document.getElementById('insp-depot-filter')?.value || '';

  let filtered = allInspections.filter(i => {
    const matchSearch = !search ||
      (i.truck_number || '').toLowerCase().includes(search) ||
      (i.driver_name || '').toLowerCase().includes(search) ||
      (i.inspector_name || '').toLowerCase().includes(search) ||
      (i.transporter || '').toLowerCase().includes(search);
    const matchStatus = !status || (i.status || '').toLowerCase() === status;
    const matchDepot = !depot || i.depot === depot;
    return matchSearch && matchStatus && matchDepot;
  });

  const tbody = document.getElementById('insp-table-body');

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <p>No inspections found</p>
      </div>
    `;
    return;
  }

  tbody.innerHTML = `
    <div class="table-scroll-wrapper">
    <table class="data-table">
      <thead>
        <tr>
          <th>Truck No.</th>
          <th>Driver</th>
          <th>Inspector</th>
          <th>Depot</th>
          <th>Transporter</th>
          <th>Status</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(i => `
          <tr>
            <td style="color:var(--text-primary);font-weight:500;">${i.truck_number || '—'}</td>
            <td>${i.driver_name || '—'}</td>
            <td>${i.inspector_name || '—'}</td>
            <td>${i.depot || '—'}</td>
            <td>${i.transporter || '—'}</td>
            <td>${getStatusBadge(i.status)}</td>
            <td>${i.created_at ? new Date(i.created_at).toLocaleDateString() : '—'}</td>
            <td>
              <div class="table-actions">
                <button class="action-btn" data-view="${i.id}">👁 View</button>
                <button class="action-btn" data-pdf="${i.id}" title="Download PDF">📄 PDF</button>
                <button class="action-btn danger" data-delete="${i.id}">🗑</button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    </div>
  `;

  tbody.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const insp = allInspections.find(i => i.id === btn.dataset.view);
      if (insp) showInspectionDetail(insp);
    });
  });

  tbody.querySelectorAll('[data-pdf]').forEach(btn => {
    btn.addEventListener('click', () => {
      const insp = allInspections.find(i => i.id === btn.dataset.pdf);
      if (insp) downloadPDF('inspection', insp);
    });
  });

  tbody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => {
      const insp = allInspections.find(i => i.id === btn.dataset.delete);
      if (insp) confirmDelete(insp);
    });
  });
}

function getStatusBadge(status) {
  if (!status) return '<span class="badge badge-default">Unknown</span>';
  const s = status.toLowerCase();
  if (s === 'completed' || s === 'complete') return `<span class="badge badge-success">${status}</span>`;
  if (s === 'in_progress' || s === 'in progress') return `<span class="badge badge-warning">${status}</span>`;
  if (s === 'draft') return `<span class="badge badge-default">${status}</span>`;
  return `<span class="badge badge-default">${status}</span>`;
}

function showInspectionDetail(insp) {
  let itemsHTML = '';
  if (insp.items && Array.isArray(insp.items)) {
    itemsHTML = `
      <div class="detail-item full-width">
        <label>Checklist Items (${insp.items.length})</label>
        <div class="checklist-grid">
          ${insp.items.map(item => {
      const statusClass = item.status === 'pass' ? 'pass' : item.status === 'fail' ? 'fail' : 'na';
      return `
              <div class="checklist-item">
                <div class="item-status ${statusClass}"></div>
                <span>${item.name || item.title || item.label || 'Item'}</span>
              </div>
            `;
    }).join('')}
        </div>
      </div>
    `;
  }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-content" style="max-width: 800px; width: 90%;">
      <div class="modal-header">
        <h3>Inspection Details</h3>
        <div style="display:flex;gap:8px;align-items:center;">
          <button class="action-btn" id="modal-pdf-btn" style="background:var(--accent-primary);color:#fff;padding:8px 16px;border-radius:6px;font-weight:600;font-size:12px;">📄 Download PDF</button>
          <button class="modal-close" id="modal-close-btn">✕</button>
        </div>
      </div>
      <div class="modal-body">
        <div class="inspection-meta-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid var(--glass-border);">
          <div class="detail-item">
            <label>Truck Number</label>
            <div class="value">${insp.truck_number || 'N/A'}</div>
          </div>
          <div class="detail-item">
            <label>Driver</label>
            <div class="value">${insp.driver_name || 'N/A'}</div>
          </div>
          <div class="detail-item">
            <label>Inspector</label>
            <div class="value">${insp.inspector_name || 'N/A'}</div>
          </div>
          <div class="detail-item">
            <label>Status</label>
            <div class="value">${getStatusBadge(insp.status)}</div>
          </div>
          <div class="detail-item">
            <label>Depot</label>
            <div class="value">${insp.depot || 'N/A'}</div>
          </div>
          <div class="detail-item">
            <label>Transporter</label>
            <div class="value">${insp.transporter || 'N/A'}</div>
          </div>
          <div class="detail-item full-width">
            <label>Date</label>
            <div class="value">${insp.created_at ? new Date(insp.created_at).toLocaleString() : 'N/A'}</div>
          </div>
          ${itemsHTML}
          <div class="detail-item full-width">
            <label>Inspection ID</label>
            <div class="value" style="font-size:0.78rem;font-family:monospace;color:var(--text-muted);">${insp.id}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector('#modal-close-btn').addEventListener('click', close);
  overlay.querySelector('#modal-pdf-btn').addEventListener('click', () => downloadPDF('inspection', insp));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
}

function confirmDelete(insp) {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-box">
      <h4>Delete Inspection</h4>
      <p>Delete inspection for truck <strong>${insp.truck_number || 'N/A'}</strong>? This cannot be undone.</p>
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
      await supabase.from('inspections').delete().eq('id', insp.id);
      allInspections = allInspections.filter(i => i.id !== insp.id);
      renderTable();
      overlay.remove();
    } catch (e) {
      console.error('Delete error:', e);
      btn.textContent = 'Error!';
      setTimeout(() => overlay.remove(), 1500);
    }
  });
}
