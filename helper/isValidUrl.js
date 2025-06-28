export default function isValidUrl(url) {
  if (!url || typeof url !== "string") return true; // optional
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}
