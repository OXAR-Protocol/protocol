export function preloadImages(srcs: string[]): Promise<void> {
  const unique = [...new Set(srcs)];
  return Promise.all(
    unique.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new window.Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = src;
        }),
    ),
  ).then(() => {});
}

export const LOADING_LOGO_VARIANTS = [
  "/images/logo_blue.svg?v=2",
  "/images/logo_light-green.svg?v=2",
  "/images/logo_breeze.svg?v=2",
  "/images/logo_light-blue.svg?v=2",
  "/images/logo_saladik.svg?v=2",
  "/images/logo_black-green.svg?v=2",
];
