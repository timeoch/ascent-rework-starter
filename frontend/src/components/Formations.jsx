import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Filtres from './Filtres';
import { useQuery } from '@tanstack/react-query';

const fetchFormations = async ({ queryKey }) => {
  const [_key, { page, limit, category, level }] = queryKey;
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (category) qs.set('category', String(category));
  if (level) qs.set('level', String(level));
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`/api/content/homepage?${qs.toString()}`, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json || !json.success) throw new Error(json && json.error ? json.error : 'Invalid response');
    return json.data;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

function Formations() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [filters, setFilters] = useState({ category: null, level: null });
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const { data, error, isLoading, isFetching, refetch, failureCount } = useQuery(
    ['formations', { page, limit, category: filters.category, level: filters.level }],
    fetchFormations,
    {
      keepPreviousData: true,
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 10,
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
    }
  );

  const formations = useMemo(() => (data && data.formations) || [], [data]);
  const pagination = useMemo(() => (data && data.pagination) || { page, limit, total: 0, totalPages: 0 }, [data, page, limit]);

  const onFiltersChange = useCallback(({ category, level }) => {
    setFilters({ category: category || null, level: level || null });
    setPage(1);
  }, []);

  const goToPage = useCallback((p) => { setPage(p); }, []);
  const changeLimit = useCallback((l) => { setLimit(l); setPage(1); }, []);

  const categories = useMemo(() => (data && data.formations ? Array.from(new Set(data.formations.map(i => (i.category || '').toString()).filter(Boolean))) : []), [data]);
  const levels = useMemo(() => (data && data.formations ? Array.from(new Set(data.formations.map(i => (i.level || '').toString()).filter(Boolean))) : []), [data]);

  return (
    <section className="formations">
      <h2>Nos Formations</h2>

      <div className="formations-controls">
        <Filtres categories={categories} levels={levels} value={filters} onChange={onFiltersChange} loading={false} disabled={isLoading} />
        <div className="pagination-summary">
          {pagination.total > 0 ? (
            <span>Affichage page {pagination.page} / {pagination.totalPages} — {pagination.total} formations</span>
          ) : null}
        </div>
        <div className="limit-select">
          <label>Par page:&nbsp;</label>
          <select value={pagination.limit} onChange={(e) => changeLimit(Number(e.target.value))} disabled={isLoading}>
            <option value={4}>4</option>
            <option value={8}>8</option>
            <option value={16}>16</option>
          </select>
        </div>
      </div>

      {!online ? <div className="offline-banner">Vous êtes hors-ligne — affichage du cache.</div> : null}

      {isLoading ? <div>Chargement des formations...</div> : null}
      {error ? (
        <div style={{ color: 'red' }}>
          Erreur: {error.message || String(error)}
          <div>
            {failureCount < 2 ? <span>Réessai automatique en cours...</span> : <button onClick={() => refetch()}>Réessayer</button>}
          </div>
        </div>
      ) : null}

      {!isLoading && formations && formations.length === 0 ? (
        <div>Aucune formation trouvée.</div>
      ) : null}

      <div className="formations-grid">
        {formations.map((f, idx) => {
          const safeImage = "https://www.francetravail.fr/files/live/sites/PE/files/secteurs-metiers/Domotique-web-telecom/sorienter-vers-linformatique850.jpg"
          return (
            <article key={f.id != null ? f.id : `f-${idx}`} className="formation-card" aria-busy={isFetching}>
              <div className="card-media">
                {safeImage ? (
                  <img loading="lazy" decoding="async" src={safeImage} alt={f.title || 'Formation'} />
                ) : (
                  <div className="card-placeholder">Image</div>
                )}
                <div className="price-badge">{f.price ? `${f.price}€` : ''}</div>
              </div>

              <div className="card-body">
                <h3>{f.title || '—'}</h3>
                <p className="card-desc">{f.description || ''}</p>
                <div className="formation-meta">
                  <span className="meta-chip">{f.category}</span>
                  <span className="meta-chip">{f.level}</span>
                  <span className="meta-chip">{f.duration ? `${f.duration} jours` : ''}</span>
                </div>
              </div>

              <div className="card-footer">
                <button className="cta">En savoir plus</button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="pagination-controls">
        <button disabled={!pagination.prevPage} onClick={() => goToPage(pagination.prevPage || 1)}>Précédent</button>
        {Array.from({ length: Math.max(1, pagination.totalPages) }, (_, i) => i + 1).map(p => (
          <button key={p} disabled={p === pagination.page} onClick={() => goToPage(p)}>{p}</button>
        ))}
        <button disabled={!pagination.nextPage} onClick={() => goToPage(pagination.nextPage || pagination.page)}>Suivant</button>
      </div>
    </section>
  );
}

export default React.memo(Formations);
