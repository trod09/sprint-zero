import type { Metadata } from "next";
import { Geist_Mono, Nunito, Pixelify_Sans } from "next/font/google";

import { SiteHeader } from "@/components/site-header";
import { DEFAULT_LOCALE, getMessages } from "@/i18n";
import { themeInitScript } from "@/lib/theme";

import "./globals.css";

/** Reading text: tickets, briefs, feedback. */
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

/** Titles, buttons, XP numbers and short labels only. */
const pixelify = Pixelify_Sans({
  variable: "--font-pixelify",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const messages = getMessages();

export const metadata: Metadata = {
  title: {
    default: messages.app.name,
    template: `%s · ${messages.app.name}`,
  },
  description: messages.app.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={DEFAULT_LOCALE}
      className={`${nunito.variable} ${pixelify.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="focus:bg-background focus:ring-ring/50 sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:px-3 focus:py-2 focus:text-sm focus:ring-3"
        >
          {messages.nav.skipToContent}
        </a>
        <SiteHeader messages={messages} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <footer className="border-t">
          <p className="text-muted-foreground mx-auto w-full max-w-6xl px-4 py-5 text-xs sm:px-6">
            {messages.footer.note}
          </p>
        </footer>
      </body>
    </html>
  );
}
