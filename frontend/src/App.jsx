import { useState, useEffect } from 'react';
import Hero from './components/Hero';
import Formations from './components/Formations';

function App() {
  const [homepage, setHomepage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Bug : pas de gestion d'erreur réseau
    // Bug : pas de timeout
    // Bug : pas de retry en cas d'échec
    const controller = new AbortController();
    const signal = controller.signal;
    fetch('/api/content/homepage', { signal })
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(json => {
        if (!json || !json.success) throw new Error('Invalid response from server');
        setHomepage(json);
        setLoading(false);
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        // Do not expose internal error messages to users
        console.error('Fetch homepage error:', err);
        setError('Impossible de charger le contenu. Veuillez réessayer.');
        setLoading(false);
      });
    return () => controller.abort();
  }, []);

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    // Bug de sécurité : XSS potentiel si error contient du HTML
    return <div>Erreur : {error}</div>;
  }

  if (!homepage || !homepage.data) {
    return <div>Aucun contenu disponible</div>;
  }

  const { hero, formations } = homepage.data;

  return (
    <div className="app">
      {/* Hero Section */}
      <Hero hero={hero} />

      {/* Formations List */}
      <Formations />
    </div>
  );
}

export default App;

