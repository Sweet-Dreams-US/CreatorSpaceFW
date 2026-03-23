export function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Creator Space Fort Wayne",
    url: "https://creatorspacefw.com",
    description:
      "Fort Wayne's creative community directory. Connect with local videographers, photographers, designers, musicians, developers, and more.",
    areaServed: {
      "@type": "City",
      name: "Fort Wayne",
      containedInPlace: {
        "@type": "State",
        name: "Indiana",
      },
    },
    sameAs: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function WebsiteJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Creator Space Fort Wayne",
    url: "https://creatorspacefw.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://creatorspacefw.com/directory?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function PersonJsonLd({
  name,
  description,
  url,
  jobTitle,
  worksFor,
  image,
  skills,
}: {
  name: string;
  description: string;
  url: string;
  jobTitle?: string | null;
  worksFor?: string | null;
  image?: string | null;
  skills?: string[];
}) {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    description,
    url,
    ...(jobTitle && { jobTitle }),
    ...(worksFor && {
      worksFor: { "@type": "Organization", name: worksFor },
    }),
    ...(image && { image }),
    ...(skills &&
      skills.length > 0 && { knowsAbout: skills }),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Fort Wayne",
      addressRegion: "IN",
      addressCountry: "US",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function CollectionPageJsonLd({
  name,
  description,
  url,
  numberOfItems,
}: {
  name: string;
  description: string;
  url: string;
  numberOfItems: number;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems,
      itemListElement: [],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
