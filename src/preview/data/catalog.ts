export type Product = {
  id: string;
  name: string;
  brand: string;
  priceCents: number;
  /** Stands in for product photography — LynxExplorer has no bundled imagery. */
  gradient: string;
  blurb: string;
  details: string[];
  sizes: string[];
  rating: number;
  reviewCount: number;
};

export const PRODUCTS: Product[] = [
  {
    id: 'p-aurora-parka',
    name: 'Aurora Parka',
    brand: 'Northwell',
    priceCents: 24900,
    gradient: 'linear-gradient(160deg, #2B3A67 0%, #6A7FC1 100%)',
    blurb:
      'A weatherproof shell built for commutes that start dry and end otherwise.',
    details: [
      'Recycled ripstop, 20k waterproof rating',
      'Fully taped seams with storm placket',
      'Packs into its own left pocket',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    rating: 4.6,
    reviewCount: 218,
  },
  {
    id: 'p-terra-boot',
    name: 'Terra Boot',
    brand: 'Fieldmark',
    priceCents: 18500,
    gradient: 'linear-gradient(160deg, #6B4423 0%, #B98055 100%)',
    blurb: 'Resoleable leather boots that break in over weeks, not years.',
    details: [
      'Full-grain leather, vegetable tanned',
      'Goodyear welt — resole indefinitely',
      'Cork footbed moulds to your step',
    ],
    sizes: ['7', '8', '9', '10', '11', '12'],
    rating: 4.8,
    reviewCount: 1043,
  },
  {
    id: 'p-loop-scarf',
    name: 'Loop Scarf',
    brand: 'Hallow',
    priceCents: 6900,
    gradient: 'linear-gradient(160deg, #7A2E4A 0%, #D98CA6 100%)',
    blurb: 'Merino wool, milled in Biella, soft enough to sleep in.',
    details: ['100% extrafine merino', '180 × 30 cm', 'Machine washable cold'],
    sizes: ['One size'],
    rating: 4.4,
    reviewCount: 96,
  },
  {
    id: 'p-drift-pack',
    name: 'Drift Pack 22L',
    brand: 'Northwell',
    priceCents: 13500,
    gradient: 'linear-gradient(160deg, #1F4B43 0%, #5FA392 100%)',
    blurb: 'A daypack that swallows a laptop, lunch, and a change of clothes.',
    details: [
      '22L, fits 16" laptop',
      'Roll-top with side access',
      'Lifetime repair guarantee',
    ],
    sizes: ['One size'],
    rating: 4.7,
    reviewCount: 512,
  },
  {
    id: 'p-ember-mug',
    name: 'Ember Mug',
    brand: 'Kiln & Co',
    priceCents: 3200,
    gradient: 'linear-gradient(160deg, #8A3B12 0%, #E0A06A 100%)',
    blurb: 'Stoneware thrown in small batches. No two glazes match.',
    details: ['350ml stoneware', 'Dishwasher safe', 'Made in Stoke-on-Trent'],
    sizes: ['One size'],
    rating: 4.2,
    reviewCount: 74,
  },
  {
    id: 'p-atlas-watch',
    name: 'Atlas Field Watch',
    brand: 'Meridian',
    priceCents: 39500,
    gradient: 'linear-gradient(160deg, #23262B 0%, #757C88 100%)',
    blurb: 'Automatic movement, sapphire crystal, refreshingly few features.',
    details: [
      '38mm brushed steel case',
      'Sapphire crystal, 100m water resistance',
      'Swiss automatic, 41h reserve',
    ],
    sizes: ['One size'],
    rating: 4.9,
    reviewCount: 331,
  },
];

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === id);
}

/**
 * Saved payment methods and addresses — the checkout screen renders these,
 * which is what makes it the heaviest screen in the app and therefore the
 * one worth preloading.
 */
export const SAVED_ADDRESSES = [
  { id: 'a-1', label: 'Home', line: '14 Rosewood Ave, Kraków 31-002' },
  { id: 'a-2', label: 'Work', line: 'Software Mansion, Kraków 30-347' },
  { id: 'a-3', label: 'Parents', line: '8 Lipowa St, Zakopane 34-500' },
];

export const SAVED_CARDS = [
  { id: 'c-1', label: 'Visa •••• 4429', expiry: '08/28' },
  { id: 'c-2', label: 'Mastercard •••• 8810', expiry: '01/27' },
];

export const DELIVERY_SLOTS = [
  { id: 'd-1', day: 'Tomorrow', window: '09:00 – 12:00', priceCents: 0 },
  { id: 'd-2', day: 'Tomorrow', window: '12:00 – 17:00', priceCents: 0 },
  { id: 'd-3', day: 'Tomorrow', window: '17:00 – 21:00', priceCents: 500 },
  { id: 'd-4', day: 'Thursday', window: '09:00 – 12:00', priceCents: 0 },
  { id: 'd-5', day: 'Thursday', window: '12:00 – 17:00', priceCents: 0 },
  { id: 'd-6', day: 'Thursday', window: '17:00 – 21:00', priceCents: 500 },
];
