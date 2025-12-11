export const createSingleReportHTML = (item, logoBase64) => {
    // 1. Determine Color and Text based on status
    let statusColor = '#22c55e'; // Green
    let statusText = 'OPERATIONAL';

    if (item.status === 'GROUNDED') {
        statusColor = '#dc2626'; // Red
        statusText = 'UNSAFE - GROUNDED';
    } else if (item.status === 'MONITOR') {
        statusColor = '#ca8a04'; // Dark Yellow/Gold
        statusText = 'SAFE TO DRIVE (MONITOR)';
    }

    // Helper for Pass/Fail icons in the table
    const check = (status) =>
        status === 'PASS'
            ? '<span style="color:green; font-weight:bold; font-size: 14px;">&#9745; PASS</span>'
            : '<span style="color:red; font-weight:bold; font-size: 14px;">&#9746; FAIL</span>';

    // Build the rows for the table
    const rows = item.items
        .map(
            (i) => `
  <tr style="border-bottom: 1px solid #e5e7eb;">
    <td style="padding: 12px; width: 25%; font-weight: bold; vertical-align: top; font-size: 13px;">${i.title
                }</td>
    <td style="padding: 12px; width: 35%; color: #4b5563; font-size: 11px; vertical-align: top; line-height: 1.4;">
      ${i.desc || 'No description available'}
      ${i.image
                    ? `<br/><br/><img src="${i.image}" style="width: 100px; height: 100px; border-radius: 4px; border: 1px solid #ccc; margin-top: 5px;" />`
                    : ''
                }
    </td>
    <td style="padding: 12px; width: 15%; text-align: center; vertical-align: top;">${check(
                    i.status
                )}</td>
    <td style="padding: 12px; width: 25%; vertical-align: top; background-color: ${i.status === 'FAIL' ? '#fef2f2' : 'transparent'
                };">
      ${i.severity
                    ? `<div style="color:${i.severity === 'CRITICAL' ? '#dc2626' : '#ca8a04'
                    }; font-weight:bold; font-size:10px; margin-bottom:4px;">${i.severity
                    }</div>`
                    : ''
                }
      <div style="font-style: italic; color: #374151; font-size: 11px;">${i.note || ''
                }</div>
    </td>
  </tr>
`
        )
        .join('');

    return `
    <html>
      <head>
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
        </style>
      </head>
      <body>
        
        <div class="header">
          ${logoBase64
            ? `<img src="${logoBase64}" style="width: 100px; height: auto; margin-bottom: 15px;" />`
            : ''
        }
          <div class="company-name">JP TRUSTEES LIMITED</div>
          <div class="report-title">Truck Inspection Report</div>
        </div>

        <div class="info-box">
          <div class="info-item"><span class="label">Inspector</span><span class="value">${item.inspector || 'Unknown'
        }</span></div>
          
          <div class="info-item"><span class="label">Date & Time</span><span class="value">${item.timestamp
        }</span></div>

          <div class="info-item"><span class="label">Driver Name</span><span class="value">${item.driverName || 'N/A'
        }</span></div>

          <div class="info-item"><span class="label">Truck Number</span><span class="value">${item.truck
        }</span></div>
          
          <div class="info-item"><span class="label">Depot Location</span><span class="value">${item.depot || '-'
        }</span></div>
          
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
            ${rows}
          </tbody>
        </table>

        <div class="signature-row">
            <div class="sig-block">
                ${item.driverSignature
            ? `<img src="${item.driverSignature}" class="sig-img" />`
            : '<div style="height: 50px; border-bottom: 1px solid #000;"></div>'
        }
                <div class="sig-title">Driver Signature</div>
                <div style="font-size: 10px; color: #666;">${item.driverName || 'Driver'
        }</div>
            </div>

            <div class="sig-block">
                ${item.inspectorSignature
            ? `<img src="${item.inspectorSignature}" class="sig-img" />`
            : '<div style="height: 50px; border-bottom: 1px solid #000;"></div>'
        }
                <div class="sig-title">Inspector Signature</div>
                <div style="font-size: 10px; color: #666;">${item.inspector || 'Inspector'
        }</div>
            </div>
        </div>

        <div class="footer">Generated via Smart Digital Inspection (SDI) Core • Validated by ${item.inspector
        }</div>
      </body>
    </html>
  `;
};

// 2. Template for the Full History Log
export const createFullLogHTML = (history) => {
    const rows = history
        .map(
            (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.timestamp
                }</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.truck
                }</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.inspector
                }</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold; color: ${item.status === 'PASS' ? 'green' : 'red'
                }">
        ${item.status === 'PASS' ? 'PASS' : 'FAIL'}
      </td>
    </tr>
  `
        )
        .join('');

    return `
    <html>
      <body style="font-family: Helvetica, Arial, sans-serif; padding: 40px;">
        <h1 style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px;">Inspection History Log</h1>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #aaa;">Date</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #aaa;">Vehicle</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #aaa;">Inspector</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #aaa;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </body>
    </html>
  `;
};
