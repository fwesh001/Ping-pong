import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "ping-pong | Uptime Monitoring",
  description: "Monitor your web services with ping-pong. Simple, reliable uptime tracking.",
  icons: {
    icon: "/ping-pong_FAV-icon.png",
    apple: "/ping-pong_FAV-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
