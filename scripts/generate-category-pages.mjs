import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const pages = [
  {
    id: 'corrugated', file: 'profnastil.html',
    title: 'Профнастил в Омске — цены за м² | Спектр Металла',
    description: 'Профнастил С8, С10, МП-20, С21, НС35 и НС44 в Омске. Выбор покрытия, толщины и цвета RAL. Изготовление по вашим размерам.',
    hero: 'Проф<em>настил.</em>',
    intro: 'Профнастил для кровли, фасада и забора. Выберите профиль, покрытие, толщину металла и цвет RAL — изготовим листы по вашим размерам.'
  },
  {
    id: 'roofing', file: 'metallocherepitsa.html',
    title: 'Металлочерепица в Омске — цены | Спектр Металла',
    description: 'Металлочерепица Супер-Монтерей в Омске. Полимерные покрытия, разные толщины и цвета RAL. Расчёт и изготовление по размерам кровли.',
    hero: 'Металло<em>черепица.</em>',
    intro: 'Металлочерепица Супер-Монтерей для скатной кровли. Подберите покрытие, толщину и цвет — рассчитаем комплект и изготовим листы нужной длины.'
  },
  {
    id: 'siding', file: 'siding.html',
    title: 'Металлический сайдинг в Омске | Спектр Металла',
    description: 'Металлический сайдинг Евро-брус, Блокхаус и Корабельная доска в Омске. Цвета RAL и покрытия под дерево, изготовление по размерам.',
    hero: 'Металлический <em>сайдинг.</em>',
    intro: 'Металлический сайдинг для облицовки фасадов: Евро-брус, Блокхаус и Корабельная доска. Доступны цвета RAL и покрытия под дерево.'
  },
  {
    id: 'fence', file: 'evroshtaketnik.html',
    title: 'Евроштакетник в Омске — цены | Спектр Металла',
    description: 'Металлический евроштакетник Ш1, Ш2, Ш10, Ш18 и Ш19 в Омске. Односторонние и двусторонние покрытия, цвета RAL и под дерево.',
    hero: 'Евро<em>штакетник.</em>',
    intro: 'Металлический штакетник для долговечного забора. Выберите профиль, форму края, покрытие и цвет — изготовим планки нужной длины.'
  },
  {
    id: 'flatsheet', file: 'ploskiy-list.html',
    title: 'Плоский металлический лист в Омске | Спектр Металла',
    description: 'Плоский оцинкованный и окрашенный металлический лист в Омске. Лист в плёнке и без плёнки, выбор толщины, покрытия и цвета.',
    hero: 'Плоский <em>лист.</em>',
    intro: 'Плоский металлический лист для кровельных, фасадных и производственных работ. Выберите покрытие, толщину и защитную плёнку.'
  },
  {
    id: 'rolled', file: 'chernyy-metall.html',
    title: 'Чёрный металлопрокат в Омске | Спектр Металла',
    description: 'Чёрный металлопрокат и профильные трубы в Омске. Квадратная и прямоугольная труба разных размеров и толщины стенки.',
    hero: 'Чёрный <em>металл.</em>',
    intro: 'Профильные трубы из чёрного металла для строительства и производства. В каталоге представлены квадратные и прямоугольные сечения.'
  },
  {
    id: 'jaluzi', file: 'evrozhalyuzi.html',
    title: 'Забор Еврожалюзи в Омске — цены | Спектр Металла',
    description: 'Ламели и П-профиль для забора Еврожалюзи в Омске. Полимерные покрытия, цвета RAL и варианты под дерево.',
    hero: 'Забор <em>Еврожалюзи.</em>',
    intro: 'Комплектующие для современного забора Еврожалюзи: ламель и П-профиль. Выберите покрытие и цвет для расчёта комплекта.'
  },
  {
    id: 'dobor', file: 'dobornye-elementy.html',
    title: 'Доборные элементы в Омске | Спектр Металла',
    description: 'Доборные элементы для кровли и фасада в Омске. Коньки, планки, отливы и другие изделия из металла по вашим размерам.',
    hero: 'Доборные <em>элементы.</em>',
    intro: 'Доборные элементы для завершения кровли и фасада. Изготовим коньки, планки, отливы и другие изделия по вашим размерам.'
  },
  {
    id: 'soffit', file: 'soffity-docke.html',
    title: 'Софиты Döcke в Омске — Стандарт, Премиум, Люкс',
    description: 'Софиты Döcke для подшивки кровли в Омске. Серии Стандарт, Премиум и Люкс, перфорированные и сплошные панели.',
    hero: 'Софиты <em>Döcke.</em>',
    intro: 'Софиты Döcke для аккуратной и вентилируемой подшивки карнизов. Сравните серии Стандарт, Премиум и Люкс и доступные цвета.'
  },
  {
    id: 'gutter', file: 'vodostochnye-sistemy-docke.html',
    title: 'Водосточные системы Döcke в Омске | Спектр Металла',
    description: 'Водосточные системы Döcke в Омске. Серии Стандарт, Премиум и Люкс, элементы водостока и подбор комплекта для кровли.',
    hero: 'Водосточные системы <em>Döcke.</em>',
    intro: 'Водосточные системы Döcke для отвода воды с кровли. Выберите серию, цвет и элементы — поможем рассчитать полный комплект.'
  },
  {
    id: 'garden', file: 'gryadki-klumby.html',
    title: 'Металлические грядки и клумбы в Омске — цены',
    description: 'Металлические грядки и клумбы в Омске. Полимерные покрытия и фактура под дерево, разные размеры и изготовление под заказ.',
    hero: 'Грядки и <em>клумбы.</em>',
    intro: 'Металлические грядки и клумбы с защитным покрытием. Выберите размер и цвет или закажите изготовление по вашим размерам.'
  }
];

const escapeHtml = value => value
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const source = await readFile(resolve(root, 'catalog.html'), 'utf8');

for (const page of pages) {
  const url = `https://spectr-metalla.ru/${page.file}`;
  let html = source
    .replace('<!doctype html>', '<!doctype html>\n<!-- GENERATED from catalog.html by scripts/generate-category-pages.mjs -->')
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeHtml(page.description)}" />`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeHtml(page.title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escapeHtml(page.description)}" />`)
    .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`)
    .replace('<body>', `<body data-catalog-category="${page.id}">`)
    .replace(/<h1 class="hero-title">[\s\S]*?<\/h1>/, `<h1 class="hero-title">${page.hero}</h1>`)
    .replace(/<p class="hero-desc">[\s\S]*?<\/p>/, `<p class="hero-desc">\n        ${page.intro}\n      </p>`);

  await writeFile(resolve(root, page.file), html);
}

console.log(`Generated ${pages.length} category pages.`);
