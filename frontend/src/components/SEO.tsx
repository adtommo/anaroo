import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
}

const DEFAULT_TITLE = 'Anaroo - Fast-Paced Word Unscrambling Game';
const DEFAULT_DESCRIPTION = 'Challenge your brain with Anaroo! Unscramble words as fast as you can in timed challenges, survival mode, or daily puzzles.';

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalUrl,
  ogImage = '/og-image.png',
}: SEOProps) {
  const fullTitle = title ? `${title} | Anaroo` : DEFAULT_TITLE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter */}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* Canonical */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
    </Helmet>
  );
}
