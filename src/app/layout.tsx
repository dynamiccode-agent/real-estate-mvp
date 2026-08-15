import type { Metadata, Viewport } from "next";
import "@fontsource-variable/geist";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hearth — homes, honestly",
  description: "Swipe through Australian homes with transparent prices, fresh listings and private agent messaging.",
  applicationName: "Hearth",
  appleWebApp: { capable: true, title: "Hearth", statusBarStyle: "black-translucent" }
};

export const viewport: Viewport = {
  themeColor: "#18392f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU">
      <body>{children}</body>
    </html>
  );
}
