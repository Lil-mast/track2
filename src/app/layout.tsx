import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";

// Professional, premium modern font configuration matching Framer style
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Generative AI for Smart Debt Recovery`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        {/* Google Fonts Material Symbols */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className={`${plusJakartaSans.variable} font-sans bg-[#030712] text-slate-100 antialiased min-h-screen relative overflow-x-hidden`}>
        {/* Subtle Ambient Background Orbs */}
        <div className="absolute top-[-10%] left-[-20%] w-[60vw] h-[60vw] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none z-0" />
        <div className="absolute top-[40%] right-[-20%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-[10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-indigo-600/5 blur-[160px] pointer-events-none z-0" />

        {/* Real App Container */}
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
