/**
 * Generates and downloads a beautifully styled Excel (.xls) file with:
 * - Title and audit metadata banner
 * - Dark theme headers with white text
 * - Formatted currency and percentage cells
 * - Color-coded risk badges (Green, Amber, Red)
 * - Flagged status highlighting
 * - Pre-configured column widths so text is never truncated
 */
export function exportStyledExcel(ledger, flaggedCount = 0, avgRisk = 0) {
  if (!ledger || ledger.length === 0) return;

  const now = new Date();
  const timestamp = now.toLocaleString();

  const rowsHtml = ledger
    .map((t, idx) => {
      const isEven = idx % 2 === 0;
      const rowClass = isEven ? 'row-even' : 'row-odd';
      const amountVal = t.amount !== undefined && t.amount !== null ? Number(t.amount) : 0;
      const riskVal = t.risk_score !== undefined && t.risk_score !== null ? Number(t.risk_score) : 0;
      const anomalyVal = t.anomaly_score !== undefined && t.anomaly_score !== null ? Number(t.anomaly_score) : 0;
      const fraudProbVal = t.fraud_probability !== undefined && t.fraud_probability !== null ? Number(t.fraud_probability) : 0;

      const levelClass =
        t.risk_level === 'critical'
          ? 'level-critical'
          : t.risk_level === 'high'
          ? 'level-high'
          : t.risk_level === 'medium'
          ? 'level-medium'
          : 'level-low';

      const flagLabel = t.is_flagged ? 'FLAGGED 🚩' : 'CLEARED ✓';
      const flagCellClass = t.is_flagged ? 'flag-yes' : 'flag-no';

      const explanation = (t.explanation || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      return `
        <tr class="${rowClass}">
          <td class="id-cell">${t.transaction_id || '—'}</td>
          <td class="amount-cell">$${amountVal.toFixed(2)}</td>
          <td class="score-cell">${(riskVal * 100).toFixed(1)}%</td>
          <td class="${levelClass}">${(t.risk_level || 'low').toUpperCase()}</td>
          <td class="${flagCellClass}">${flagLabel}</td>
          <td class="pct-cell">${(anomalyVal * 100).toFixed(1)}%</td>
          <td class="pct-cell">${(fraudProbVal * 100).toFixed(1)}%</td>
          <td class="explanation-cell">${explanation}</td>
        </tr>
      `;
    })
    .join('');

  const excelTemplate = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="application/vnd.ms-excel; charset=UTF-8"/>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>FraudShield Audit Ledger</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
                <x:Print>
                  <x:ValidPrinterInfo/>
                </x:Print>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body {
          font-family: Calibri, 'Segoe UI', Arial, sans-serif;
          font-size: 11pt;
          color: #1E293B;
        }
        .title-banner {
          background-color: #0F172A;
          color: #FFFFFF;
          font-size: 15pt;
          font-weight: bold;
          text-align: left;
          padding: 12px 14px;
          height: 38px;
        }
        .meta-bar {
          background-color: #F1F5F9;
          color: #475569;
          font-size: 10pt;
          padding: 8px 14px;
          border-bottom: 2px solid #CBD5E1;
        }
        .table-header th {
          background-color: #1E293B;
          color: #FFFFFF;
          font-weight: bold;
          font-size: 11pt;
          text-align: center;
          vertical-align: middle;
          border: 1px solid #334155;
          padding: 10px;
          height: 28px;
        }
        td {
          border: 1px solid #CBD5E1;
          padding: 7px 10px;
          vertical-align: middle;
          font-size: 10.5pt;
        }
        .row-even { background-color: #FFFFFF; }
        .row-odd { background-color: #F8FAFC; }
        .id-cell {
          font-family: Consolas, 'Courier New', monospace;
          font-weight: 600;
          text-align: center;
          color: #0F172A;
        }
        .amount-cell {
          text-align: right;
          font-weight: bold;
          color: #0F172A;
          mso-number-format: "\\$#,##0.00";
        }
        .score-cell {
          text-align: right;
          font-weight: bold;
          mso-number-format: "0.0%";
        }
        .pct-cell {
          text-align: right;
          mso-number-format: "0.0%";
          color: #475569;
        }
        .level-low {
          background-color: #DCFCE7 !important;
          color: #166534 !important;
          font-weight: bold;
          text-align: center;
        }
        .level-medium {
          background-color: #FEF3C7 !important;
          color: #92400E !important;
          font-weight: bold;
          text-align: center;
        }
        .level-high {
          background-color: #FEE2E2 !important;
          color: #991B1B !important;
          font-weight: bold;
          text-align: center;
        }
        .level-critical {
          background-color: #FEE2E2 !important;
          color: #7F1D1D !important;
          font-weight: bold;
          text-align: center;
        }
        .flag-yes {
          background-color: #FEE2E2 !important;
          color: #DC2626 !important;
          font-weight: bold;
          text-align: center;
        }
        .flag-no {
          background-color: #F0FDF4 !important;
          color: #16A34A !important;
          text-align: center;
        }
        .explanation-cell {
          font-size: 9.5pt;
          color: #334155;
          text-align: left;
        }
      </style>
    </head>
    <body>
      <table border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td colspan="8" class="title-banner">
            FRAUD SHIELD — Real-Time Transaction Risk Audit Report
          </td>
        </tr>
        <tr>
          <td colspan="8" class="meta-bar">
            <strong>Exported:</strong> ${timestamp} &nbsp;|&nbsp;
            <strong>Total Scored:</strong> ${ledger.length} &nbsp;|&nbsp;
            <strong>Flagged:</strong> ${flaggedCount} &nbsp;|&nbsp;
            <strong>Avg Risk:</strong> ${(avgRisk * 100).toFixed(1)}%
          </td>
        </tr>
        <tr>
          <td colspan="8" style="height: 10px; border: none;"></td>
        </tr>

        <colgroup>
          <col width="140"/>
          <col width="110"/>
          <col width="100"/>
          <col width="100"/>
          <col width="120"/>
          <col width="120"/>
          <col width="130"/>
          <col width="500"/>
        </colgroup>

        <tr class="table-header">
          <th>Transaction ID</th>
          <th>Amount ($)</th>
          <th>Risk Score</th>
          <th>Risk Level</th>
          <th>Flagged Status</th>
          <th>Anomaly Score</th>
          <th>Fraud Probability</th>
          <th>AI Attribution &amp; Explanation</th>
        </tr>

        ${rowsHtml}
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([excelTemplate], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fraudshield-audit-${Date.now()}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
