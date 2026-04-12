import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 16,
          background: "linear-gradient(180deg, #1b1a1f, #202028)",
          color: "#f3f1ee",
          fontSize: 34,
          fontWeight: 800,
          position: "relative"
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 4,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.06)"
          }}
        />
        <span style={{ letterSpacing: "-0.04em" }}>Ri</span>
        <div
          style={{
            width: 0,
            height: 0,
            marginLeft: 6,
            borderTop: "9px solid transparent",
            borderBottom: "9px solid transparent",
            borderLeft: "14px solid #af90ff"
          }}
        />
      </div>
    ),
    size
  );
}
