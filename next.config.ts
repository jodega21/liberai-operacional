import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Foto da leitura vai pela Server Action (ja reduzida no navegador, ~300 KB); folga ate 4 MB.
  experimental: { serverActions: { bodySizeLimit: '4mb' } },
};

export default nextConfig;
