type CsvColumn<Row> = {
  header: string;
  value: (row: Row) => string | number | null | undefined;
};

type ExportCsvArgs<Row> = {
  fileName: string;
  rows: Row[];
  columns: Array<CsvColumn<Row>>;
};

type ExportPdfArgs = {
  fileName: string;
  title: string;
  subtitle?: string;
  lines: string[];
};

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export function exportCsv<Row>(args: ExportCsvArgs<Row>) {
  const headers = args.columns.map((column) => csvEscape(column.header)).join(",");
  const lines = args.rows.map((row) =>
    args.columns.map((column) => csvEscape(column.value(row))).join(","),
  );

  const blob = new Blob([[headers, ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = args.fileName.endsWith(".csv") ? args.fileName : `${args.fileName}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function exportPdf(args: ExportPdfArgs) {
  const module = await import("jspdf");
  const doc = new module.jsPDF({ unit: "pt" });

  doc.setFontSize(16);
  doc.text(args.title, 40, 40);

  if (args.subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(args.subtitle, 40, 58);
  }

  doc.setTextColor(0);
  doc.setFontSize(11);

  let y = 82;
  for (const line of args.lines) {
    const wrapped = doc.splitTextToSize(line, 520);
    doc.text(wrapped, 40, y);
    y += wrapped.length * 16;

    if (y > 760) {
      doc.addPage();
      y = 40;
    }
  }

  doc.save(args.fileName.endsWith(".pdf") ? args.fileName : `${args.fileName}.pdf`);
}
