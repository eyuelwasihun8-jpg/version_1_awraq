import { toPng } from "html-to-image";
import jsPDF from "jspdf";

export async function generateCertificatePdf(element: HTMLElement): Promise<Blob> {
  const png = await toPng(element, {
    width: 1000,
    height: 700,
    pixelRatio: 3,
    backgroundColor: "#fffdf9",
    cacheBust: true,
  });

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  pdf.addImage(png, "PNG", 0, 0, 297, 210);
  return pdf.output("blob");
}

export async function downloadCertificatePdf(data: any, element: HTMLElement) {
  const blob = await generateCertificatePdf(element);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${data.certificateId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}