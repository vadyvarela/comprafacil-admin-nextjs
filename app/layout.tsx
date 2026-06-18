import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ApolloClientProvider } from "@/lib/providers/apollo-provider";
import { Toaster } from "@/components/ui/sonner";
import { adminTitle } from "@/lib/store-brand";
import { getStoreBrand } from "@/lib/services/get-store-brand";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getStoreBrand();
  const title = adminTitle(brand.siteName);

  return {
    title: {
      default: title,
      template: `%s · ${title}`,
    },
    description: `Painel de administração de ${brand.siteName}`,
    ...(brand.faviconUrl ? { icons: { icon: brand.faviconUrl } } : {}),
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ApolloClientProvider>{children}</ApolloClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
