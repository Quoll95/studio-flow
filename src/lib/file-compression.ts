/**
 * Compressione immagini prima dell'upload.
 * - Max 1600px di larghezza
 * - Qualità 0.7
 * - Output in JPEG (webp non supportato ovunque per canvas.toBlob)
 * - Target: 200-400 KB per immagine
 */

const MAX_WIDTH = 1600;
const INITIAL_QUALITY = 0.7;
const MAX_FILE_SIZE = 400 * 1024; // 400 KB
const MIN_QUALITY = 0.4;

export async function compressImage(file: File): Promise<File> {
  // Se non è un'immagine, ritorna il file originale
  if (!file.type.startsWith("image/")) return file;

  const bitmap = await createImageBitmap(file);
  let width = bitmap.width;
  let height = bitmap.height;

  // Ridimensiona se più largo di MAX_WIDTH
  if (width > MAX_WIDTH) {
    const ratio = MAX_WIDTH / width;
    width = MAX_WIDTH;
    height = Math.round(height * ratio);
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas non supportato");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // Prova prima webp, fallback a jpeg
  let blob: Blob | null = null;
  let quality = INITIAL_QUALITY;
  const format = supportsWebp() ? "image/webp" : "image/jpeg";
  const ext = format === "image/webp" ? ".webp" : ".jpg";

  // Compressione progressiva se il file è ancora troppo grande
  while (quality >= MIN_QUALITY) {
    blob = await canvas.convertToBlob({ type: format, quality });
    if (blob.size <= MAX_FILE_SIZE) break;
    quality -= 0.1;
  }

  if (!blob) {
    blob = await canvas.convertToBlob({ type: format, quality: MIN_QUALITY });
  }

  // Genera nome file con nuova estensione
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}${ext}`, { type: format });
}

let _supportsWebp: boolean | null = null;
function supportsWebp(): boolean {
  if (_supportsWebp !== null) return _supportsWebp;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    _supportsWebp = canvas.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    _supportsWebp = false;
  }
  return _supportsWebp!;
}

/**
 * Controllo dimensione PDF.
 * Max 10 MB per PDF per evitare scansioni ad altissima risoluzione.
 */
const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10 MB

export function validatePdfSize(file: File): { valid: boolean; message?: string } {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    if (file.size > MAX_PDF_SIZE) {
      return {
        valid: false,
        message: `Il PDF "${file.name}" è troppo grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Il massimo consentito è 10 MB. Riduci la risoluzione della scansione.`,
      };
    }
  }
  return { valid: true };
}
