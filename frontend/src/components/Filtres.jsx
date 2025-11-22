import React from 'react';

class Filtres extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      category: props.value && props.value.category ? props.value.category : '',
      level: props.value && props.value.level ? props.value.level : ''
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value && this.props.value) {
      this.setState({
        category: this.props.value.category || '',
        level: this.props.value.level || ''
      });
    }
  }

  onChangeCategory = (e) => {
    const category = e.target.value || '';
    this.setState({ category }, () => this.emitChange());
  }

  onChangeLevel = (e) => {
    const level = e.target.value || '';
    this.setState({ level }, () => this.emitChange());
  }

  reset = () => {
    this.setState({ category: '', level: '' }, () => this.emitChange());
  }

  emitChange() {
    if (typeof this.props.onChange === 'function') {
      const payload = { category: this.state.category || null, level: this.state.level || null };
      this.props.onChange(payload);
    }
  }

  renderOptions(list) {
    if (!Array.isArray(list) || list.length === 0) return null;
    return [
      <option key="_all" value="">Toutes</option>,
      ...list.map((v) => (
        <option key={String(v)} value={String(v)}>{String(v)}</option>
      ))
    ];
  }

  render() {
    const { categories = [], levels = [], loading = false, disabled = false } = this.props;
    const { category, level } = this.state;

    return (
      <div className="filtres">
        <label>
          Catégorie:&nbsp;
          <select value={category} onChange={this.onChangeCategory} disabled={disabled}>
            {loading ? <option>Chargement...</option> : this.renderOptions(categories)}
          </select>
        </label>

        <label style={{ marginLeft: '12px' }}>
          Niveau:&nbsp;
          <select value={level} onChange={this.onChangeLevel} disabled={disabled}>
            {loading ? <option>Chargement...</option> : this.renderOptions(levels)}
          </select>
        </label>

        <button type="button" style={{ marginLeft: '12px' }} onClick={this.reset} disabled={disabled}>Réinitialiser</button>
      </div>
    );
  }
}

export default Filtres;
