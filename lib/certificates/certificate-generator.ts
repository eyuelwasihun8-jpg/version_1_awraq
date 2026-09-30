import { toPng } from "html-to-image";
import jsPDF from "jspdf";

export async function generateCertificatePdf(element: HTMLElement): Promise<Blob> {
  // Wait briefly to ensure SVGs and images are fully rendered in the DOM
  await new Promise((resolve) => setTimeout(resolve, 200));

  const png = await toPng(element, {
    width: 1000,
    height: 700,
    pixelRatio: 2,
    backgroundColor: "#fffdf9",
    cacheBust: false, // CRITICAL: Must be false to preserve Cloudflare R2 presigned URL signatures
    skipFonts: true,  // CRITICAL: Prevents html-to-image from crashing on Google Fonts CORS fetches
  });

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  pdf.addImage(png, "PNG", 0, 0, 297, 210);
  return pdf.output("blob");
}

export async function downloadCertificatePdf(dataOrCode: any, element: HTMLElement) {
  const filename =
    typeof dataOrCode === "string"
      ? dataOrCode
      : dataOrCode?.certificateId || "certificate";

  const blob = await generateCertificatePdf(element);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}