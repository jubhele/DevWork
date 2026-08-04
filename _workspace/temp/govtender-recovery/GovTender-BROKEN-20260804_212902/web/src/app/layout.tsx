import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GovTender — SA Government Tender Intelligence",
  description:
    "Find the right tenders. Win more contracts. We handle the work.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
