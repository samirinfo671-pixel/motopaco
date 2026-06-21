import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  url?: string;
  image?: string;
  type?: 'website' | 'product';
  schema?: object;
}

const stripHtml = (html: string): string => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;/g, '-')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&rsquo;/g, "'")
    .replace(/\s+/g, ' ')   // Normalize spaces
    .trim();
};

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords,
  url = typeof window !== 'undefined' ? window.location.href : 'https://motopaco.com',
  image = 'https://picsum.photos/seed/packmoto-og/1200/630',
  type = 'website',
  schema
}) => {
  const brandName = 'MOTO PACO';
  const fullTitle = title.includes(brandName) ? title : `${title} | ${brandName}`;
  const cleanDescription = stripHtml(description).substring(0, 155);
  const defaultKeywords = 'equipement moto maroc, equipement motard maroc, casque moto maroc, givi maroc, alpinestars maroc, agv maroc, tcx maroc, akrapovic maroc, dainese maroc, accessoire moto maroc, moto paco, motopaco';

  return (
    <Helmet>
      {/* Standard SEO tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={cleanDescription} />
      <meta name="keywords" content={keywords || defaultKeywords} />
      <link rel="canonical" href={url} />

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={cleanDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={brandName} />
      <meta property="og:locale" content="fr_MA" />

      {/* Crawl control */}
      <meta name="robots" content="index, follow" />

      {/* Localized Alternate link */}
      <link rel="alternate" href={url} hrefLang="fr-MA" />

      {/* JSON-LD Schema */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;
