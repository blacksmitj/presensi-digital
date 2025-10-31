import QRCode from "qrcode";

// return buffer PNG
export async function generateQrPng(text: string): Promise<Buffer> {
  const dataUrl = await QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 2,
    scale: 6,
  });
  // data:image/png;base64,xxxx...
  const base64 = dataUrl.split(",")[1];
  return Buffer.from(base64, "base64");
}
