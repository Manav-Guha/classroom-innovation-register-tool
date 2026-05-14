import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Classroom Innovation Register",
  description:
    "A simplified classroom tool for assessing military innovation cases",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 font-sans">
        <header className="border-b border-gray-200 bg-white px-6 py-4">
          <h1 className="text-lg font-semibold text-gray-800">
            Classroom Innovation Register
          </h1>
          <p className="text-sm text-gray-500">
            A teaching exercise for assessing military innovation
          </p>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-200 bg-white px-6 py-3 text-xs text-gray-400">
          &copy; 2025&ndash;2026 Manabrata Guha. All rights reserved. This is a
          simplified classroom exercise.
        </footer>
      </body>
    </html>
  );
}
