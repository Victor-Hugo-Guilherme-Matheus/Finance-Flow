import type { Transaction } from "../types";
import { formatCurrency, formatDate } from "./format";

interface ExportFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  type?: string;
}

function filterTransactions(transactions: Transaction[], filters: ExportFilters) {
  return transactions.filter((tx) => {
    if (filters.startDate && tx.date < filters.startDate) return false;
    if (filters.endDate && tx.date > filters.endDate) return false;
    if (filters.category && filters.category !== "all" && tx.category !== filters.category) return false;
    if (filters.type && filters.type !== "all" && tx.type !== filters.type) return false;
    return true;
  });
}

/** Exporta transações filtradas como CSV */
export function exportToCSV(
  transactions: Transaction[],
  filters: ExportFilters,
  labels: Record<string, string>
) {
  const filtered = filterTransactions(transactions, filters);
  const headers = ["Data", "Nome", "Tipo", "Categoria", "Valor", "Descrição"];
  const rows = filtered.map((tx) => [
    tx.date,
    tx.name,
    labels[tx.type] ?? tx.type,
    labels[tx.category] ?? tx.category,
    tx.amount.toFixed(2),
    tx.description ?? "",
  ]);

  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
  downloadFile(csv, `financeflow-relatorio-${Date.now()}.csv`, "text/csv;charset=utf-8;");
}

/** Exporta relatório como PDF via janela de impressão (sem dependências externas) */
export function exportToPDF(
  transactions: Transaction[],
  filters: ExportFilters,
  labels: Record<string, string>,
  title: string
) {
  const filtered = filterTransactions(transactions, filters);
  const totalIncome = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const rows = filtered
    .map(
      (tx) =>
        `<tr>
          <td>${formatDate(tx.date)}</td>
          <td>${tx.name}</td>
          <td>${labels[tx.type] ?? tx.type}</td>
          <td>${labels[tx.category] ?? tx.category}</td>
          <td style="text-align:right">${formatCurrency(tx.amount)}</td>
        </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 24px; color: #0d3d45; }
  h1 { color: #079697; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
  th { background: #079697; color: white; }
  .summary { display: flex; gap: 24px; margin: 16px 0; }
  .summary div { padding: 12px; background: #e6f7fa; border-radius: 8px; }
</style></head><body>
  <h1>${title}</h1>
  <p>Gerado em ${formatDate(new Date().toISOString())}</p>
  <div class="summary">
    <div><strong>Receitas:</strong> ${formatCurrency(totalIncome)}</div>
    <div><strong>Despesas:</strong> ${formatCurrency(totalExpense)}</div>
    <div><strong>Saldo:</strong> ${formatCurrency(totalIncome - totalExpense)}</div>
  </div>
  <table>
    <thead><tr><th>Data</th><th>Nome</th><th>Tipo</th><th>Categoria</th><th>Valor</th></tr></thead>
    <tbody>${rows || "<tr><td colspan='5'>Nenhuma transação encontrada</td></tr>"}</tbody>
  </table>
</body></html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  }
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
