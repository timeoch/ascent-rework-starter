import validate from '../backend/src/utils/validateHomepage.js';

test('validateHomepage detects duplicates and missing fields', () => {
  const raw = {
    hero: { title: 'X', subtitle: '', cta: { text: '', link: '' } },
    formations: [
      { id: 1, title: 'A', category: 'cat', level: 'beg', duration: 10, price: 100 },
      { id: 1, title: '', category: '', level: '', duration: -1, price: -5 }
    ]
  };
  const { data, errors } = validate(raw);
  expect(Array.isArray(errors)).toBe(true);
  const hasDuplicate = errors.some(e => /Duplicate id/.test(e.message) || /reassigned/.test(e.message));
  expect(hasDuplicate).toBe(true);
  const hasMissingTitle = errors.some(e => /title/.test(e.path));
  expect(hasMissingTitle).toBe(true);
});
