"use client";

import type { CertificateData } from "./types";

export const CERTIFICATE_WIDTH_PX = 1000;
export const CERTIFICATE_HEIGHT_PX = 700;

const DEFAULT_TEMPLATE = "/certificates/digital-marketing-template.svg";

interface Props {
  data: CertificateData;
  /** Signed R2 URL for the course's own SVG template. Falls back to default. */
  templateUrl?: string | null;
}

export function CertificateTemplate({ data, templateUrl }: Props) {
  const nameLength = (data.studentName || "").length;
  const nameFontSize =
    nameLength > 28 ? "28px" : nameLength > 22 ? "34px" : "42px";

  const bgSrc = templateUrl || data.templateUrl || DEFAULT_TEMPLATE;

  return (
    <article
      className="certificate certificate-paper-layout relative overflow-hidden select-none"
      style={{
        width: CERTIFICATE_WIDTH_PX,
        height: CERTIFICATE_HEIGHT_PX,
        background: "#fffdf9",
      }}
      aria-label={`Certificate for ${data.studentName}`}
    >
      {/* Background artwork (course-specific or default) */}
      <img
        className="absolute top-0 left-0 w-full h-full object-cover z-0 pointer-events-none"
        src={bgSrc}
        alt=""
        crossOrigin="anonymous"
        aria-hidden="true"
        draggable={false}
        onError={(e) => {
          (e.target as HTMLImageElement).src = DEFAULT_TEMPLATE;
        }}
      />

      {/* STUDENT NAME */}
      <div
        className="absolute z-10 flex items-center justify-center text-center"
        style={{
          top: "255px",
          left: "280px",
          width: "620px",
          height: "70px",
        }}
      >
        <p
          className="text-[#0a0704] font-black tracking-tight leading-none"
          style={{
            fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif",
            fontSize: nameFontSize,
            letterSpacing: "-0.02em",
          }}
        >
          {data.studentName || "Recipient Name"}
        </p>
      </div>

      {/* DATE + CERT ID + VERIFY URL */}
      <div
        className="absolute z-10 text-right"
        style={{
          bottom: "42px",
          right: "55px",
          width: "360px",
        }}
      >
        <p
          className="text-[#0a0704] font-bold tracking-wide"
          style={{
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            fontSize: "15px",
          }}
        >
          {data.issueDate}
        </p>

        <p
          className="text-[#ddb049] font-black tracking-[0.12em] uppercase mt-1"
          style={{
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            fontSize: "10px",
          }}
        >
          CERTIFICATE ID: {data.certificateId}
        </p>

        <p
          className="text-[#3d3429] font-semibold mt-1.5"
          style={{
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            fontSize: "10px",
            letterSpacing: "0.02em",
          }}
        >
          Verify at:{" "}
          <span className="font-bold text-[#0a0704]">
            {data.verificationUrl}
          </span>
        </p>
      </div>
    </article>
  );
}