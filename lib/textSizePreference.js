const TEXT_SIZE_PIXELS = {
  small: 14,
  medium: 16,
  large: 18,
};

export function getTextSizePreference() {
  if (typeof window === "undefined") return "medium";

  const savedSize = localStorage.getItem("app-text-size");
  return Object.hasOwn(TEXT_SIZE_PIXELS, savedSize) ? savedSize : "medium";
}

export function applyTextSizePreference(size) {
  if (typeof document === "undefined") return "medium";

  const selectedSize = Object.hasOwn(TEXT_SIZE_PIXELS, size) ? size : "medium";
  const fontSize = `${TEXT_SIZE_PIXELS[selectedSize]}px`;
  const root = document.documentElement;

  root.dataset.textSize = selectedSize;
  root.style.fontSize = fontSize;
  root.style.setProperty("--theme-font-size", fontSize);
  document.body.style.fontSize = fontSize;
  localStorage.setItem("app-text-size", selectedSize);

  return selectedSize;
}
