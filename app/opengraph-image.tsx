import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "StemNorge – Ukentlig folkestemme, presentert ryddig";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #020617 0%, #0f172a 50%, #020617 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Logo badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 120,
            borderRadius: 32,
            border: "3px solid rgba(34,211,238,0.35)",
            background: "rgba(34,211,238,0.10)",
            fontSize: 52,
            fontWeight: 700,
            color: "#a5f3fc",
            marginBottom: 32,
          }}
        >
          SN
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-0.03em",
            marginBottom: 16,
          }}
        >
          StemNorge
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "#94a3b8",
            maxWidth: 700,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Ukentlig folkestemme, presentert ryddig
        </div>
      </div>
    ),
    { ...size },
  );
}

