import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "GCC Atlas · GCC-Pulse",
  description: "A verified entity graph and signal layer for India's Global Capability Centres: registry, inbound radar, state incentive benchmark and provider scorecard.",
};

export const viewport: Viewport = {
  themeColor: "#07080d",
  width: "device-width",
  initialScale: 1,
};

// Sets the saved theme before first paint to avoid a flash.
const themeScript = `try{if(localStorage.getItem('gcc-atlas-theme')==='light')document.documentElement.classList.add('light')}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
