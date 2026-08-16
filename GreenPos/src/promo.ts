import { Promo } from './types';

export interface AppliedPromo {
  promo: Promo;
  discountAmount: number;
}

export interface PromoLine {
  qty: number;
  unitPrice: number;
  category: string;
}

// Auto-picks the single best-value promo for a cart (highest discount wins)
// rather than requiring the cashier to enter a promo code. Shared by the
// mock transactionApi.create (source of truth) and the Order screen (live
// preview before checkout), so both sides always agree on the amount.
export function computeBestPromo(lines: PromoLine[], promos: Promo[]): AppliedPromo | null {
  const subtotalAll = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  if (subtotalAll <= 0) return null;

  let best: AppliedPromo | null = null;
  for (const promo of promos) {
    if (!promo.active || subtotalAll < promo.minPurchase) continue;

    const eligibleLines =
      promo.categories && promo.categories.length > 0
        ? lines.filter(l => promo.categories!.includes(l.category))
        : lines;
    const eligibleSubtotal = eligibleLines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
    if (eligibleSubtotal <= 0) continue;

    const discountAmount =
      promo.type === 'percentage'
        ? Math.round(eligibleSubtotal * (promo.value / 100))
        : Math.min(promo.value, eligibleSubtotal);
    if (discountAmount <= 0) continue;

    if (!best || discountAmount > best.discountAmount) {
      best = { promo, discountAmount };
    }
  }
  return best;
}
