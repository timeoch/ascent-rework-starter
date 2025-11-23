import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Hero from './components/Hero';
import Formations from './components/Formations';

const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

const fetchHomepage = async () => {
  const res = await fetchWithTimeout('/api/content/homepage', {}, 10000);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json || !json.success) throw new Error(json && json.error ? json.error : 'Invalid response');
  return json.data;
};

function App() {
  const { data, error, isLoading, isError, refetch } = useQuery(['homepage'], fetchHomepage, {
    staleTime: 1000 * 60 * 5,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  const hero = useMemo(() => (data ? data.hero : null), [data]);

  if (isLoading) return <div className="center">Chargement…</div>;
  if (isError) return (
    <div className="error">
      <p>Impossible de charger le contenu.</p>
      <button onClick={() => refetch()}>Réessayer</button>
    </div>
  );

  return (
    <div className="app">
      <Hero hero={hero} />
      <Formations />
    </div>
  );
}

export default App;

