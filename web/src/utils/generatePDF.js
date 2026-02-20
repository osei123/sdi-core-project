/**
 * PDF Report Generator — Web App
 * Uses the same visual design as the mobile/admin pdfGenerator.js.
 * Opens a styled HTML page in a new tab with a print/download toolbar.
 */

// --- HELPERS ---

const formatImage = (str) => {
    if (!str) return null;
    if (str.startsWith('data:image') || str.startsWith('http')) return str;
    return `data:image/png;base64,${str}`;
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
};

const getStatusColor = (status) => {
    switch (status) {
        case 'PASS': return '#22c55e';
        case 'FAIL': return '#ef4444';
        case 'GROUNDED': return '#dc2626';
        case 'MONITOR': return '#ca8a04';
        default: return '#6b7280';
    }
};

const getStatusText = (status) => {
    switch (status) {
        case 'PASS': return 'OPERATIONAL';
        case 'FAIL': return 'SAFETY ISSUE';
        case 'GROUNDED': return 'UNSAFE - GROUNDED';
        case 'MONITOR': return 'SAFE TO DRIVE (MONITOR)';
        default: return status || 'UNKNOWN';
    }
};

const checkIcon = (status) =>
    status === 'PASS'
        ? '<span style="color:green; font-weight:bold; font-size: 14px;">&#9745; PASS</span>'
        : '<span style="color:red; font-weight:bold; font-size: 14px;">&#9746; FAIL</span>';

// --- INSPECTION REPORT (matches mobile template) ---

function createInspectionHTML(data) {
    const statusColor = getStatusColor(data.status);
    const statusText = getStatusText(data.status);

    const items = data.results || data.items || [];
    const rows = items.map((i) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px; width: 25%; font-weight: bold; vertical-align: top; font-size: 13px;">${i.title}</td>
            <td style="padding: 12px; width: 35%; color: #4b5563; font-size: 11px; vertical-align: top; line-height: 1.4;">
                ${i.desc || 'No description available'}
                ${i.image ? `<br/><br/><img src="${formatImage(i.image)}" style="width: 100px; height: 100px; border-radius: 4px; border: 1px solid #ccc; margin-top: 5px;" />` : ''}
            </td>
            <td style="padding: 12px; width: 15%; text-align: center; vertical-align: top;">${checkIcon(i.status)}</td>
            <td style="padding: 12px; width: 25%; vertical-align: top; background-color: ${i.status === 'FAIL' ? '#fef2f2' : 'transparent'};">
                ${i.severity ? `<div style="color:${i.severity === 'CRITICAL' ? '#dc2626' : '#ca8a04'}; font-weight:bold; font-size:10px; margin-bottom:4px;">${i.severity}</div>` : ''}
                <div style="font-style: italic; color: #374151; font-size: 11px;">${i.note || ''}</div>
            </td>
        </tr>
    `).join('');

    const driverSig = formatImage(data.driverSignature || data.driver_signature);
    const inspectorSig = formatImage(data.inspectorSignature || data.inspector_signature);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Inspection Report — ${data.truck || data.truck_number || 'Report'}</title>
    <style>
        body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #111827; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 4px solid ${statusColor}; padding-bottom: 20px; }
        .company-name { font-size: 26px; font-weight: 800; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
        .report-title { font-size: 14px; letter-spacing: 2px; color: #6b7280; text-transform: uppercase; }
        .info-box { display: flex; flex-wrap: wrap; gap: 20px; background-color: #f9fafb; padding: 25px; border-radius: 12px; margin-bottom: 40px; border: 1px solid #e5e7eb; }
        .info-item { width: 45%; margin-bottom: 15px; }
        .label { font-size: 9px; text-transform: uppercase; color: #9ca3af; font-weight: 700; margin-bottom: 3px; }
        .value { font-size: 15px; font-weight: 600; color: #1f2937; border-bottom: 1px solid #d1d5db; padding-bottom: 3px; display: block; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background-color: #1f2937; color: #ffffff; padding: 12px; text-align: left; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; }
        .footer { margin-top: 60px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        .signature-row { display: flex; justify-content: space-between; margin-top: 50px; padding-top: 20px; }
        .sig-block { width: 45%; text-align: center; }
        .sig-img { width: 100%; max-width: 200px; height: auto; border-bottom: 1px solid #000; margin-bottom: 8px; }
        .sig-title { font-weight: bold; font-size: 12px; text-transform: uppercase; }
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            @page { margin: 0.5in; size: A4; }
        }
        .download-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #1f2937; padding: 12px 24px; display: flex; justify-content: center; gap: 12px; z-index: 100; }
        .download-bar button { padding: 10px 28px; border: none; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; font-family: inherit; }
        .btn-dl { background: #22c55e; color: #fff; }
        .btn-dl:hover { background: #16a34a; }
        .btn-close { background: #374151; color: #e2e8f0; }
        .btn-close:hover { background: #4b5563; }
    </style>
</head>
<body>
    <div class="download-bar no-print">
        <button class="btn-dl" onclick="window.print()">⬇ Download as PDF</button>
        <button class="btn-close" onclick="window.close()">✕ Close Preview</button>
    </div>

    <div class="header">
        <div class="company-name">JP TRUSTEES LIMITED</div>
        <div class="report-title">Truck Inspection Report</div>
    </div>

    <div class="info-box">
        <div class="info-item"><span class="label">Inspector</span><span class="value">${data.inspectorName || data.inspector_name || 'Unknown'}</span></div>
        <div class="info-item"><span class="label">Date & Time</span><span class="value">${formatDate(data.created_at || data.timestamp)}</span></div>
        <div class="info-item"><span class="label">Driver Name</span><span class="value">${data.driver || data.driver_name || 'N/A'}</span></div>
        <div class="info-item"><span class="label">Truck Number</span><span class="value">${data.truck || data.truck_number || '-'}</span></div>
        <div class="info-item"><span class="label">Depot Location</span><span class="value">${data.depot || '-'}</span></div>
        <div class="info-item"><span class="label">Result</span><span class="value" style="color: ${statusColor}; font-weight: 800;">${statusText}</span></div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 25%">Inspection Item</th>
                <th style="width: 35%">Description</th>
                <th style="width: 15%; text-align: center;">Result</th>
                <th style="width: 25%">Notes / Defects</th>
            </tr>
        </thead>
        <tbody>
            ${rows || '<tr><td colspan="4" style="padding:20px;text-align:center;color:#9ca3af;">No checklist data</td></tr>'}
        </tbody>
    </table>

    <div class="signature-row">
        <div class="sig-block">
            ${driverSig ? `<img src="${driverSig}" class="sig-img" />` : '<div style="height: 50px; border-bottom: 1px solid #000;"></div>'}
            <div class="sig-title">Driver Signature</div>
            <div style="font-size: 10px; color: #666;">${data.driver || data.driver_name || 'Driver'}</div>
        </div>

        <div class="sig-block">
            ${inspectorSig ? `<img src="${inspectorSig}" class="sig-img" />` : '<div style="height: 50px; border-bottom: 1px solid #000;"></div>'}
            <div class="sig-title">Inspector Signature</div>
            <div style="font-size: 10px; color: #666;">${data.inspectorName || data.inspector_name || 'Inspector'}</div>
        </div>
    </div>

    <div class="footer">Generated via Smart Digital Inspection (SDI) Core &bull; Validated by ${data.inspectorName || data.inspector_name || 'Inspector'}</div>
</body>
</html>`;
}

// --- QUALITY REPORT (matches mobile template) ---

function createQualityHTML(data) {
    const themeColor = (data.company_name || '').toUpperCase().includes('MOREFUEL') ? '#E31E24' : '#7CB342';
    const randomNum = Math.floor(Math.random() * 99999) + 1;
    const invoiceNumber = String(randomNum).padStart(5, '0');

    const compartments = data.compartments || [];
    const quality = data.quality_params || {};

    const inspectorSig = formatImage(data.inspectorSignature || data.inspector_signature);
    const sealerSig = formatImage(data.sealer_signature);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Quality Report — ${data.truck_number || data.truck || 'Report'}</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; margin: 0; padding: 40px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .header { border-bottom: 3px solid ${themeColor}; padding-bottom: 10px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end; }
        .header-title { font-size: 28px; font-weight: bold; color: ${themeColor}; text-transform: uppercase; }
        .header-meta { text-align: right; font-size: 12px; color: #666; }
        .section-title { background-color: ${themeColor}; color: white; padding: 8px 15px; font-size: 16px; font-weight: bold; border-radius: 4px; margin-top: 20px; margin-bottom: 10px; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 13px; }
        th { background-color: #f0f0f0; border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold; }
        td { border: 1px solid #ddd; padding: 8px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .col { flex: 1; margin-right: 15px; }
        .col:last-child { margin-right: 0; }
        .key-value-box { background: #fafafa; border: 1px solid #eee; padding: 10px; border-radius: 4px; margin-bottom: 5px; }
        .label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
        .value { font-size: 14px; font-weight: bold; color: #000; margin-top: 3px; }
        .footer-box { margin-top: 20px; border: 1px solid #ddd; padding: 15px; border-radius: 8px; background-color: #fcfcfc; page-break-inside: avoid; }
        .sig-block { margin-top: 10px; border-bottom: 1px solid #333; padding-bottom: 5px; min-height: 40px; }
        .sig-img { height: 50px; width: auto; }
        @media print {
            .no-print { display: none !important; }
            @page { margin: 0.5in; size: A4; }
        }
        .download-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #1f2937; padding: 12px 24px; display: flex; justify-content: center; gap: 12px; z-index: 100; }
        .download-bar button { padding: 10px 28px; border: none; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; font-family: inherit; }
        .btn-dl { background: ${themeColor}; color: #fff; }
        .btn-close { background: #374151; color: #e2e8f0; }
    </style>
</head>
<body>
    <div class="download-bar no-print">
        <button class="btn-dl" onclick="window.print()">⬇ Download as PDF</button>
        <button class="btn-close" onclick="window.close()">✕ Close Preview</button>
    </div>

    <div class="header">
        <div>
            <div class="header-title">QUALITY DATA - ${(data.company_name || '').toUpperCase()}</div>
        </div>
        <div class="header-meta">
            <span style="font-size: 12px; font-weight: bold; color: #000; display: block; margin-bottom: 2px;">INVOICE #: ${invoiceNumber}</span>
            Generated: ${formatDate(new Date())}<br/>Status: Final
        </div>
    </div>

    <div class="section-title">Truck Information</div>
    <div class="row">
        <div class="col key-value-box"><div class="label">Truck Number</div><div class="value">${data.truck_number || data.truck || '-'}</div></div>
        <div class="col key-value-box"><div class="label">Product</div><div class="value">${data.product || '-'}</div></div>
        <div class="col key-value-box"><div class="label">Depot</div><div class="value">${data.depot || '-'}</div></div>
    </div>

    <div class="section-title">Compartment Levels</div>
    <table>
        <thead><tr><th style="width: 10%">Number</th><th>Litres</th><th>Certificate Level</th><th>Product Level</th></tr></thead>
        <tbody>
            ${compartments.map((comp) => `<tr><td style="text-align: center; font-weight: bold;">${comp.id}</td><td>${comp.litres || '-'}</td><td>${comp.cert || '-'}</td><td>${comp.prod || '-'}</td></tr>`).join('')}
        </tbody>
    </table>

    <div class="section-title">Product Quality Parameters</div>
    <div class="row">
        <div class="col">
            <div class="key-value-box"><div class="label">Density</div><div class="value">${quality.density || '-'} kg/m³</div></div>
            <div class="key-value-box"><div class="label">Temperature</div><div class="value">${quality.temp || '-'} °C</div></div>
            <div class="key-value-box"><div class="label">Water Status</div><div class="value">${quality.water || '-'}</div></div>
        </div>
        <div class="col">
            <div class="key-value-box"><div class="label">Diff Comp Level</div><div class="value">${quality.diffComp || '-'} Lts</div></div>
            <div class="key-value-box"><div class="label">Additive</div><div class="value">${quality.additive || '-'} Lts</div></div>
            <div class="key-value-box"><div class="label">Product Color</div><div class="value">${quality.color || '-'}</div></div>
        </div>
    </div>

    <div class="footer-box">
        <div class="section-title" style="margin-top: 0; font-size: 14px;">Authorization</div>
        <div class="row">
            <div class="col">
                <div class="label">Inspector Name</div><div class="value">${data.inspectorName || data.inspector_name || '_________________'}</div>
                <div style="margin-top: 15px;" class="label">Inspector Signature</div>
                <div class="sig-block">${inspectorSig ? `<img src="${inspectorSig}" class="sig-img" />` : ''}</div>
            </div>
            <div class="col">
                <div class="label">Sealer Name</div><div class="value">${data.sealer_name || '_________________'}</div>
                <div style="margin-top: 15px;" class="label">Sealer Signature</div>
                <div class="sig-block">${sealerSig ? `<img src="${sealerSig}" class="sig-img" />` : ''}</div>
            </div>
        </div>
    </div>
</body>
</html>`;
}

// --- PUBLIC API ---

export function generateInspectionPDF(item) {
    const html = createInspectionHTML(item);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
    }
}

export function generateQualityPDF(item) {
    const html = createQualityHTML(item);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
    }
}

/**
 * Bulk export — summary table of all inspection records.
 */
export function generateBulkExportPDF(historyData) {
    const rows = historyData.map((item) => {
        const color = getStatusColor(item.status);
        return `
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding:8px 10px;font-size:11px;">${formatDate(item.created_at || item.timestamp)}</td>
                <td style="padding:8px 10px;font-size:11px;font-weight:600;">${item.truck || item.truck_number || '—'}</td>
                <td style="padding:8px 10px;font-size:11px;">${item.driver || item.driver_name || '—'}</td>
                <td style="padding:8px 10px;font-size:11px;">${item.transporter || '—'}</td>
                <td style="padding:8px 10px;font-size:11px;">${item.depot || '—'}</td>
                <td style="padding:8px 10px;font-size:11px;">${item.inspectorName || item.inspector_name || '—'}</td>
                <td style="padding:8px 10px;text-align:center;">
                    <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700;color:#fff;background:${color};">${item.status}</span>
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
        body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #111827; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 4px solid #1f2937; padding-bottom: 20px; }
        .company-name { font-size: 26px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
        .report-title { font-size: 14px; letter-spacing: 2px; color: #6b7280; text-transform: uppercase; margin-top: 5px; }
        .summary { display: flex; gap: 20px; margin-bottom: 30px; }
        .summary .box { flex: 1; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center; }
        .summary .box .num { font-size: 28px; font-weight: 800; }
        .summary .box .desc { font-size: 10px; color: #6b7280; text-transform: uppercase; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background-color: #1f2937; color: #ffffff; padding: 10px; text-align: left; text-transform: uppercase; font-size: 9px; letter-spacing: 1px; }
        .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            @page { margin: 0.5in; size: A4 landscape; }
        }
        .download-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #1f2937; padding: 12px 24px; display: flex; justify-content: center; gap: 12px; z-index: 100; }
        .download-bar button { padding: 10px 28px; border: none; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; font-family: inherit; }
        .btn-dl { background: #22c55e; color: #fff; }
        .btn-close { background: #374151; color: #e2e8f0; }
    </style>
</head>
<body>
    <div class="download-bar no-print">
        <button class="btn-dl" onclick="window.print()">⬇ Download as PDF</button>
        <button class="btn-close" onclick="window.close()">✕ Close Preview</button>
    </div>

    <div class="header">
        <div class="company-name">JP TRUSTEES LIMITED</div>
        <div class="report-title">Inspection Log Export &mdash; ${historyData.length} Records</div>
    </div>

    <div class="summary">
        <div class="box"><div class="num" style="color:#16a34a;">${totalPass}</div><div class="desc">Operational</div></div>
        <div class="box"><div class="num" style="color:#ca8a04;">${totalMonitor}</div><div class="desc">Monitor</div></div>
        <div class="box"><div class="num" style="color:#dc2626;">${totalFail}</div><div class="desc">Grounded</div></div>
        <div class="box"><div class="num">${historyData.length}</div><div class="desc">Total</div></div>
    </div>

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

    <div class="footer">Generated via Smart Digital Inspection (SDI) Core &mdash; ${new Date().toLocaleString()}</div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
    }
}
