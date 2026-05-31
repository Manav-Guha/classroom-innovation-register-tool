import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Military Innovation Analysis",
  description:
    "Military Innovation Analysis: A Teaching Instrument for Analysing Military Innovation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 font-sans">
        <header className="border-b border-gray-200 bg-white px-6 py-4 text-center">
          <h1 className="text-lg font-semibold text-gray-800">
            Military Innovation Analysis
          </h1>
          <p className="text-sm text-gray-500">
            A Teaching Instrument for Analysing Military Innovation
          </p>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="copyright border-t border-gray-200 bg-white px-6 py-3">
          © Manabrata Guha, 2026
        </footer>
      </body>
    </html>
  );
}
