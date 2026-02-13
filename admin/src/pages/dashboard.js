import { supabase } from '../supabase.js';

export async function renderDashboard(container) {
    container.innerHTML = `
    <div class="stats-grid animate-in">
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Total Users</span>
          <div class="stat-icon blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
        </div>
        <div class="stat-value" id="stat-users">--</div>
        <div class="stat-change">Registered accounts</div>
      </div>
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Inspections</span>
          <div class="stat-icon green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
        </div>
        <div class="stat-value" id="stat-inspections">--</div>
        <div class="stat-change">Total inspections</div>
      </div>
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Quality Reports</span>
          <div class="stat-icon purple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
        </div>
        <div class="stat-value" id="stat-quality">--</div>
        <div class="stat-change">Total reports</div>
      </div>
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Managers</span>
          <div class="stat-icon amber">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
        </div>
        <div class="stat-value" id="stat-managers">--</div>
        <div class="stat-change">Admin accounts</div>
      </div>
    </div>

    <div class="table-card animate-in" style="animation-delay: 0.1s;">
      <div class="table-header">
        <h3>Recent Activity</h3>
      </div>
      <div id="recent-activity">
        <div style="padding: 20px 24px;">
          <div class="skeleton skeleton-row"></div>
          <div class="skeleton skeleton-row"></div>
          <div class="skeleton skeleton-row"></div>
        </div>
      </div>
    </div>
  `;

    // Fetch stats
    try {
        const [usersRes, inspectionsRes, qualityRes, managersRes] = await Promise.all([
            supabase.from('profiles').select('id', { count: 'exact', head: true }),
            supabase.from('inspections').select('id', { count: 'exact', head: true }),
            supabase.from('quality_reports').select('id', { count: 'exact', head: true }),
            supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'manager'),
        ]);

        animateCounter('stat-users', usersRes.count || 0);
        animateCounter('stat-inspections', inspectionsRes.count || 0);
        animateCounter('stat-quality', qualityRes.count || 0);
        animateCounter('stat-managers', managersRes.count || 0);
    } catch (e) {
        console.error('Stats error:', e);
    }

    // Fetch recent activity
    try {
        const [inspections, reports] = await Promise.all([
            supabase.from('inspections').select('id, inspector_name, truck_number, status, created_at').order('created_at', { ascending: false }).limit(5),
            supabase.from('quality_reports').select('id, inspector_name, product, company_name, created_at').order('created_at', { ascending: false }).limit(5),
        ]);

        const activities = [];

        (inspections.data || []).forEach(i => {
            activities.push({
                type: 'inspection',
                text: `<strong>${i.inspector_name || 'Unknown'}</strong> submitted an inspection for truck <strong>${i.truck_number || 'N/A'}</strong>`,
                time: i.created_at,
                color: 'green',
            });
        });

        (reports.data || []).forEach(r => {
            activities.push({
                type: 'quality',
                text: `<strong>${r.inspector_name || 'Unknown'}</strong> filed a quality report for <strong>${r.product || 'N/A'}</strong>`,
                time: r.created_at,
                color: 'purple',
            });
        });

        activities.sort((a, b) => new Date(b.time) - new Date(a.time));

        const activityContainer = document.getElementById('recent-activity');
        if (activities.length === 0) {
            activityContainer.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p>No recent activity</p>
        </div>
      `;
        } else {
            activityContainer.innerHTML = `
        <div class="activity-list">
          ${activities.slice(0, 8).map(a => `
            <div class="activity-item">
              <div class="activity-dot ${a.color}"></div>
              <div>
                <div class="activity-text">${a.text}</div>
                <div class="activity-time">${formatTimeAgo(a.time)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
        }
    } catch (e) {
        console.error('Activity error:', e);
    }
}

function animateCounter(elementId, target) {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (target === 0) { el.textContent = '0'; return; }
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 30));
    const interval = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(interval);
        }
        el.textContent = current.toLocaleString();
    }, 30);
}

function formatTimeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
}
