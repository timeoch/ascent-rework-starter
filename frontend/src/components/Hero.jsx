import React from 'react';

class Hero extends React.Component {
  render() {
    const { hero } = this.props;
    if (!hero) return null;
    const { title = '', subtitle = '', cta = {} } = hero;

    const isSafeUrl = (u) => {
      if (!u) return false;
      try {
        if (u.startsWith('/')) return true;
        const parsed = new URL(u);
        return /^https?:$/i.test(parsed.protocol);
      } catch (e) {
        return false;
      }
    };

    const renderCta = () => {
      if (!cta || !cta.link || !cta.text) return null;
      const link = String(cta.link || '');
      if (!isSafeUrl(link)) return null;
      const external = !link.startsWith('/');
      return (
        <a className="hero-cta" href={link} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{cta.text}</a>
      );
    };

    return (
      <section className="hero">
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {renderCta()}
      </section>
    );
  }
}

export default Hero;
