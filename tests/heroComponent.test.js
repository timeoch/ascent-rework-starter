import React from 'react';
import { render, screen } from '@testing-library/react';
import Hero from '../frontend/src/components/Hero.jsx';

test('Hero component renders title, subtitle and CTA correctly', () => {
  const hero = { title: 'T', subtitle: 'S', cta: { text: 'Go', link: 'https://example.com' } };
  render(<Hero hero={hero} />);
  expect(screen.getByText('T')).toBeTruthy();
  expect(screen.getByText('S')).toBeTruthy();
  const a = screen.getByText('Go');
  expect(a.getAttribute('href')).toBe('https://example.com');
  expect(a.getAttribute('target')).toBe('_blank');
});
