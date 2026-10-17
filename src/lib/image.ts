const MAX_WIDTH = 800;
const TARGET_BYTES = 90 * 1024;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("This file is not a picture we can read."));
    img.src = src;
  });
}

/** Shrinks a photo to at most 800 px wide and a small JPEG, so it fits in browser storage. */
export async function compressImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose a picture file (JPG or PNG).");
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, MAX_WIDTH / img.naturalWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser cannot resize pictures.");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    let quality = 0.78;
    let out = canvas.toDataURL("image/jpeg", quality);
    while (out.length * 0.75 > TARGET_BYTES && quality > 0.35) {
      quality -= 0.08;
      out = canvas.toDataURL("image/jpeg", quality);
    }
    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function dataUrlBytes(dataUrl: string): number {
  return Math.round(dataUrl.length * 0.75);
}
