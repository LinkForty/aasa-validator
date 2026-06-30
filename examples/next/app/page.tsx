import { AasaValidator } from '@linkforty/aasa-react';

// The page content below is yours — the open-source tool is only <AasaValidator>.
export default function Page() {
  return (
    <main style={{ maxWidth: '48rem', margin: '3rem auto', padding: '0 1rem' }}>
      <h1>Check your Apple App Site Association file</h1>
      <p>Enter a domain to validate its AASA file for iOS Universal Links.</p>

      <AasaValidator endpoint={process.env.NEXT_PUBLIC_AASA_ENDPOINT ?? '/api/validate'} advanced />
    </main>
  );
}
