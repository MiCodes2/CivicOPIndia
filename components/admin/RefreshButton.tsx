"use client";
import { useRouter } from "next/navigation";

export default function RefreshButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.refresh()}
      style={{
        padding: "0.5rem 1rem",
        borderRadius: "0.375rem",
        background: "#2563eb",
        color: "white",
        border: "none",
        cursor: "pointer",
        fontWeight: 600,
        marginBottom: "1rem"
      }}
    >
      Refresh Page
    </button>
  );
}
