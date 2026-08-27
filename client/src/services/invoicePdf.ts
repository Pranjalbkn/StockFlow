import type { jsPDF } from "jspdf";
import type { Invoice } from "../types/Sale";

function invoiceNumber(invoice: Invoice) {
  return invoice.invoice_number || `SF-${String(invoice.id).padStart(5, "0")}`;
}

export async function createInvoicePdf(invoice: Invoice) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const document = new jsPDF({ unit: "mm", format: "a4" });
  const number = invoiceNumber(invoice);

  document.setProperties({
    title: `Invoice ${number}`,
    subject: `Invoice from ${invoice.brand_name}`,
  });

  document.setFillColor(15, 23, 42);
  document.rect(0, 0, 210, 42, "F");
  document.setTextColor(255, 255, 255);
  document.setFont("helvetica", "bold");
  document.setFontSize(20);
  document.text(invoice.brand_name || "StockFlow", 16, 19);
  document.setFontSize(10);
  document.setFont("helvetica", "normal");
  document.text("Sales invoice", 16, 28);
  document.setFontSize(16);
  document.setFont("helvetica", "bold");
  document.text(number, 194, 20, { align: "right" });
  document.setFontSize(9);
  document.setFont("helvetica", "normal");
  document.text(new Date(invoice.sale_date).toLocaleDateString("en-IN"), 194, 28, { align: "right" });

  document.setTextColor(15, 23, 42);
  document.setFontSize(9);
  document.setFont("helvetica", "bold");
  document.text("BILL TO", 16, 56);
  document.setFont("helvetica", "normal");
  document.setFontSize(11);
  document.text(invoice.customer_name || "Walk-in customer", 16, 64);
  if (invoice.customer_phone) document.text(invoice.customer_phone, 16, 71);

  document.setFontSize(9);
  document.setTextColor(100, 116, 139);
  document.text(`Prepared by: ${invoice.created_by_name || "StockFlow team"}`, 194, 64, { align: "right" });

  autoTable(document, {
    startY: 82,
    head: [["Item", "SKU", "Qty", "Unit price", "Amount"]],
    body: invoice.items.map((item) => [
      item.name,
      item.sku,
      String(item.quantity),
      `INR ${Number(item.unit_price).toFixed(2)}`,
      `INR ${Number(item.line_total).toFixed(2)}`,
    ]),
    theme: "plain",
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [51, 65, 85],
      fontStyle: "bold",
    },
    bodyStyles: { textColor: [51, 65, 85] },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
    styles: { cellPadding: 4, fontSize: 9 },
    margin: { left: 16, right: 16 },
  });

  const finalY = (document as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  document.setDrawColor(226, 232, 240);
  document.line(125, finalY + 8, 194, finalY + 8);
  document.setFont("helvetica", "bold");
  document.setFontSize(12);
  document.setTextColor(15, 23, 42);
  document.text("Total", 150, finalY + 18, { align: "right" });
  document.text(`INR ${Number(invoice.total_amount).toFixed(2)}`, 194, finalY + 18, { align: "right" });

  document.setFont("helvetica", "normal");
  document.setFontSize(9);
  document.setTextColor(100, 116, 139);
  document.text("Thank you for your business.", 16, 282);
  document.text("Generated securely with StockFlow", 194, 282, { align: "right" });

  return document.output("blob");
}

function saveBlob(blob: Blob, filename: string) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function downloadInvoice(invoice: Invoice) {
  const filename = `invoice-${invoiceNumber(invoice)}.pdf`;
  saveBlob(await createInvoicePdf(invoice), filename);
}

function whatsappNumber(phone: string | null) {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

export async function shareInvoice(invoice: Invoice) {
  const number = invoiceNumber(invoice);
  const filename = `invoice-${number}.pdf`;
  const blob = await createInvoicePdf(invoice);
  const file = new File([blob], filename, { type: "application/pdf" });
  const message = `Hello ${invoice.customer_name || "Customer"},\n\nThank you for shopping with ${invoice.brand_name}. Your invoice ${number} for INR ${Number(invoice.total_amount).toFixed(2)} is attached.`;

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: `Invoice ${number}`,
      text: message,
      files: [file],
    });
    return "shared";
  }

  saveBlob(blob, filename);
  const phone = whatsappNumber(invoice.customer_phone);
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  return "downloaded";
}
