import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RecoveryAI",
  description: "AI-Assisted Smart Loan Recovery Platform",
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
