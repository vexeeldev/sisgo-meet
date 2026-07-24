import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SettingsProvider } from "@/context/SettingsContext";
import "./globals.css";
import "@/styles/custom.css";
import { neighbor } from "./fonts";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SISGO Meet | Platform Meeting Online",
  description: "SISGO Meet - Platform video meeting online yang aman dan andal. Powered by PT Sisgo Global Teknologi.",
  icons: {
    icon: "https://s3.sisgo.co.id/core/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${neighbor.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://s3.sisgo.co.id/core/css/sisgo.css"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </body>
    </html>
  );
}
