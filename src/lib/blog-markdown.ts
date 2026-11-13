/**
 * A small markdown reader for blog posts. It turns a post body into a list of
 * blocks that BlogBody renders in the site's own style. It covers what the
 * post format uses: paragraphs, `##` and `###` headings, lists, quotes, rules,
 * images, and `:::tip` and `:::note` callouts. Inline text (links, bold,
 * italic, code) is parsed at render time by BlogBody.
 *
 * Pure functions with no imports, so it can run anywhere.
 */

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string; id: string }
  | { type: "h3"; text: string; id: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "hr" }
  | { type: "image"; alt: string; src: string }
  | { type: "callout"; kind: "tip" | "note"; title: string; body: Block[] };

export interface Heading {
  id: string;
  text: string;
}

const CALLOUT_OPEN = /^:::(tip|note)\b[ \t]*(.*)$/;
const CALLOUT_CLOSE = /^:::\s*$/;
const HEADING = /^(#{2,3})\s+(.+?)\s*#*\s*$/;
const HR = /^(?:-{3,}|\*{3,}|_{3,})\s*$/;
const UL_ITEM = /^\s{0,3}[-*+]\s+(.*)$/;
const OL_ITEM = /^\s{0,3}\d+[.)]\s+(.*)$/;
const IMAGE_LINE = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)\s*$/;

/** Plain text of a heading, with inline markdown marks removed. */
export function plainText(md: string): string {
  return md
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__|\*|`)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugifyHeading(text: string): string {
  const s = plainText(text)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "section";
}

function startsBlock(line: string): boolean {
  return (
    HEADING.test(line) ||
    CALLOUT_OPEN.test(line) ||
    CALLOUT_CLOSE.test(line) ||
    HR.test(line) ||
    UL_ITEM.test(line) ||
    OL_ITEM.test(line) ||
    /^>\s?/.test(line) ||
    IMAGE_LINE.test(line.trim())
  );
}

export function parseBlocks(markdown: string): Block[] {
  const used = new Map<string, number>();
  const uniqueId = (text: string) => {
    const base = slugifyHeading(text);
    const n = used.get(base) ?? 0;
    used.set(base, n + 1);
    return n === 0 ? base : `${base}-${n + 1}`;
  };
  return parse(markdown.replace(/\r\n?/g, "\n").split("\n"), uniqueId);
}

function parse(lines: string[], uniqueId: (text: string) => string): Block[] {
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    const callout = line.trim().match(CALLOUT_OPEN);
    if (callout) {
      const kind = callout[1] as "tip" | "note";
      const title = callout[2].trim() || (kind === "tip" ? "Tip" : "Note");
      const inner: string[] = [];
      i++;
      while (i < lines.length && !CALLOUT_CLOSE.test(lines[i].trim())) {
        inner.push(lines[i]);
        i++;
      }
      i++; // the closing :::
      blocks.push({ type: "callout", kind, title, body: parse(inner, uniqueId) });
      continue;
    }

    const heading = line.match(HEADING);
    if (heading) {
      const text = heading[2].trim();
      blocks.push({ type: heading[1].length === 2 ? "h2" : "h3", text, id: uniqueId(text) });
      i++;
      continue;
    }

    if (HR.test(line.trim())) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    const image = line.trim().match(IMAGE_LINE);
    if (image) {
      blocks.push({ type: "image", alt: image[1], src: image[2] });
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "quote", text: quote.join(" ").trim() });
      continue;
    }

    const ul = line.match(UL_ITEM);
    const ol = line.match(OL_ITEM);
    if (ul || ol) {
      const pattern = ul ? UL_ITEM : OL_ITEM;
      const items: string[] = [];
      while (i < lines.length) {
        const m = lines[i].match(pattern);
        if (m) {
          items.push(m[1].trim());
          i++;
        } else if (lines[i].trim() && /^\s{2,}\S/.test(lines[i]) && items.length) {
          items[items.length - 1] += " " + lines[i].trim();
          i++;
        } else {
          break;
        }
      }
      blocks.push({ type: ul ? "ul" : "ol", items });
      continue;
    }

    // Paragraph: runs until a blank line or the start of another kind of block.
    const para: string[] = [line.trim()];
    i++;
    while (i < lines.length && lines[i].trim() && !startsBlock(lines[i])) {
      para.push(lines[i].trim());
      i++;
    }
    blocks.push({ type: "p", text: para.join(" ") });
  }

  return blocks;
}

/** The `##` headings of a post, in order. They make up the table of contents. */
export function extractHeadings(blocks: Block[]): Heading[] {
  const out: Heading[] = [];
  for (const b of blocks) {
    if (b.type === "h2") out.push({ id: b.id, text: plainText(b.text) });
  }
  return out;
}

export interface TipLink {
  label: string;
  href: string;
}

/**
 * A tip shows its text, then its links as buttons under the text. This pulls
 * every link out of the tip's paragraphs. A link that stood on its own at the
 * end of a paragraph is removed from the text. A link in the middle of a
 * sentence keeps its words in the sentence, and also becomes a button.
 */
export function splitTipLinks(body: Block[]): { paragraphs: Block[]; links: TipLink[] } {
  const links: TipLink[] = [];
  const paragraphs: Block[] = [];
  const LINK = /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

  for (const block of body) {
    if (block.type !== "p") {
      paragraphs.push(block);
      continue;
    }
    let text = block.text;
    for (const m of block.text.matchAll(LINK)) links.push({ label: plainText(m[1]), href: m[2] });
    // Links that close the paragraph come out of the text entirely.
    text = text.replace(new RegExp(`(?:\\s*${LINK.source})+\\s*$`), "");
    // Any link left in the middle of a sentence keeps only its words.
    text = text.replace(LINK, "$1").trim();
    if (text) paragraphs.push({ type: "p", text });
  }

  return { paragraphs, links };
}
