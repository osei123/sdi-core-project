/**
 * Generate a professional PDF inspection report by opening a styled
 * HTML page in a new window and triggering the browser print dialog.
 * Users can "Save as PDF" from their browser's native print dialog.
 */

const statusConfig = {
    GROUNDED: { label: 'GROUNDED (UNSAFE)', color: '#dc2626', bg: '#fef2f2' },
    MONITOR: { label: 'SAFE TO DRIVE (MONITOR)', color: '#ca8a04', bg: '#fefce8' },
    OPERATIONAL: { label: 'OPERATIONAL', color: '#16a34a', bg: '#f0fdf4' },
};

export function generateInspectionPDF(item) {
    const results = item.results || [];
    const passes = results.filter((r) => r.status === 'PASS');
    const fails = results.filter((r) => r.status === 'FAIL');
    const cfg = statusConfig[item.status] || statusConfig.OPERATIONAL;

    const checklistRows = results.map((r) => {
        const severityBadge = r.severity
            ? `<span style="
                display:inline-block;
                padding:2px 8px;
                border-radius:4px;
                font-size:9px;
                font-weight:700;
                color:#fff;
                background:${r.severity === 'CRITICAL' ? '#dc2626' : r.severity === 'MODERATE' ? '#ca8a04' : '#2563eb'};
            ">${r.severity}</span>`
            : '';
        const note = r.note ? `<div style="font-size:10px;color:#6b7280;font-style:italic;margin-top:2px;">Note: ${r.note}</div>` : '';
        return `
            <tr>
                <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#6b7280;">${r.category || '—'}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">
                    <div style="font-weight:600;font-size:12px;color:#111827;">${r.title}</div>
                    <div style="font-size:10px;color:#6b7280;margin-top:1px;">${r.desc || ''}</div>
                    ${note}
                </td>
                <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">
                    <span style="
                        display:inline-block;
                        padding:3px 10px;
                        border-radius:4px;
                        font-size:10px;
                        font-weight:700;
                        color:#fff;
                        background:${r.status === 'PASS' ? '#16a34a' : '#dc2626'};
                    ">${r.status}</span>
                </td>
                <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${severityBadge || '—'}</td>
            </tr>
        `;
    }).join('');

    // Signature images
    const driverSig = item.driverSignature
        ? `<div style="text-align:center;"><img src="${item.driverSignature}" style="max-width:200px;max-height:80px;border:1px solid #e5e7eb;border-radius:4px;" /><div style="font-size:10px;color:#6b7280;margin-top:4px;">Driver Signature</div></div>`
        : '<div style="text-align:center;color:#9ca3af;font-size:11px;">No driver signature</div>';
    const inspectorSig = item.inspectorSignature
        ? `<div style="text-align:center;"><img src="${item.inspectorSignature}" style="max-width:200px;max-height:80px;border:1px solid #e5e7eb;border-radius:4px;" /><div style="font-size:10px;color:#6b7280;margin-top:4px;">Inspector Signature</div></div>`
        : '<div style="text-align:center;color:#9ca3af;font-size:11px;">No inspector signature</div>';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Inspection Report — ${item.truck}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', -apple-system, sans-serif; color: #111827; background: #fff; }
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            @page { margin: 0.6in; size: A4; }
        }
        .header { background: #0f172a; color: #fff; padding: 28px 32px; display: flex; justify-content: space-between; align-items: center; }
        .header .brand { font-size: 22px; font-weight: 800; letter-spacing: 1px; }
        .header .brand span { color: #2dd4bf; }
        .header .meta { text-align: right; font-size: 11px; color: #94a3b8; }
        .status-banner {
            padding: 16px 32px; display: flex; justify-content: space-between; align-items: center;
            background: ${cfg.bg}; border-bottom: 3px solid ${cfg.color};
        }
        .status-banner .label { font-size: 18px; font-weight: 800; color: ${cfg.color}; }
        .status-banner .stats { display: flex; gap: 24px; }
        .status-banner .stat { text-align: center; }
        .status-banner .stat .num { font-size: 24px; font-weight: 800; color: #111827; }
        .status-banner .stat .desc { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
        .section { padding: 20px 32px; }
        .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 12px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .info-item { background: #f9fafb; border-radius: 6px; padding: 12px 16px; }
        .info-item .label { font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px; }
        .info-item .value { font-size: 14px; font-weight: 600; color: #111827; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 10px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; border-bottom: 2px solid #e5e7eb; background: #f9fafb; }
        .signatures { display: flex; gap: 32px; justify-content: center; margin-top: 8px; }
        .footer { text-align: center; padding: 16px; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; margin-top: 24px; }
        .download-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #0f172a; padding: 12px 24px; display: flex; justify-content: center; gap: 12px; z-index: 100; }
        .download-bar button { padding: 10px 28px; border: none; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; font-family: inherit; }
        .btn-dl { background: #2dd4bf; color: #0f172a; }
        .btn-dl:hover { background: #5eead4; }
        .btn-close { background: #334155; color: #e2e8f0; }
        .btn-close:hover { background: #475569; }
    </style>
</head>
<body>
    <!-- Action bar (hidden during print) -->
    <div class="download-bar no-print">
        <button class="btn-dl" onclick="window.print()">⬇ Download as PDF</button>
        <button class="btn-close" onclick="window.close()">✕ Close Preview</button>
    </div>

    <!-- Report -->
    <div class="header">
        <div>
            <div class="brand">SDI <span>CORE</span></div>
            <div style="font-size:11px;color:#94a3b8;margin-top:4px;">Safety & Distribution Inspection Report</div>
        </div>
        <div class="meta">
            <div style="font-weight:600;color:#e2e8f0;">Report #${item.id ? item.id.slice(0, 8).toUpperCase() : '—'}</div>
            <div>${item.timestamp}</div>
        </div>
    </div>

    <div class="status-banner">
        <div class="label">${cfg.label}</div>
        <div class="stats">
            <div class="stat"><div class="num">${results.length}</div><div class="desc">Total Items</div></div>
            <div class="stat"><div class="num" style="color:#16a34a;">${passes.length}</div><div class="desc">Passed</div></div>
            <div class="stat"><div class="num" style="color:#dc2626;">${fails.length}</div><div class="desc">Failed</div></div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Inspection Details</div>
        <div class="info-grid">
            <div class="info-item"><div class="label">Driver</div><div class="value">${item.driver || '—'}</div></div>
            <div class="info-item"><div class="label">Truck Number</div><div class="value">${item.truck || '—'}</div></div>
            <div class="info-item"><div class="label">Transporter</div><div class="value">${item.transporter || '—'}</div></div>
            <div class="info-item"><div class="label">Depot</div><div class="value">${item.depot || '—'}</div></div>
            <div class="info-item"><div class="label">Inspector</div><div class="value">${item.inspectorName || '—'}</div></div>
            <div class="info-item"><div class="label">Date & Time</div><div class="value">${item.timestamp}</div></div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Checklist Results</div>
        <table>
            <thead>
                <tr>
                    <th style="width:15%;">Category</th>
                    <th style="width:50%;">Item</th>
                    <th style="width:15%;text-align:center;">Result</th>
                    <th style="width:20%;text-align:center;">Severity</th>
                </tr>
            </thead>
            <tbody>${checklistRows || '<tr><td colspan="4" style="padding:20px;text-align:center;color:#9ca3af;">No checklist data available</td></tr>'}</tbody>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Signatures</div>
        <div class="signatures">
            ${driverSig}
            ${inspectorSig}
        </div>
    </div>

    <div class="footer">
        SDI Core Inspection System &mdash; Confidential Report &mdash; Generated ${new Date().toLocaleString()}
    </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
    }
}

/**
 * Generate a bulk PDF export of all inspection records (summary table).
 */
export function generateBulkExportPDF(historyData) {
    const rows = historyData.map((item) => {
        const cfg = statusConfig[item.status] || statusConfig.OPERATIONAL;
        return `
            <tr>
                <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;">${item.timestamp}</td>
                <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;font-weight:600;">${item.truck}</td>
                <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;">${item.driver}</td>
                <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;">${item.transporter || '—'}</td>
                <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;">${item.depot || '—'}</td>
                <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;">${item.inspectorName || '—'}</td>
                <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:center;">
                    <span style="
                        display:inline-block;padding:2px 8px;border-radius:4px;
                        font-size:9px;font-weight:700;color:#fff;
                        background:${cfg.color};
                    ">${item.status}</span>
                </td>
            </tr>`;
    }).join('');

    const totalPass = historyData.filter((h) => h.status === 'OPERATIONAL').length;
    const totalFail = historyData.filter((h) => h.status === 'GROUNDED').length;
    const totalMonitor = historyData.filter((h) => h.status === 'MONITOR').length;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>SDI Core — Full Inspection Log</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', -apple-system, sans-serif; color: #111827; background: #fff; }
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            @page { margin: 0.5in; size: A4 landscape; }
        }
        .header { background: #0f172a; color: #fff; padding: 24px 28px; display: flex; justify-content: space-between; align-items: center; }
        .header .brand { font-size: 20px; font-weight: 800; letter-spacing: 1px; }
        .header .brand span { color: #2dd4bf; }
        .summary { display: flex; gap: 20px; padding: 16px 28px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
        .summary .box { padding: 12px 20px; border-radius: 6px; text-align: center; flex: 1; }
        .summary .box .num { font-size: 28px; font-weight: 800; }
        .summary .box .desc { font-size: 10px; color: #6b7280; text-transform: uppercase; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin-top: 4px; }
        th { text-align: left; padding: 8px 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; border-bottom: 2px solid #e5e7eb; background: #f9fafb; }
        .footer { text-align: center; padding: 12px; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; margin-top: 16px; }
        .download-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #0f172a; padding: 12px 24px; display: flex; justify-content: center; gap: 12px; z-index: 100; }
        .download-bar button { padding: 10px 28px; border: none; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; font-family: inherit; }
        .btn-dl { background: #2dd4bf; color: #0f172a; }
        .btn-close { background: #334155; color: #e2e8f0; }
    </style>
</head>
<body>
    <div class="download-bar no-print">
        <button class="btn-dl" onclick="window.print()">⬇ Download as PDF</button>
        <button class="btn-close" onclick="window.close()">✕ Close Preview</button>
    </div>

    <div class="header">
        <div>
            <div class="brand">SDI <span>CORE</span></div>
            <div style="font-size:11px;color:#94a3b8;margin-top:4px;">Inspection Log Export</div>
        </div>
        <div style="text-align:right;font-size:11px;color:#94a3b8;">
            <div>${historyData.length} Records</div>
            <div>Generated ${new Date().toLocaleString()}</div>
        </div>
    </div>

    <div class="summary">
        <div class="box" style="background:#f0fdf4;"><div class="num" style="color:#16a34a;">${totalPass}</div><div class="desc">Operational</div></div>
        <div class="box" style="background:#fefce8;"><div class="num" style="color:#ca8a04;">${totalMonitor}</div><div class="desc">Monitor</div></div>
        <div class="box" style="background:#fef2f2;"><div class="num" style="color:#dc2626;">${totalFail}</div><div class="desc">Grounded</div></div>
        <div class="box" style="background:#f1f5f9;"><div class="num">${historyData.length}</div><div class="desc">Total</div></div>
    </div>

    <div style="padding:16px 28px 60px;">
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Truck</th>
                    <th>Driver</th>
                    <th>Transporter</th>
                    <th>Depot</th>
                    <th>Inspector</th>
                    <th style="text-align:center;">Status</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    </div>

    <div class="footer">SDI Core Inspection System &mdash; Confidential &mdash; ${new Date().toLocaleString()}</div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
    }
}
