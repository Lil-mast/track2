import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "RecoveryAI — Financial Empowerment, Powered by AI",
  description:
    "AI-powered loan recovery platform for B2B lenders. Context-aware generative AI designs hyper-personalized repayment strategies, maximizing recovery rates while safeguarding customer trust.",
  keywords: [
    "loan recovery",
    "AI",
    "fintech",
    "B2B lending",
    "debt recovery",
    "recovery automation",
  ],
  openGraph: {
    title: "RecoveryAI — Financial Empowerment, Powered by AI",
    description:
      "AI-powered loan recovery platform for B2B lenders.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0f19",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="icon"
          href="/favicon.png"
          type="image/png"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
