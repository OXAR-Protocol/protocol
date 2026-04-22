import { toPng } from "html-to-image";

export async function downloadCertificatePng(
  node: HTMLElement,
  serial: string,
): Promise<void> {
  // Wait one paint cycle so any final animation-end state is committed.
  await new Promise<void>((r) => requestAnimationFrame(() => r()));

  const dataUrl = await toPng(node, {
    pixelRatio: 3,
    cacheBust: true,
    backgroundColor: "#0a0a0f",
    style: { transform: "none" },
  });

  const link = document.createElement("a");
  link.download = `oxar-bond-${serial}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
