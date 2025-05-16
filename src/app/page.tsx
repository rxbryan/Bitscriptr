// To use this in a Next.js project:
// 1. Create a 'components' folder in your project root (or inside 'src').
// 2. Save this file as `components/BitscriptrPage.tsx`.
// 3. Save all other component files (types.ts, utils.ts, CommonPatternsSection.tsx, etc.) in the same 'components' folder.
// 4. Make sure you have `lucide-react` installed: `npm install lucide-react` or `yarn add lucide-react`.
// 5. Make sure Tailwind CSS is set up in your Next.js project.
// 6. Create a page, e.g., `pages/index.tsx`, and import/use this component:
//

import BitscriptrPage from '../components/BitscriptrPage';
import Head from 'next/head';



// src/pages/index.tsx

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Bitscriptr - Bitcoin Miniscript Tool</title>
        <meta name="description" content="Generate Bitcoin wallet descriptors for miniscript policies." />
        <link rel="icon" href="/favicon.ico" />
        {/* Ensure Inter font is loaded, or your project's default font is set */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <BitscriptrPage />
    </>
  );
}