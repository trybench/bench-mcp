/**
 * The Bench mark, served by the hosted server and advertised to clients.
 *
 * Inlined rather than read from disk: a file would have to survive the
 * Docker build and be resolved relative to dist/, and this is 200 bytes.
 * The geometry is bench-web's favicon, so the two stay the same mark.
 *
 * Two variants because the spec lets a server say which theme an icon is
 * drawn for. A single black mark disappears on Claude's dark background,
 * which is how we ended up looking wrong rather than unbranded.
 */
const MARK = (fill: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Bench">` +
  `<path d="M15 13h25a9 9 0 0 1 0 18H15Z" fill="${fill}"/>` +
  `<path d="M15 33h25a9 9 0 0 1 0 18H15Z" fill="${fill}"/>` +
  `</svg>`;

/** For light backgrounds. */
export const ICON_LIGHT = MARK("#0b0d0c");
/** For dark backgrounds. */
export const ICON_DARK = MARK("#ffffff");

export const ICON_LIGHT_PATH = "/icon.svg";
export const ICON_DARK_PATH = "/icon-dark.svg";

/**
 * Where clients are told to fetch the mark from.
 *
 * A server that knows its own public URL advertises itself, so staging
 * and a self-hosted deployment serve their own copy rather than pointing
 * at ours. Everything else — stdio above all, which has no origin of its
 * own — falls back to the hosted server, which is public.
 */
export const CANONICAL_ICON_ORIGIN = "https://mcp.usebench.ai";

export interface IconDescriptor {
  src: string;
  mimeType: string;
  sizes: string[];
  theme: "light" | "dark";
}

export function iconsFor(origin: string = CANONICAL_ICON_ORIGIN): IconDescriptor[] {
  const base = origin.replace(/\/+$/, "");
  return [
    // "any" is the SVG convention: one file scales to every size, so a
    // client never has to pick between raster variants.
    { src: `${base}${ICON_LIGHT_PATH}`, mimeType: "image/svg+xml", sizes: ["any"], theme: "light" },
    { src: `${base}${ICON_DARK_PATH}`, mimeType: "image/svg+xml", sizes: ["any"], theme: "dark" },
  ];
}
