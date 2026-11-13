import { SITE_NAME, SITE_URL, resolveBlogHref, type BlogPost } from "@/lib/blog";

function Script({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // "<" is escaped so post text can never close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/** BlogPosting and breadcrumb data for one released post. */
export default function BlogJsonLd({ post }: { post: BlogPost }) {
  const url = `${SITE_URL}/blog/${post.slug}`;
  const cover = post.cover_image ? resolveBlogHref(post.cover_image) : "";

  const posting: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description || post.title,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: post.release_on,
    dateModified: post.release_on,
    inLanguage: "en-US",
    timeRequired: `PT${post.reading_minutes}M`,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    isPartOf: { "@type": "Blog", name: `${SITE_NAME} Blog`, url: `${SITE_URL}/blog` },
    ...(cover.startsWith("/") && { image: `${SITE_URL}${cover}` }),
    ...(post.sources.length > 0 && {
      citation: post.sources.map((s) => ({
        "@type": "CreativeWork",
        name: s.title,
        url: s.url,
        ...(s.author && { author: s.author }),
      })),
    }),
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  };

  return (
    <>
      <Script data={posting} />
      <Script data={breadcrumbs} />
    </>
  );
}
