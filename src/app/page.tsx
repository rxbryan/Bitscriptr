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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <BitscriptrPage />
    </>
  );
}