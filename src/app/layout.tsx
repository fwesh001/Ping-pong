import type { Metadata } from "next";
import "@/styles/globals.css";

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
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/ping-pong_FAV-icon.png" />
        <link rel="apple-touch-icon" type="image/png" href="/ping-pong_FAV-icon.png" />
      </head>
      <body>
        <div className="flex min-h-screen flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
