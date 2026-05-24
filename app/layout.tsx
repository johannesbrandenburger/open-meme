import type { Metadata } from "next";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import ConvexClientProvider from "@/app/components/ConvexClientProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Open Meme",
  description: "The Open Source Meme Game",
  icons: {
    icon: "/sticker.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen bg-background font-sans text-foreground">
          <ConvexClientProvider>
            <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </main>
            <Toaster 
              position="top-center"
              toastOptions={{
                style: {
                  background: 'white',
                  border: '1px solid oklch(0.884 0.009 255)',
                  color: 'oklch(0.196 0.012 255)',
                  boxShadow: '0px 18px 38px -22px hsl(220 24% 18% / 0.28)',
                },
              }}
            />
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
