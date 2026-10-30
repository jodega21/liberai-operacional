// Reduz a foto no navegador antes de enviar: lado maior ate 1600 px, JPEG 0,8 (~200-400 KB).
// Falhou a reducao (formato que o navegador nao abre)? Vai o arquivo original; o servidor limita 3 MB.
export async function reduzirFoto(arquivo: File, ladoMax = 1600): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(arquivo);
    const escala = Math.min(1, ladoMax / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * escala);
    const h = Math.round(bmp.height * escala);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return arquivo;
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', 0.8));
    return blob ?? arquivo;
  } catch {
    return arquivo;
  }
}
