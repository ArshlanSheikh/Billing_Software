import html2pdf from "html2pdf.js";

/**
 * Exports an HTML element (e.g. invoice sheet) to a clean, professionally formatted A4 PDF.
 * @param {HTMLElement} element - The DOM element to render as PDF
 * @param {string} invoiceNumber - The invoice number to use for the downloaded file name
 * @returns {Promise<void>}
 */
export const downloadInvoicePdf = async (element, invoiceNumber = "invoice") => {
  if (!element) {
    throw new Error("No element provided for PDF generation");
  }

  // Hide elements marked as no-print/no-pdf during PDF rendering
  const noPrintEls = element.querySelectorAll(".noPrint, [data-no-pdf='true']");
  const originalDisplays = [];
  noPrintEls.forEach((el, idx) => {
    originalDisplays[idx] = el.style.display;
    el.style.display = "none";
  });

  const cleanNum = String(invoiceNumber || "receipt").replace(/[^a-zA-Z0-9_-]/g, "_");

  const options = {
    margin: [8, 8, 8, 8],
    filename: `Invoice_${cleanNum}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      logging: false,
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    },
    pagebreak: {
      mode: ["avoid-all", "css", "legacy"],
      before: ".page-break-before",
      after: ".page-break-after",
    },
  };

  try {
    await html2pdf().set(options).from(element).save();
  } finally {
    // Restore displays
    noPrintEls.forEach((el, idx) => {
      el.style.display = originalDisplays[idx];
    });
  }
};
