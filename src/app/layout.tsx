import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const appName = process.env.NEXT_PUBLIC_APP_NAME || "OpenSlot";

export const metadata: Metadata = {
  title: {
    default: `${appName} — Self-Hosted Booking System`,
    template: `%s — ${appName}`,
  },
  description:
    "Sistem reservasi dan manajemen antrean self-hosted untuk berbagai jenis bisnis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
