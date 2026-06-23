import type { Metadata } from "next";
import { Poppins, Inter, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "700", "800"], variable: "--font-poppins", display: "swap" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-inter", display: "swap" });
const jetmono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-jetmono", display: "swap" });

export const metadata: Metadata = {
  title: "ping-pong | Uptime Monitoring",
  description: "Monitor your web services with ping-pong. Simple, reliable uptime tracking.",
  icons: {
    icon: [{ url: "/ping-pong_FAV-icon.png", type: "image/png" }],
    apple: [{ url: "/ping-pong_FAV-icon.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable} ${jetmono.variable}`}>
      <head>
        <link rel="icon" type="image/png" href="/ping-pong_FAV-icon.png" />
        <link rel="apple-touch-icon" type="image/png" href="/ping-pong_FAV-icon.png" />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-900 text-slate-100" style={{ fontFamily: "var(--font-inter), system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" }}>
        <div className="flex min-h-screen flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
