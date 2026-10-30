import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Maven_Pro } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

// Corpo em IBM Plex Sans; documentos e codigos (CPF/CNPJ, codigos legados) em
// IBM Plex Mono — classe `font-mono`. (Mesmo visual do LiberAi Cadastros.)
const plexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Titulos e marca em Maven Pro, a fonte do logotipo no manual da marca.
const mavenPro = Maven_Pro({
  variable: "--font-maven-pro",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "LiberAi Operacional",
  description: "Operação da Libergás",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${plexSans.variable} ${plexMono.variable} ${mavenPro.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        {/* Tema fixo claro: sem ThemeProvider, o wrapper cairia em "system". */}
        <Toaster theme="light" richColors position="top-right" />
      </body>
    </html>
  );
}
