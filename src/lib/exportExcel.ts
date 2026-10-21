/**
 * Excel / CSV Exporter for Elmasry Academy
 * Prepends UTF-8 Byte Order Mark (\uFEFF) so Microsoft Excel opens Arabic text cleanly.
 * Sanitizes against CSV / Spreadsheet Formula Injection (=, +, -, @, \t, \r).
 */

export function exportToCSV({
  filename,
  headers,
  rows,
}: {
  filename: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
}) {
  const escapeCell = (cell: string | number | null | undefined): string => {
    if (cell === null || cell === undefined) return '';
    let str = String(cell);

    // OWASP CSV Formula Injection mitigation:
    // If text begins with =, +, -, @, \t, \r, prepend a single quote (')
    // Pure numeric values (like -150 or +20) remain intact.
    const isPureNumber = typeof cell === 'number' || (!isNaN(Number(str)) && str.trim() !== '');
    if (!isPureNumber) {
      const trimmed = str.trimStart();
      if (trimmed.length > 0 && ['=', '+', '-', '@', '\t', '\r'].includes(trimmed.charAt(0))) {
        str = `'${str}`;
      }
    }

    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const rowLines = rows.map((row) => row.map(escapeCell).join(','));
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
