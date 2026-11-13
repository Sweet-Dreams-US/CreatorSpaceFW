import type { ReactNode } from "react";
import Link from "next/link";
import { resolveBlogHref } from "@/lib/blog";
import { splitTipLinks, type Block } from "@/lib/blog-markdown";

/* ---------------------------------------------------------------- Inline */

const INLINE =
  /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*\s][^*]*?)\*|(?<![A-Za-z0-9])_([^_\s][^_]*?)_(?![A-Za-z0-9])/g;

const LINK_CLASS =
  "text-[var(--color-coral)] underline decoration-[var(--color-coral)]/40 underline-offset-4 transition-colors hover:text-[var(--color-white)] hover:decoration-[var(--color-white)]/60";

function isSafeHref(href: string): boolean {
  return href.startsWith("/") || /^(https?:|mailto:|tel:)/i.test(href);
}

/** Text with `[link](url)`, `**bold**`, `*italic*` and `` `code` `` turned into elements. */
function inline(text: string, keyBase = "i"): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(INLINE)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const key = `${keyBase}-${n++}`;
    if (m[1] !== undefined) {
      const href = resolveBlogHref(m[2]);
      if (!isSafeHref(href)) {
        out.push(...inline(m[1], key));
      } else if (href.startsWith("/")) {
        out.push(
          <Link key={key} href={href} className={LINK_CLASS}>
            {inline(m[1], key)}
          </Link>,
        );
      } else {
        out.push(
          <a key={key} href={href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
            {inline(m[1], key)}
          </a>,
        );
      }
    } else if (m[3] !== undefined) {
      out.push(
        <strong key={key} className="font-semibold text-[var(--color-white)]">
          {inline(m[3], key)}
        </strong>,
      );
    } else if (m[4] !== undefined) {
      out.push(
        <code
          key={key}
          className="rounded bg-[var(--color-charcoal)] px-1.5 py-0.5 text-[0.9em] text-[var(--color-sky)]"
        >
          {m[4]}
        </code>,
      );
    } else {
      out.push(
        <em key={key} className="italic text-[var(--color-white)]">
          {inline((m[5] ?? m[6]) as string, key)}
        </em>,
      );
    }
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/* ---------------------------------------------------------------- Blocks */

const BODY_TEXT = "font-[family-name:var(--font-mono)] text-[15px] leading-[1.85] text-[var(--color-mist)]";
const CALLOUT_TEXT = "font-[family-name:var(--font-mono)] text-sm leading-[1.8] text-[var(--color-mist)]";

function Button({ href, label }: { href: string; label: string }) {
  const target = resolveBlogHref(href);
  const className =
    "inline-flex items-center gap-2 rounded-full bg-[var(--color-coral)] px-6 py-2.5 font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-black)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_24px_rgba(250,146,119,0.4)]";
  const content = (
    <>
      {label}
      <span aria-hidden="true">→</span>
    </>
  );
  if (!isSafeHref(target)) return null;
  if (target.startsWith("/")) {
    return (
      <Link href={target} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <a href={target} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  );
}

function Callout({ block }: { block: Extract<Block, { type: "callout" }> }) {
  const isTip = block.kind === "tip";
  const accent = isTip ? "var(--color-coral)" : "var(--color-sky)";
  const { paragraphs, links } = splitTipLinks(block.body);
  // Notes are for a researched fact. Any link in one stays an ordinary text link.
  const body = isTip ? paragraphs : block.body;

  return (
    <aside
      className="my-10 overflow-hidden rounded-2xl border bg-[var(--color-dark)]"
      style={{
        borderColor: `color-mix(in srgb, ${accent} 25%, transparent)`,
        boxShadow: isTip ? "0 0 60px rgba(250,146,119,0.08)" : undefined,
      }}
      aria-label={isTip ? "Tip" : "Note"}
    >
      <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <div className="p-6 sm:p-8">
        <p
          className="font-[family-name:var(--font-mono)] text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: accent }}
        >
          {isTip ? "Tip" : "Note"}
        </p>
        <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl leading-snug text-[var(--color-white)] sm:text-2xl">
          {inline(block.title, "ct")}
        </h3>
        <div className="mt-3 space-y-3">
          {body.map((b, i) =>
            b.type === "p" ? (
              <p key={i} className={CALLOUT_TEXT}>
                {inline(b.text, `cp${i}`)}
              </p>
            ) : (
              <Blocks key={i} blocks={[b]} />
            ),
          )}
        </div>
        {isTip && links.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3">
            {links.map((l, i) => (
              <Button key={`${l.href}-${i}`} href={l.href} label={l.label} />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "p":
            return (
              <p key={i} className={`mt-5 ${BODY_TEXT}`}>
                {inline(b.text, `p${i}`)}
              </p>
            );
          case "h2":
            return (
              <h2
                key={i}
                id={b.id}
                className="mt-14 scroll-mt-24 font-[family-name:var(--font-display)] text-2xl leading-tight text-[var(--color-white)] sm:text-3xl"
              >
                <span
                  aria-hidden="true"
                  className="mb-4 block h-px w-16 bg-gradient-to-r from-[var(--color-coral)] to-transparent"
                />
                {inline(b.text, `h${i}`)}
              </h2>
            );
          case "h3":
            return (
              <h3
                key={i}
                id={b.id}
                className="mt-9 scroll-mt-24 font-[family-name:var(--font-display)] text-xl leading-snug text-[var(--color-white)]"
              >
                {inline(b.text, `h${i}`)}
              </h3>
            );
          case "ul":
            return (
              <ul key={i} className="mt-5 space-y-2.5">
                {b.items.map((item, j) => (
                  <li key={j} className={`flex gap-3 ${BODY_TEXT}`}>
                    <span
                      aria-hidden="true"
                      className="mt-[0.8em] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-coral)]"
                    />
                    <span className="min-w-0">{inline(item, `u${i}-${j}`)}</span>
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="mt-5 space-y-3">
                {b.items.map((item, j) => (
                  <li key={j} className={`flex gap-3 ${BODY_TEXT}`}>
                    <span
                      aria-hidden="true"
                      className="mt-[0.45em] flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--color-coral)]/40 font-[family-name:var(--font-mono)] text-[11px] font-semibold leading-none text-[var(--color-coral)]"
                    >
                      {j + 1}
                    </span>
                    <span className="min-w-0">{inline(item, `o${i}-${j}`)}</span>
                  </li>
                ))}
              </ol>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="mt-6 border-l-2 border-[var(--color-coral)] pl-5 font-[family-name:var(--font-mono)] text-[15px] italic leading-[1.85] text-[var(--color-white)]"
              >
                {inline(b.text, `q${i}`)}
              </blockquote>
            );
          case "hr":
            return <hr key={i} className="my-10 border-0 border-t border-white/10" />;
          case "image": {
            const src = resolveBlogHref(b.src);
            if (!src.startsWith("/blog/images/") && !/^https:\/\//i.test(src)) return null;
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt={b.alt}
                loading="lazy"
                className="mt-8 w-full rounded-xl border border-white/5"
              />
            );
          }
          case "callout":
            return <Callout key={i} block={b} />;
        }
      })}
    </>
  );
}

export default function BlogBody({ blocks }: { blocks: Block[] }) {
  return (
    <div id="post-body">
      <Blocks blocks={blocks} />
    </div>
  );
}
