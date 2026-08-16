import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { productApi, promoApi, transactionApi } from '../api';
import { AppHeader } from '../components/AppHeader';
import { ReceiptView } from '../components/ReceiptView';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { formatRupiah } from '../format';
import { computeBestPromo } from '../promo';
import { shared } from '../sharedStyles';
import { colors } from '../theme';
import { CartLine, CreatedOrder, Product, Promo } from '../types';

const CATEGORY_COLORS: Record<string, string> = {
  Minuman: '#DBEAFE',
  Roti: '#FDE9C7',
  Snack: '#FFE0C2',
  Makanan: '#D6F2E3',
};
const DEFAULT_CATEGORY_COLOR = colors.paperDim;

interface Props {
  storeId: string;
  onGoToPayment: (transactionId: string) => void;
}

export function PosScreen({ storeId, onGoToPayment }: Props) {
  const { user } = useAuth();
  const { productColumns, isTablet } = useResponsive();

  const [catalog, setCatalog] = useState<Product[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [promos, setPromos] = useState<Promo[]>([]);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [cart, setCart] = useState<CartLine[]>([]);

  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  function loadCatalog() {
    setLoadingCatalog(true);
    setCatalogError(null);
    productApi
      .list()
      .then(setCatalog)
      .catch(err =>
        setCatalogError(err instanceof Error ? err.message : 'Gagal memuat produk.'),
      )
      .finally(() => setLoadingCatalog(false));
  }
  useEffect(loadCatalog, [storeId]);
  useEffect(() => {
    promoApi.listActive().then(setPromos);
  }, []);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(catalog.map(p => p.category)))],
    [catalog],
  );
  const filtered = catalog.filter(
    p =>
      p.name.toLowerCase().includes(query.toLowerCase()) &&
      (category === 'all' || p.category === category),
  );
  const subtotal = useMemo(
    () => cart.reduce((s, l) => s + l.price * l.qty, 0),
    [cart],
  );
  const appliedPromo = useMemo(() => {
    const lines = cart.map(l => ({
      qty: l.qty,
      unitPrice: l.price,
      category: catalog.find(p => p.id === l.productId)?.category ?? '',
    }));
    return computeBestPromo(lines, promos);
  }, [cart, catalog, promos]);
  const discount = appliedPromo?.discountAmount ?? 0;
  const total = subtotal - discount;
  const itemCount = useMemo(() => cart.reduce((s, l) => s + l.qty, 0), [cart]);

  function addItem(p: Product) {
    setCart(prev => {
      const existing = prev.find(l => l.productId === p.id);
      const currentQty = existing?.qty ?? 0;
      if (currentQty + 1 > p.stock) {
        return prev;
      }
      if (existing) {
        return prev.map(l =>
          l.productId === p.id ? { ...l, qty: l.qty + 1 } : l,
        );
      }
      return [...prev, { productId: p.id, name: p.name, price: p.price, qty: 1 }];
    });
  }

  function updateQty(productId: string, delta: number) {
    setCart(prev =>
      prev
        .map(l => {
          if (l.productId !== productId) return l;
          if (delta > 0) {
            const stock = catalog.find(p => p.id === productId)?.stock ?? Infinity;
            if (l.qty + delta > stock) return l;
          }
          return { ...l, qty: l.qty + delta };
        })
        .filter(l => l.qty > 0),
    );
  }

  function removeLine(productId: string) {
    setCart(prev => prev.filter(l => l.productId !== productId));
  }

  async function handleCreateOrder() {
    setOrderError(null);
    setCreatingOrder(true);
    try {
      const items = cart.map(l => ({ productId: l.productId, qty: l.qty }));
      const order = await transactionApi.create(items);
      setCreatedOrder(order);
      setCart([]);
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Gagal membuat pesanan.');
    } finally {
      setCreatingOrder(false);
    }
  }

  function handleNewOrder() {
    setCreatedOrder(null);
    setShowPrintPreview(false);
    setOrderError(null);
    loadCatalog();
  }

  if (createdOrder && showPrintPreview) {
    return (
      <View style={shared.container}>
        <ScrollView contentContainerStyle={styles.printScreen}>
          <ReceiptView
            merchantName={user?.merchantName || 'Toko'}
            storeName={user?.storeName || ''}
            storeAddress={user?.storeAddress || user?.merchantAddress || ''}
            invoiceNo={createdOrder.invoiceNo}
            cashierName={user?.name ?? 'Kasir'}
            items={createdOrder.items.map(i => ({ name: i.name, qty: i.qty, price: i.unitPrice }))}
            subtotal={createdOrder.subtotal}
            discount={createdOrder.discount}
            promoName={createdOrder.promoName}
            total={createdOrder.total}
            paid={false}
            paidAt={new Date().toLocaleString('id-ID')}
          />
          <Text style={styles.printHint}>
            Slip order untuk pelayan — tunjukkan saat mengantar pesanan ke meja.
          </Text>
          <TouchableOpacity
            style={[shared.primaryButton, styles.printCloseButton]}
            onPress={() => setShowPrintPreview(false)}>
            <Text style={shared.primaryButtonText}>Tutup</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (createdOrder) {
    return (
      <View style={shared.centerScreen}>
        <View style={styles.successCard}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successTitle}>Pesanan dibuat</Text>
        <Text style={styles.successInvoice}>{createdOrder.invoiceNo}</Text>
        <View style={styles.successSummary}>
          <Text style={styles.successSummaryText}>
            {createdOrder.itemCount} item · {formatRupiah(createdOrder.total)}
          </Text>
          {createdOrder.discount > 0 && (
            <Text style={styles.successPromoText}>
              🏷️ Hemat {formatRupiah(createdOrder.discount)} ({createdOrder.promoName})
            </Text>
          )}
        </View>
        <Text style={styles.successNote}>
          Pesanan ini menunggu diproses di menu Pembayaran.
        </Text>

        <TouchableOpacity
          style={[shared.primaryButton, styles.actionButton]}
          onPress={() => onGoToPayment(createdOrder.id)}>
          <Text style={shared.primaryButtonText}>Lanjut Pembayaran</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[shared.secondaryButton, styles.actionButton]}
          onPress={() => setShowPrintPreview(true)}>
          <Text style={shared.secondaryButtonText}>Print Order</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNewOrder} style={styles.newOrderLink}>
          <Text style={styles.newOrderLinkText}>Pesanan Baru</Text>
        </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={shared.container}>
      <AppHeader
        title="Order"
        subtitle={isTablet ? undefined : user?.storeName || 'Semua store'}
      />

      <View style={styles.bounds}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Cari produk…"
          style={shared.searchInput}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryRow}>
          {categories.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.categoryChip, category === c && styles.categoryChipActive]}
              onPress={() => setCategory(c)}>
              <Text
                style={[
                  styles.categoryChipText,
                  category === c && styles.categoryChipTextActive,
                ]}>
                {c === 'all' ? 'Semua' : c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[styles.splitRow, isTablet && styles.splitRowTablet]}>
          <View style={styles.productPane}>
            {catalogError && <Text style={shared.errorText}>{catalogError}</Text>}

            {loadingCatalog ? (
              <ActivityIndicator style={{ marginTop: 24 }} color={colors.register} />
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={p => p.id}
                numColumns={productColumns}
                key={productColumns}
                columnWrapperStyle={styles.productRow}
                contentContainerStyle={styles.productList}
                style={styles.productListContainer}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.productCard, item.stock <= 0 && styles.productCardDisabled]}
                    disabled={item.stock <= 0}
                    onPress={() => addItem(item)}>
                    <View
                      style={[
                        styles.productImage,
                        { backgroundColor: CATEGORY_COLORS[item.category] ?? DEFAULT_CATEGORY_COLOR },
                      ]}>
                      <Text style={styles.productImageEmoji}>{item.emoji}</Text>
                    </View>
                    <Text style={styles.productCategory}>{item.category}</Text>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.productPrice}>{formatRupiah(item.price)}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>

          <View
            style={[
              styles.cartPanelCommon,
              isTablet ? styles.cartPanelTablet : styles.cartPanelPhone,
            ]}>
            <Text style={styles.cartTitle}>Keranjang</Text>
            {cart.length === 0 ? (
              <View style={isTablet && styles.cartEmptyWrapTablet}>
                <Text style={styles.cartEmpty}>Belum ada item. Ketuk produk di atas.</Text>
              </View>
            ) : (
              <ScrollView style={isTablet ? styles.cartListTablet : styles.cartListPhone}>
                {cart.map(l => (
                  <View key={l.productId} style={styles.cartLine}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cartLineName}>{l.name}</Text>
                      <Text style={styles.cartLinePrice}>{formatRupiah(l.price)}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() => updateQty(l.productId, -1)}>
                      <Text style={styles.qtyButtonText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{l.qty}</Text>
                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() => updateQty(l.productId, 1)}>
                      <Text style={styles.qtyButtonText}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeLine(l.productId)}>
                      <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            {orderError && <Text style={shared.errorText}>{orderError}</Text>}

            {appliedPromo && (
              <View style={styles.promoBanner}>
                <Text style={styles.promoBannerText} numberOfLines={1}>
                  🏷️ {appliedPromo.promo.name}
                </Text>
                <Text style={styles.promoBannerValue}>
                  -{formatRupiah(appliedPromo.discountAmount)}
                </Text>
              </View>
            )}

            {discount > 0 && (
              <View style={styles.subtotalRow}>
                <Text style={styles.subtotalLabel}>Subtotal</Text>
                <Text style={styles.subtotalValue}>{formatRupiah(subtotal)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatRupiah(total)}</Text>
            </View>
            <TouchableOpacity
              style={[
                shared.primaryButton,
                (cart.length === 0 || creatingOrder) && shared.primaryButtonDisabled,
              ]}
              disabled={cart.length === 0 || creatingOrder}
              onPress={handleCreateOrder}>
              {creatingOrder ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={shared.primaryButtonText}>
                  Buat Pesanan{itemCount > 0 ? ` (${itemCount})` : ''}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bounds: {
    flex: 1,
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
  },
  splitRow: {
    flex: 1,
  },
  splitRowTablet: {
    flexDirection: 'row',
    gap: 16,
  },
  productPane: {
    flex: 1,
  },
  productListContainer: {
    flex: 1,
  },
  productList: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  productRow: {
    gap: 8,
  },
  productCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1C1B181A',
    padding: 10,
    marginBottom: 8,
  },
  productCardDisabled: {
    opacity: 0.4,
  },
  productImage: {
    width: '100%',
    height: 72,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  productImageEmoji: {
    fontSize: 32,
  },
  productCategory: {
    fontSize: 11,
    color: colors.inkSoft,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    marginTop: 2,
  },
  productPrice: {
    fontSize: 12,
    color: colors.register,
    fontWeight: '600',
    marginTop: 8,
  },
  categoryScroll: {
    flexGrow: 0,
    height: 44,
    marginBottom: 8,
  },
  categoryRow: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: '#1C1B1826',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: colors.white,
  },
  categoryChipActive: {
    backgroundColor: colors.register,
    borderColor: colors.register,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkSoft,
  },
  categoryChipTextActive: {
    color: colors.white,
  },
  cartPanelCommon: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  cartPanelPhone: {
    maxHeight: '42%',
    borderTopWidth: 1,
    borderTopColor: '#1C1B181A',
  },
  cartPanelTablet: {
    width: 340,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1C1B181A',
  },
  cartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 6,
  },
  cartEmpty: {
    fontSize: 13,
    color: colors.inkSoft,
    paddingVertical: 12,
    textAlign: 'center',
  },
  cartEmptyWrapTablet: {
    flex: 1,
    justifyContent: 'center',
  },
  cartListPhone: {
    maxHeight: 140,
  },
  cartListTablet: {
    flex: 1,
  },
  cartLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  cartLineName: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink,
  },
  cartLinePrice: {
    fontSize: 11,
    color: colors.inkSoft,
  },
  qtyButton: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1C1B1826',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: {
    fontSize: 15,
    color: colors.ink,
    fontWeight: '700',
  },
  qtyValue: {
    minWidth: 20,
    textAlign: 'center',
    fontSize: 13,
    color: colors.ink,
  },
  removeButton: {
    marginLeft: 4,
    padding: 4,
  },
  removeButtonText: {
    color: colors.alert,
    fontSize: 14,
  },
  promoBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: `${colors.teal}14`,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 8,
    gap: 8,
  },
  promoBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.teal,
  },
  promoBannerValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.teal,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  subtotalLabel: {
    fontSize: 12,
    color: colors.inkSoft,
  },
  subtotalValue: {
    fontSize: 12,
    color: colors.inkSoft,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 13,
    color: colors.inkSoft,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
  },
  successCard: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1C1B181A',
    paddingVertical: 32,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  successIcon: {
    fontSize: 40,
    color: colors.teal,
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
  },
  successInvoice: {
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 2,
    marginBottom: 16,
  },
  successSummary: {
    backgroundColor: colors.paperDim,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
  },
  successSummaryText: {
    fontSize: 14,
    color: colors.ink,
    fontWeight: '600',
  },
  successPromoText: {
    fontSize: 12,
    color: colors.teal,
    fontWeight: '600',
    marginTop: 4,
  },
  successNote: {
    fontSize: 12,
    color: colors.inkSoft,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 260,
  },
  actionButton: {
    width: '100%',
    marginTop: 10,
  },
  newOrderLink: {
    marginTop: 16,
  },
  newOrderLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkSoft,
  },
  printScreen: {
    padding: 16,
    alignItems: 'center',
  },
  printCloseButton: {
    width: 280,
    marginTop: 16,
  },
  printHint: {
    fontSize: 12,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 260,
  },
});
