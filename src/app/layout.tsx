import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

// Corpo em IBM Plex Sans; documentos e codigos (CPF/CNPJ, codigos legados) em
// IBM Plex Mono — classe `font-mono`. (Mesmo visual do LiberAi Cadastros.)
// Arquivos locais (subset latin, licenca OFL) em ./fonts, para o build nao
// depender do Google Fonts. Sans e Maven Pro sao variaveis: um unico arquivo
// cobre a faixa de pesos.
const plexSans = localFont({
  variable: "--font-ibm-plex-sans",
  src: "./fonts/IBMPlexSans-Variable-latin.woff2",
  weight: "400 600",
  style: "normal",
  display: "swap",
});

// Titulos e marca em Maven Pro, a fonte do logotipo no manual da marca.
const mavenPro = localFont({
  variable: "--font-maven-pro",
  src: "./fonts/MavenPro-Variable-latin.woff2",
  weight: "500 700",
  style: "normal",
  display: "swap",
});

const plexMono = localFont({
  variable: "--font-ibm-plex-mono",
  src: [
    { path: "./fonts/IBMPlexMono-Regular-latin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/IBMPlexMono-Medium-latin.woff2", weight: "500", style: "normal" },
  ],
  display: "swap",
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
