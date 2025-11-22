import React from 'react';
import Filtres from './Filtres';

class Formations extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      formations: [],
      pagination: { page: 1, limit: 6, total: 0, totalPages: 0 },
      loading: false,
      error: null,
      filters: { category: null, level: null },
      options: { categories: [], levels: [] },
      optionsLoading: false,
      optionsError: null
    };
    this._controller = null;
  }

  componentDidMount() {
    const { page = 1, limit = 6 } = this.state.pagination;
    this.fetchPage(page, limit);
    this.fetchMetadata();
  }

  componentWillUnmount() {
    if (this._controller) this._controller.abort();
  }

  fetchPage(page = 1, limit = 6, filters = null) {
    if (this._controller) this._controller.abort();
    this._controller = new AbortController();
    const signal = this._controller.signal;

    this.setState({ loading: true, error: null });
    const activeFilters = filters || this.state.filters || {};
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (activeFilters.category) qs.set('category', String(activeFilters.category));
    if (activeFilters.level) qs.set('level', String(activeFilters.level));
    fetch(`/api/content/homepage?${qs.toString()}`, { signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(json => {
        if (!json || !json.success) throw new Error(json && json.error ? json.error : 'Invalid response');
        const data = json.data || {};
        this.setState({
          formations: data.formations || [],
          pagination: Object.assign({}, this.state.pagination, data.pagination || { page, limit }),
          loading: false
        });
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        this.setState({ loading: false, error: err.message || 'Erreur réseau' });
      });
  }

  goToPage(p) {
    const limit = this.state.pagination.limit || 6;
    this.fetchPage(p, limit);
  }

  changeLimit(limit) {
    // optimistically set limit in pagination and fetch page 1
    this.setState(prev => ({ pagination: Object.assign({}, prev.pagination, { page: 1, limit }) }), () => {
      this.fetchPage(1, limit);
    });
  }

  fetchMetadata() {
    this.setState({ optionsLoading: true, optionsError: null });
    const qs = new URLSearchParams({ page: '1', limit: '100' });
    fetch(`/api/content/homepage?${qs.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(json => {
        if (!json || !json.success) throw new Error(json && json.error ? json.error : 'Invalid response');
        const items = Array.isArray(json.data && json.data.formations) ? json.data.formations : [];
        const categories = Array.from(new Set(items.map(i => (i.category || '').toString()).filter(Boolean)));
        const levels = Array.from(new Set(items.map(i => (i.level || '').toString()).filter(Boolean)));
        this.setState({ options: { categories, levels }, optionsLoading: false });
      })
      .catch((err) => { this.setState({ optionsLoading: false, optionsError: err && err.message ? err.message : 'Erreur metadata' }); });
  }

  onFiltersChange = ({ category, level }) => {
    const filters = { category: category || null, level: level || null };
    this.setState({ filters }, () => {
      const limit = this.state.pagination.limit || 6;
      this.fetchPage(1, limit, filters);
    });
  }

  render() {
    const { formations, pagination, loading, error } = this.state;

    return (
      <section className="formations">
        <h2>Nos Formations</h2>

        <div className="formations-controls">
          <Filtres categories={this.state.options.categories} levels={this.state.options.levels} value={this.state.filters} onChange={this.onFiltersChange} loading={this.state.optionsLoading} disabled={this.state.loading || this.state.optionsLoading} />
          <div className="pagination-summary">
            {pagination.total > 0 ? (
              <span>Affichage page {pagination.page} / {pagination.totalPages} — {pagination.total} formations</span>
            ) : null}
          </div>
          <div className="limit-select">
            <label>Par page:&nbsp;</label>
            <select value={pagination.limit} onChange={(e) => this.changeLimit(Number(e.target.value))} disabled={this.state.loading}>
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
            </select>
          </div>
        </div>

        {this.state.optionsError ? <div style={{ color: 'orange' }}>Erreur lors du chargement des filtres : {this.state.optionsError}</div> : null}

        {loading ? <div>Chargement des formations...</div> : null}
        {error ? <div style={{ color: 'red' }}>Erreur: {error}</div> : null}

        {!loading && formations && formations.length === 0 ? (
          <div>Aucune formation trouvée.</div>
        ) : null}

        <div className="formations-grid">
          {formations.map((f, idx) => {
            const safeImage = typeof f.image === 'string' && (f.image.startsWith('/') || /^https?:\/\//i.test(f.image)) ? f.image : null;
            return (
              <div key={f.id != null ? f.id : `f-${idx}`} className="formation-card">
                {safeImage ? <img src={safeImage} alt={f.title || 'Formation'} /> : null}
                <h3>{f.title || '—'}</h3>
                <p>{f.description || ''}</p>
                <div className="formation-meta">
                  <span>{f.category}</span>
                  <span>{f.level}</span>
                  <span>{f.duration} jours</span>
                  <span>{f.price}€</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination controls */}
        <div className="pagination-controls">
          <button disabled={!pagination.prevPage} onClick={() => this.goToPage(pagination.prevPage || 1)}>Précédent</button>
          {Array.from({ length: Math.max(1, pagination.totalPages) }, (_, i) => i + 1).map(p => (
            <button key={p} disabled={p === pagination.page} onClick={() => this.goToPage(p)}>{p}</button>
          ))}
          <button disabled={!pagination.nextPage} onClick={() => this.goToPage(pagination.nextPage || pagination.page)}>Suivant</button>
        </div>
      </section>
    );
  }
}

export default Formations;
