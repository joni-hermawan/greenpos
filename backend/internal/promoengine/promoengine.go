// Package promoengine is a direct Go port of GreenPos/src/promo.ts —
// auto-picks the single best-value promo for a cart (highest discount wins)
// rather than requiring the cashier to enter a promo code. Keep this in
// lockstep with promo.ts's computeBestPromo if either changes.
package promoengine

import (
	"math"

	"greenpos-backend/internal/domain"
)

type Line struct {
	Qty       int
	UnitPrice int64
	Category  string
}

type Applied struct {
	Promo          domain.Promo
	DiscountAmount int64
}

func contains(list []string, v string) bool {
	for _, x := range list {
		if x == v {
			return true
		}
	}
	return false
}

func lineSubtotal(lines []Line) int64 {
	var s int64
	for _, l := range lines {
		s += l.UnitPrice * int64(l.Qty)
	}
	return s
}

func ComputeBestPromo(lines []Line, promos []domain.Promo) *Applied {
	subtotalAll := lineSubtotal(lines)
	if subtotalAll <= 0 {
		return nil
	}

	var best *Applied
	for _, promo := range promos {
		if !promo.Active || subtotalAll < promo.MinPurchase {
			continue
		}

		var eligible []Line
		if len(promo.Categories) > 0 {
			for _, l := range lines {
				if contains(promo.Categories, l.Category) {
					eligible = append(eligible, l)
				}
			}
		} else {
			eligible = lines
		}
		eligibleSubtotal := lineSubtotal(eligible)
		if eligibleSubtotal <= 0 {
			continue
		}

		var discount int64
		if promo.Type == domain.PromoPercentage {
			discount = int64(math.Round(float64(eligibleSubtotal) * (promo.Value / 100)))
		} else {
			discount = int64(promo.Value)
			if eligibleSubtotal < discount {
				discount = eligibleSubtotal
			}
		}
		if discount <= 0 {
			continue
		}

		if best == nil || discount > best.DiscountAmount {
			best = &Applied{Promo: promo, DiscountAmount: discount}
		}
	}
	return best
}
