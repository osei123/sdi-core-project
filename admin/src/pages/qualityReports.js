import { supabase } from '../supabase.js';
import { downloadPDF } from '../utils/pdfGenerator.js';

let allReports = [];

export async function renderQualityReports(container) {
  container.innerHTML = `
    <div class="table-card animate-in">
      <div class="table-header">
        <h3>All Quality Reports</h3>
        <div class="table-filters">
          <input type="text" class="filter-input" id="qr-search" placeholder="Search product, company, inspector..." />
          <select class="filter-select" id="qr-depot-filter">
            <option value="">All Depots</option>
          </select>
          <select class="filter-select" id="qr-product-filter">
            <option value="">All Products</option>
          </select>
        </div>
      </div>
      <div id="qr-table-body">
        <div style="padding: 20px 24px;">
          <div class="skeleton skeleton-row"></div>
          <div class="skeleton skeleton-row"></div>
          <div class="skeleton skeleton-row"></div>
          <div class="skeleton skeleton-row"></div>
        </div>
      </div>
    </div>
  `;

  await loadReports();

  document.getElementById('qr-search').addEventListener('input', renderTable);
  document.getElementById('qr-depot-filter').addEventListener('change', renderTable);
  document.getElementById('qr-product-filter').addEventListener('change', renderTable);
}

async function loadReports() {
  try {
    const { data, error } = await supabase
      .from('quality_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allReports = data || [];

    // Populate filters
    const depots = [...new Set(allReports.map(r => r.depot).filter(Boolean))];
    const products = [...new Set(allReports.map(r => r.product).filter(Boolean))];

    const depotSelect = document.getElementById('qr-depot-filter');
    depots.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d; opt.textContent = d;
      depotSelect.appendChild(opt);
    });

    const productSelect = document.getElementById('qr-product-filter');
    products.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p; opt.textContent = p;
      productSelect.appendChild(opt);
    });

    renderTable();
  } catch (e) {
    console.error('Error loading quality reports:', e);
    document.getElementById('qr-table-body').innerHTML = `
      <div class="empty-state"><p>Error loading reports: ${e.message}</p></div>
    `;
  }
}

function renderTable() {
  const search = (document.getElementById('qr-search')?.value || '').toLowerCase();
  const depot = document.getElementById('qr-depot-filter')?.value || '';
  const product = document.getElementById('qr-product-filter')?.value || '';

  let filtered = allReports.filter(r => {
    const matchSearch = !search ||
      (r.product || '').toLowerCase().includes(search) ||
      (r.company_name || '').toLowerCase().includes(search) ||
      (r.inspector_name || '').toLowerCase().includes(search) ||
      (r.truck_number || '').toLowerCase().includes(search);
    const matchDepot = !depot || r.depot === depot;
    const matchProduct = !product || r.product === product;
    return matchSearch && matchDepot && matchProduct;
  });

  const tbody = document.getElementById('qr-table-body');

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <p>No quality reports found</p>
      </div>
    `;
    return;
  }

  tbody.innerHTML = `
    <div class="table-scroll-wrapper">
    <table class="data-table">
      <thead>
        <tr>
          <th>Product</th>
          <th>Company</th>
          <th>Truck No.</th>
          <th>Inspector</th>
          <th>Depot</th>
          <th>Sealer</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(r => `
          <tr>
            <td style="color:var(--text-primary);font-weight:500;">${r.product || '—'}</td>
            <td>${r.company_name || '—'}</td>
            <td>${r.truck_number || '—'}</td>
            <td>${r.inspector_name || '—'}</td>
            <td>${r.depot || '—'}</td>
            <td>${r.sealer_name || '—'}</td>
            <td>${r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
            <td>
              <div class="table-actions">
                <button class="action-btn" data-view="${r.id}">👁 View</button>
                <button class="action-btn" data-pdf="${r.id}" title="Download PDF">📄 PDF</button>
                <button class="action-btn danger" data-delete="${r.id}">🗑</button>
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
      const report = allReports.find(r => r.id === btn.dataset.view);
      if (report) showReportDetail(report);
    });
  });

  tbody.querySelectorAll('[data-pdf]').forEach(btn => {
    btn.addEventListener('click', () => {
      const report = allReports.find(r => r.id === btn.dataset.pdf);
      if (report) downloadPDF('quality', report);
    });
  });

  tbody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => {
      const report = allReports.find(r => r.id === btn.dataset.delete);
      if (report) confirmDelete(report);
    });
  });
}

function showReportDetail(report) {
  let compartmentsHTML = '';
  if (report.compartments && Array.isArray(report.compartments)) {
    compartmentsHTML = `
      <div class="detail-item full-width">
        <label>Compartments (${report.compartments.length})</label>
        <div style="margin-top:8px;">
          <table class="data-table" style="font-size:0.82rem;">
            <thead>
              <tr>
                <th>No.</th>
                <th>Product</th>
                <th>Volume</th>
                <th>Seal No.</th>
              </tr>
            </thead>
            <tbody>
              ${report.compartments.map((c, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${c.product || c.name || '—'}</td>
                  <td>${c.volume || c.qty || c.quantity || '—'}</td>
                  <td>${c.seal_number || c.sealNo || c.seal || '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  let paramsHTML = '';
  if (report.quality_params && typeof report.quality_params === 'object') {
    const params = Array.isArray(report.quality_params) ? report.quality_params : Object.entries(report.quality_params);
    if (Array.isArray(report.quality_params)) {
      paramsHTML = `
        <div class="detail-item full-width">
          <label>Quality Parameters</label>
          <div class="checklist-grid" style="margin-top:8px;">
            ${report.quality_params.map(p => `
              <div class="checklist-item">
                <span style="font-weight:500;color:var(--text-primary);">${p.name || p.parameter || p.label || 'Param'}</span>
                <span style="margin-left:auto;color:var(--accent-secondary);">${p.value || p.result || '—'}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      paramsHTML = `
        <div class="detail-item full-width">
          <label>Quality Parameters</label>
          <div class="checklist-grid" style="margin-top:8px;">
            ${params.map(([key, val]) => `
              <div class="checklist-item">
                <span style="font-weight:500;color:var(--text-primary);">${key}</span>
                <span style="margin-left:auto;color:var(--accent-secondary);">${val}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-content" style="max-width: 800px; width: 90%;">
      <div class="modal-header">
        <h3>Quality Data Report</h3>
        <div style="display:flex;gap:8px;align-items:center;">
          <button class="action-btn" id="modal-pdf-btn" style="background:var(--accent-primary);color:#fff;padding:8px 16px;border-radius:6px;font-weight:600;font-size:12px;">📄 Download PDF</button>
          <button class="modal-close" id="modal-close-btn">✕</button>
        </div>
      </div>
      <div class="modal-body">
        <div class="inspection-meta-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid var(--glass-border);">
          <div class="detail-item">
            <label>Product</label>
            <div class="value">${report.product || 'N/A'}</div>
          </div>
          <div class="detail-item">
            <label>Company</label>
            <div class="value">${report.company_name || 'N/A'}</div>
          </div>
          <div class="detail-item">
            <label>Truck Number</label>
            <div class="value">${report.truck_number || 'N/A'}</div>
          </div>
          <div class="detail-item">
            <label>Inspector</label>
            <div class="value">${report.inspector_name || 'N/A'}</div>
          </div>
          <div class="detail-item">
            <label>Depot</label>
            <div class="value">${report.depot || 'N/A'}</div>
          </div>
          <div class="detail-item">
            <label>Sealer</label>
            <div class="value">${report.sealer_name || 'N/A'}</div>
          </div>
          <div class="detail-item full-width">
            <label>Date</label>
            <div class="value">${report.created_at ? new Date(report.created_at).toLocaleString() : 'N/A'}</div>
          </div>
          ${compartmentsHTML}
          ${paramsHTML}
          <div class="detail-item full-width">
            <label>Report ID</label>
            <div class="value" style="font-size:0.78rem;font-family:monospace;color:var(--text-muted);">${report.id}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector('#modal-close-btn').addEventListener('click', close);
  overlay.querySelector('#modal-pdf-btn').addEventListener('click', () => downloadPDF('quality', report));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
}

function confirmDelete(report) {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-box">
      <h4>Delete Quality Report</h4>
      <p>Delete quality report for <strong>${report.product || 'N/A'}</strong> (${report.company_name || 'N/A'})? This cannot be undone.</p>
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
      await supabase.from('quality_reports').delete().eq('id', report.id);
      allReports = allReports.filter(r => r.id !== report.id);
      renderTable();
      overlay.remove();
    } catch (e) {
      console.error('Delete error:', e);
      btn.textContent = 'Error!';
      setTimeout(() => overlay.remove(), 1500);
    }
  });
}
