export const SITE_ORIGIN = 'https://metallomsk.ru';

export const SITE_ROUTES = [
  { source: 'index.html', route: '', changefreq: 'weekly', priority: '1.0' },
  { source: 'catalog.html', route: 'catalog/', changefreq: 'weekly', priority: '0.9' },
  { source: 'profnastil.html', route: 'catalog/profnastil/', changefreq: 'weekly', priority: '0.9' },
  { source: 'metallocherepitsa.html', route: 'catalog/metallocherepitsa/', changefreq: 'weekly', priority: '0.9' },
  { source: 'siding.html', route: 'catalog/siding/', changefreq: 'weekly', priority: '0.9' },
  { source: 'evroshtaketnik.html', route: 'catalog/evroshtaketnik/', changefreq: 'weekly', priority: '0.9' },
  { source: 'ploskiy-list.html', route: 'catalog/ploskiy-list/', changefreq: 'weekly', priority: '0.8' },
  { source: 'chernyy-metall.html', route: 'catalog/chernyy-metall/', changefreq: 'weekly', priority: '0.8' },
  { source: 'evrozhalyuzi.html', route: 'catalog/evrozhalyuzi/', changefreq: 'weekly', priority: '0.9' },
  { source: 'dobornye-elementy.html', route: 'catalog/dobornye-elementy/', changefreq: 'weekly', priority: '0.8' },
  { source: 'soffity-docke.html', route: 'catalog/soffity-docke/', changefreq: 'weekly', priority: '0.8' },
  { source: 'vodostochnye-sistemy-docke.html', route: 'catalog/vodostochnye-sistemy-docke/', changefreq: 'weekly', priority: '0.8' },
  { source: 'gryadki-klumby.html', route: 'catalog/gryadki-klumby/', changefreq: 'weekly', priority: '0.8' },
  { source: 'calculator.html', route: 'calculator/', changefreq: 'monthly', priority: '0.8' },
  { source: 'buyers.html', route: 'buyers/', changefreq: 'monthly', priority: '0.7' },
  { source: 'delivery.html', route: 'delivery/', changefreq: 'monthly', priority: '0.7' },
  { source: 'blog.html', route: 'blog/', changefreq: 'weekly', priority: '0.8' },
  { source: 'article-roofing.html', route: 'blog/kak-vybrat-krovelnyy-material/', changefreq: 'monthly', priority: '0.7' },
  { source: 'contacts.html', route: 'contacts/', changefreq: 'monthly', priority: '0.7' },
  { source: 'offer.html', route: 'legal/offer/', changefreq: 'yearly', priority: '0.3' },
  { source: 'return-policy.html', route: 'legal/return/', changefreq: 'yearly', priority: '0.3' },
  { source: 'policy-personal-data.html', route: 'legal/personal-data/', changefreq: 'yearly', priority: '0.3' },
  { source: 'policy-privacy.html', route: 'legal/privacy/', changefreq: 'yearly', priority: '0.3' },
];

export const routeFor = source => SITE_ROUTES.find(item => item.source === source)?.route;
export const urlFor = source => `${SITE_ORIGIN}/${routeFor(source) ?? source}`;

export function rewriteLegacyLinks(html) {
  return [...SITE_ROUTES]
    .sort((a, b) => b.source.length - a.source.length)
    .reduce((result, item) => result.replaceAll(item.source, item.route || './'), html);
}
