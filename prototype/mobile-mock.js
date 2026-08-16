/**
 * Interactive mock of GreenPos Mobile, built directly from the real app's
 * source (GreenPos/App.tsx, src/screens/*, src/theme.ts) and the real
 * backend seed data (backend/data/products.json, users.json) — NOT a
 * different project's UI. React Native isn't embeddable in a browser, so
 * this reproduces the same colors, sidebar, tabs, categories, product
 * catalog and flows in plain HTML/CSS/JS so it can be clicked through here.
 */

var PRODUCTS = [
  { id: 'p1', name: 'Kopi Susu Gula Aren', category: 'Minuman', price: 22000, stock: 48, emoji: '☕' },
  { id: 'p2', name: 'Americano', category: 'Minuman', price: 18000, stock: 30, emoji: '☕' },
  { id: 'p3', name: 'Matcha Latte', category: 'Minuman', price: 25000, stock: 0, emoji: '🍵' },
  { id: 'p4', name: 'Croissant Butter', category: 'Roti', price: 19000, stock: 21, emoji: '🥐' },
  { id: 'p5', name: 'Roti Sourdough', category: 'Roti', price: 32000, stock: 14, emoji: '🍞' },
  { id: 'p6', name: 'Donat Cokelat', category: 'Roti', price: 12000, stock: 40, emoji: '🍩' },
  { id: 'p7', name: 'Kentang Goreng', category: 'Snack', price: 21000, stock: 0, emoji: '🍟' },
  { id: 'p8', name: 'Nugget Ayam', category: 'Snack', price: 24000, stock: 18, emoji: '🍗' },
  { id: 'p9', name: 'Nasi Goreng Spesial', category: 'Makanan', price: 35000, stock: 25, emoji: '🍛' },
  { id: 'p10', name: 'Mie Ayam Bakso', category: 'Makanan', price: 28000, stock: 0, emoji: '🍜' },
  { id: 'p11', name: 'Es Teh Manis', category: 'Minuman', price: 10000, stock: 60, emoji: '🧋' },
  { id: 'p12', name: 'Cheese Cake Slice', category: 'Roti', price: 27000, stock: 0, emoji: '🍰' },
  { id: 'p13', name: 'Teh Tarik', category: 'Minuman', price: 15000, stock: 20, emoji: '🥤' },
];
var CATEGORY_COLORS = { Minuman: '#DBEAFE', Roti: '#FDE9C7', Snack: '#FFE0C2', Makanan: '#D6F2E3' };
var TABS = [
  { id: 'pos', label: 'Order', icon: '🛒' },
  { id: 'pembayaran', label: 'Pembayaran', icon: '💳' },
  { id: 'riwayat', label: 'Riwayat', icon: '🧾' },
  { id: 'settings', label: 'Pengaturan', icon: '⚙️' },
];
var DEVICES = [
  { id: 'bca', name: 'EDC BCA', model: 'PAX A920 Pro', swatchColor: '#1554B0' },
  { id: 'pvs', name: 'EDC PVS', model: 'Verifone V240m', swatchColor: '#EA580C' },
];
var DEMO_USER = { username: 'kasir01', password: 'demo123', name: 'Dewi Anjani', role: 'kasir', storeName: 'Toko Pusat - Sudirman' };

var _root = null;
var _orderSeq = 1;
var state = {
  loggedIn: false,
  loginError: null,
  user: null,
  tab: 'pos',
  category: 'all',
  cart: {},
  orders: [],
  selectedOrderId: null,
  payFlow: null,
  history: [],
  settingsSection: null,
  edc: { step: 'select', device: null, testing: false, testOk: false },
};

function fmtRp(n) { return 'Rp ' + n.toLocaleString('id-ID'); }
function el(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }

function render() {
  if (!_root) return;
  _root.innerHTML = '';
  _root.appendChild(state.loggedIn ? renderMain() : renderLogin());
}

/* ---------------- LOGIN ---------------- */
function renderLogin() {
  var wrap = el(
    '<div class="mock-login">' +
      '<div class="mock-login-card">' +
        '<div class="mock-login-brand"><img src="assets/logo-mark.png" alt="GreenPos"><span class="w1">green</span> <span class="w2">pos</span></div>' +
        '<h2>Masuk</h2>' +
        '<p class="hint">Gunakan akun yang diberikan administrator toko.</p>' +
        (state.loginError ? '<div class="mock-err">' + state.loginError + '</div>' : '') +
        '<div class="mock-field"><label>Username</label><input id="mock-username" placeholder="kasir01"></div>' +
        '<div class="mock-field"><label>Password</label><input id="mock-password" type="password" placeholder="********"></div>' +
        '<button class="mock-submit" id="mock-submit-btn">Masuk</button>' +
        '<div class="mock-demo-box">' +
          '<div class="lbl">Mode Demo — klik untuk isi otomatis:</div>' +
          '<div class="mock-demo-acct" id="mock-quickfill"><b>Kasir</b><span>kasir01</span></div>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
  wrap.querySelector('#mock-quickfill').onclick = function () {
    wrap.querySelector('#mock-username').value = DEMO_USER.username;
    wrap.querySelector('#mock-password').value = DEMO_USER.password;
  };
  wrap.querySelector('#mock-submit-btn').onclick = function () {
    var u = wrap.querySelector('#mock-username').value.trim();
    var p = wrap.querySelector('#mock-password').value;
    if (u === DEMO_USER.username && p === DEMO_USER.password) {
      state.loggedIn = true; state.loginError = null; state.user = DEMO_USER;
      render();
    } else {
      state.loginError = 'Username atau password salah.';
      render();
    }
  };
  return wrap;
}

/* ---------------- MAIN (sidebar + tab content) ---------------- */
function renderMain() {
  var wrap = el('<div id="mock-root-inner" style="display:flex;width:100%;height:100%;"></div>');
  var initial = (state.user.name || '?').trim().charAt(0).toUpperCase();

  var sidebar = el(
    '<div class="mock-sidebar">' +
      '<div class="mock-sb-brand"><img src="assets/logo-mark.png" alt="GreenPos"><span class="w1">green</span> <span class="w2">pos</span></div>' +
      TABS.map(function (t) {
        return '<div class="mock-sb-item' + (state.tab === t.id ? ' active' : '') + '" data-tab="' + t.id + '">' +
          '<span class="ic">' + t.icon + '</span><span>' + t.label + '</span></div>';
      }).join('') +
      '<div class="mock-sb-spacer"></div>' +
      '<div class="mock-sb-user">' +
        '<div class="mock-sb-user-row">' +
          '<div class="mock-sb-avatar">' + initial + '</div>' +
          '<div><div class="mock-sb-user-name">' + state.user.name + '</div><div class="mock-sb-user-role">' + state.user.role + '</div></div>' +
        '</div>' +
        '<div class="mock-sb-logout" id="mock-logout">🚪 <span>Keluar</span></div>' +
      '</div>' +
    '</div>'
  );
  sidebar.querySelectorAll('.mock-sb-item').forEach(function (item) {
    item.onclick = function () { state.tab = item.getAttribute('data-tab'); render(); };
  });
  sidebar.querySelector('#mock-logout').onclick = function () {
    state = { loggedIn: false, loginError: null, user: null, tab: 'pos', category: 'all', cart: {}, orders: [], selectedOrderId: null, payFlow: null, history: [], settingsSection: null, edc: { step: 'select', device: null, testing: false, testOk: false } };
    render();
  };

  var content = el('<div class="mock-content"></div>');
  if (state.tab === 'pos') content.appendChild(renderPos());
  else if (state.tab === 'pembayaran') content.appendChild(renderPembayaran());
  else if (state.tab === 'riwayat') content.appendChild(renderRiwayat());
  else content.appendChild(renderSettings());

  wrap.appendChild(sidebar);
  wrap.appendChild(content);
  return wrap;
}

/* ---------------- ORDER (PosScreen) ---------------- */
function renderPos() {
  var wrap = el(
    '<div style="display:flex;flex-direction:column;height:100%;">' +
      '<div class="mock-header"><h3>Order</h3></div>' +
      '<div class="mock-body"><div class="mock-pos-layout"><div style="flex:1;display:flex;flex-direction:column;min-width:0;">' +
        '<div class="mock-cat-row" id="mock-cats"></div>' +
        '<div class="mock-product-grid" id="mock-products"></div>' +
      '</div><div class="mock-cart" id="mock-cart"></div></div></div>' +
    '</div>'
  );

  var cats = ['all'].concat(Array.from(new Set(PRODUCTS.map(function (p) { return p.category; }))));
  var catRow = wrap.querySelector('#mock-cats');
  cats.forEach(function (c) {
    var chip = el('<div class="mock-chip' + (state.category === c ? ' active' : '') + '">' + (c === 'all' ? 'Semua' : c) + '</div>');
    chip.onclick = function () { state.category = c; render(); };
    catRow.appendChild(chip);
  });

  var grid = wrap.querySelector('#mock-products');
  PRODUCTS.filter(function (p) { return state.category === 'all' || p.category === state.category; }).forEach(function (p) {
    var out = p.stock <= 0;
    var card = el(
      '<div class="mock-product-card' + (out ? ' disabled' : '') + '">' +
        '<div class="mock-product-swatch" style="background:' + (CATEGORY_COLORS[p.category] || '#F1EEE5') + '">' + p.emoji + '</div>' +
        '<div class="mock-product-cat">' + p.category + '</div>' +
        '<div class="mock-product-name">' + p.name + '</div>' +
        '<div class="mock-product-price">' + fmtRp(p.price) + '</div>' +
        '<div class="mock-product-stock">' + (out ? 'Habis' : 'Stok ' + p.stock) + '</div>' +
      '</div>'
    );
    if (!out) card.onclick = function () { state.cart[p.id] = (state.cart[p.id] || 0) + 1; render(); };
    grid.appendChild(card);
  });

  var cartEl = wrap.querySelector('#mock-cart');
  var lines = Object.keys(state.cart).map(function (id) {
    var p = PRODUCTS.find(function (x) { return x.id === id; });
    return { p: p, qty: state.cart[id] };
  });
  var total = lines.reduce(function (s, l) { return s + l.p.price * l.qty; }, 0);
  var linesHtml = lines.length
    ? lines.map(function (l) {
        return '<div class="mock-cart-line" data-id="' + l.p.id + '">' +
          '<div class="nm">' + l.p.name + '</div>' +
          '<div class="row"><span>' + fmtRp(l.p.price * l.qty) + '</span>' +
          '<div class="mock-qty"><button class="dec">-</button><span>' + l.qty + '</span><button class="inc">+</button></div></div>' +
        '</div>';
      }).join('')
    : '<div class="mock-cart-empty">Keranjang masih kosong.<br>Klik produk untuk menambahkan.</div>';
  cartEl.innerHTML =
    '<div class="mock-cart-title">Keranjang</div>' +
    '<div class="mock-cart-lines">' + linesHtml + '</div>' +
    '<div class="mock-cart-total"><span>Total</span><span>' + fmtRp(total) + '</span></div>' +
    '<button class="mock-cart-cta" id="mock-cart-cta" ' + (lines.length ? '' : 'disabled') + '>Buat Pesanan (' + lines.length + ')</button>';
  cartEl.querySelectorAll('.mock-cart-line').forEach(function (row) {
    var id = row.getAttribute('data-id');
    row.querySelector('.inc').onclick = function () { state.cart[id]++; render(); };
    row.querySelector('.dec').onclick = function () {
      state.cart[id]--;
      if (state.cart[id] <= 0) delete state.cart[id];
      render();
    };
  });
  var cta = cartEl.querySelector('#mock-cart-cta');
  if (lines.length) {
    cta.onclick = function () {
      var order = {
        id: 'INV-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(_orderSeq++).padStart(3, '0'),
        items: lines.map(function (l) { return { productId: l.p.id, name: l.p.name, price: l.p.price, qty: l.qty }; }),
        total: total,
        createdAt: new Date(),
        status: 'unpaid',
      };
      state.orders.push(order);
      state.cart = {};
      state.selectedOrderId = order.id;
      state.tab = 'pembayaran';
      state.payFlow = null;
      render();
    };
  }
  return wrap;
}

/* ---------------- PEMBAYARAN ---------------- */
function renderPembayaran() {
  var wrap = el(
    '<div style="display:flex;flex-direction:column;height:100%;">' +
      '<div class="mock-header"><h3>Pembayaran</h3><p>Pesanan yang menunggu dibayar</p></div>' +
      '<div class="mock-body"><div class="mock-pay-layout"><div class="mock-order-list" id="mock-order-list"></div><div class="mock-pay-detail" id="mock-pay-detail"></div></div></div>' +
    '</div>'
  );
  var unpaid = state.orders.filter(function (o) { return o.status === 'unpaid'; });
  var listEl = wrap.querySelector('#mock-order-list');
  if (!unpaid.length) {
    listEl.innerHTML = '<div class="mock-pay-empty" style="padding:16px 4px;">Tidak ada pesanan menunggu.</div>';
  }
  unpaid.forEach(function (o) {
    var row = el(
      '<div class="mock-order-item' + (state.selectedOrderId === o.id ? ' active' : '') + '">' +
        '<div class="id">' + o.id + '</div>' +
        '<div class="meta">' + o.items.length + ' item</div>' +
        '<div class="amt">' + fmtRp(o.total) + '</div>' +
      '</div>'
    );
    row.onclick = function () { state.selectedOrderId = o.id; state.payFlow = null; render(); };
    listEl.appendChild(row);
  });

  var detail = wrap.querySelector('#mock-pay-detail');
  var order = state.orders.find(function (o) { return o.id === state.selectedOrderId && o.status === 'unpaid'; });
  if (!order) {
    detail.innerHTML = '<div class="mock-pay-empty">Pilih pesanan di sebelah kiri untuk memproses pembayaran.</div>';
    return wrap;
  }
  detail.appendChild(renderPayDetail(order));
  return wrap;
}

function renderPayDetail(order) {
  var itemsHtml = order.items.map(function (it) {
    return '<div style="display:flex;justify-content:space-between;font-size:12.5px;padding:5px 0;color:var(--ink);">' +
      '<span>' + it.qty + '× ' + it.name + '</span><span>' + fmtRp(it.price * it.qty) + '</span></div>';
  }).join('');

  if (!state.payFlow) {
    var box = el(
      '<div>' +
        '<div style="font-size:11px;font-weight:800;color:var(--inkSoft);text-transform:uppercase;margin-bottom:6px;">' + order.id + '</div>' +
        itemsHtml +
        '<div class="mock-pay-total-row"><span>Total</span><span>' + fmtRp(order.total) + '</span></div>' +
        '<div style="font-size:11px;font-weight:800;color:var(--inkSoft);text-transform:uppercase;margin:14px 0 4px;">Pilih Metode Pembayaran</div>' +
        '<div class="mock-method-row">' +
          '<button class="mock-method-btn" data-m="cash">Cash</button>' +
          '<button class="mock-method-btn" data-m="qris">QRIS</button>' +
          '<button class="mock-method-btn" data-m="edc">EDC</button>' +
        '</div>' +
      '</div>'
    );
    box.querySelectorAll('.mock-method-btn').forEach(function (btn) {
      btn.onclick = function () {
        var method = btn.getAttribute('data-m');
        if (method === 'cash') {
          state.payFlow = { method: 'cash', step: 'input' };
        } else {
          state.payFlow = { method: method, step: 'processing' };
          var oid = order.id;
          setTimeout(function () {
            if (state.payFlow && state.selectedOrderId === oid) { state.payFlow.step = 'success'; render(); }
          }, method === 'qris' ? 2200 : 1800);
        }
        render();
      };
    });
    return box;
  }

  if (state.payFlow.step === 'input') {
    var cashBox = el(
      '<div>' +
        '<div style="font-size:11px;font-weight:800;color:var(--inkSoft);text-transform:uppercase;margin-bottom:6px;">' + order.id + '</div>' +
        '<div class="mock-pay-total-row" style="border-top:none;"><span>Total</span><span>' + fmtRp(order.total) + '</span></div>' +
        '<div class="mock-flow">' +
          '<div class="mock-input-row">' +
            '<label style="font-size:11px;font-weight:700;color:var(--inkSoft);">Uang Diterima</label>' +
            '<input id="mock-cash-amount" type="number" placeholder="0">' +
            '<div class="mock-kembalian" id="mock-kembalian">Kembalian: Rp 0</div>' +
            '<button class="mock-confirm-btn" id="mock-cash-confirm" disabled>Konfirmasi</button>' +
          '</div>' +
          '<button class="mock-link-btn" id="mock-cash-back">← Pilih metode lain</button>' +
        '</div>' +
      '</div>'
    );
    var input = cashBox.querySelector('#mock-cash-amount');
    var kembalianEl = cashBox.querySelector('#mock-kembalian');
    var confirmBtn = cashBox.querySelector('#mock-cash-confirm');
    input.oninput = function () {
      var amt = Number(input.value) || 0;
      var change = amt - order.total;
      kembalianEl.textContent = 'Kembalian: ' + fmtRp(Math.max(change, 0));
      confirmBtn.disabled = amt < order.total;
    };
    confirmBtn.onclick = function () { completeOrder(order, 'cash'); };
    cashBox.querySelector('#mock-cash-back').onclick = function () { state.payFlow = null; render(); };
    return cashBox;
  }

  if (state.payFlow.step === 'processing') {
    var label = state.payFlow.method === 'qris' ? 'Menunggu pembayaran QRIS...' : 'Tempelkan / gesek / masukkan kartu ke mesin EDC...';
    var qr = state.payFlow.method === 'qris' ? '<div class="mock-qr-box"></div>' : '<div class="mock-spinner"></div>';
    return el(
      '<div class="mock-flow">' + qr + '<div style="font-size:13px;font-weight:700;color:var(--ink);">' + label + '</div>' +
      '<div style="font-size:12px;color:var(--inkSoft);margin-top:4px;">' + fmtRp(order.total) + '</div></div>'
    );
  }

  if (state.payFlow.step === 'success') {
    var box2 = el(
      '<div class="mock-flow">' +
        '<div class="mock-success-badge">✓</div>' +
        '<div style="font-size:14px;font-weight:800;color:var(--ink);">Pembayaran Berhasil</div>' +
        '<div style="font-size:12px;color:var(--inkSoft);margin-top:4px;">' + order.id + ' · ' + fmtRp(order.total) + ' · ' + state.payFlow.method.toUpperCase() + '</div>' +
        '<button class="mock-confirm-btn" style="margin-top:16px;" id="mock-pay-done">Selesai</button>' +
      '</div>'
    );
    box2.querySelector('#mock-pay-done').onclick = function () { completeOrder(order, state.payFlow.method); };
    return box2;
  }
  return el('<div></div>');
}

function completeOrder(order, method) {
  order.status = 'paid';
  state.history.unshift({
    id: order.id, items: order.items, total: order.total, method: method,
    cashierName: state.user.name, paidAt: new Date(),
  });
  state.payFlow = null;
  state.selectedOrderId = null;
  render();
}

/* ---------------- RIWAYAT ---------------- */
function renderRiwayat() {
  var wrap = el(
    '<div style="display:flex;flex-direction:column;height:100%;">' +
      '<div class="mock-header"><h3>Riwayat Transaksi</h3><p>30 hari terakhir</p></div>' +
      '<div class="mock-body" id="mock-hist-body"></div>' +
    '</div>'
  );
  var body = wrap.querySelector('#mock-hist-body');
  if (!state.history.length) {
    body.innerHTML = '<div class="mock-pay-empty">Belum ada transaksi yang selesai di sesi demo ini.<br>Buat &amp; bayar pesanan di menu Order terlebih dahulu.</div>';
    return wrap;
  }
  state.history.forEach(function (h) {
    var row = el(
      '<div class="mock-history-row">' +
        '<div><div class="inv">' + h.id + '</div><div class="meta">' + h.items.length + ' item · ' + h.cashierName + '</div>' +
        '<span class="mock-badge-method">' + h.method + '</span></div>' +
        '<div class="amt">' + fmtRp(h.total) + '</div>' +
      '</div>'
    );
    body.appendChild(row);
  });
  return wrap;
}

/* ---------------- PENGATURAN (SettingsScreen + EdcSetupScreen) ---------------- */
function renderSettings() {
  if (state.settingsSection === 'edc') {
    var wrap = el(
      '<div style="display:flex;flex-direction:column;height:100%;">' +
        '<div class="mock-header"><h3>Pengaturan EDC</h3><p>Atur koneksi mesin EDC di perangkat ini</p></div>' +
        '<div class="mock-body">' +
          '<span class="mock-back-link" id="mock-edc-back">← Kembali ke Pengaturan</span>' +
          '<div id="mock-edc-body"></div>' +
        '</div>' +
      '</div>'
    );
    wrap.querySelector('#mock-edc-back').onclick = function () { state.settingsSection = null; render(); };
    wrap.querySelector('#mock-edc-body').appendChild(renderEdcBody());
    return wrap;
  }
  var wrap2 = el(
    '<div style="display:flex;flex-direction:column;height:100%;">' +
      '<div class="mock-header"><h3>Pengaturan</h3><p>Pengaturan aplikasi dan perangkat</p></div>' +
      '<div class="mock-body">' +
        '<div class="mock-settings-item" id="mock-open-edc">' +
          '<span class="ic">💳</span>' +
          '<div><div class="ttl">Pengaturan EDC</div><div class="sub">Atur koneksi mesin EDC di perangkat ini</div></div>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
  wrap2.querySelector('#mock-open-edc').onclick = function () {
    state.settingsSection = 'edc';
    state.edc = { step: 'select', device: null, testing: false, testOk: false };
    render();
  };
  return wrap2;
}

function renderEdcBody() {
  var e = state.edc;
  if (e.step === 'select' || e.step === 'searching') {
    var box = el('<div></div>');
    DEVICES.forEach(function (d) {
      var searching = e.step === 'searching' && e.device && e.device.id === d.id;
      var card = el(
        '<div class="mock-device-card">' +
          '<div class="mock-swatch" style="background:' + d.swatchColor + '"></div>' +
          '<div style="flex:1;"><div class="mock-device-name">' + d.name + '</div><div class="mock-device-model">' + d.model + '</div></div>' +
          (searching ? '<div class="mock-spinner" style="margin:0;width:18px;height:18px;"></div>' : '') +
        '</div>'
      );
      if (e.step === 'select') {
        card.onclick = function () {
          state.edc.device = d;
          state.edc.step = 'searching';
          render();
          setTimeout(function () {
            state.edc.step = Math.random() < 0.75 ? 'found' : 'notfound';
            render();
          }, 1400);
        };
      }
      box.appendChild(card);
    });
    return box;
  }
  if (e.step === 'notfound') {
    var nf = el(
      '<div class="mock-status-card">' +
        '<div style="font-size:28px;margin-bottom:8px;">⚠️</div>' +
        '<div style="font-weight:800;font-size:13.5px;">Perangkat tidak ditemukan</div>' +
        '<div style="font-size:12px;color:var(--inkSoft);margin-top:4px;">Pastikan ' + e.device.name + ' menyala dan berada dalam jangkauan.</div>' +
        '<div class="mock-status-actions"><button class="mock-btn-outline" id="mock-edc-retry">Coba Lagi</button></div>' +
      '</div>'
    );
    nf.querySelector('#mock-edc-retry').onclick = function () { state.edc = { step: 'select', device: null, testing: false, testOk: false }; render(); };
    return nf;
  }
  if (e.step === 'found') {
    var f = el(
      '<div class="mock-status-card">' +
        '<div class="mock-swatch" style="background:' + e.device.swatchColor + ';margin:0 auto 10px;"></div>' +
        '<div style="font-weight:800;font-size:13.5px;">' + e.device.name + ' ditemukan</div>' +
        '<div style="font-size:12px;color:var(--inkSoft);margin-top:4px;">' + e.device.model + '</div>' +
        '<div class="mock-status-actions">' +
          '<button class="mock-btn-outline" id="mock-edc-cancel">Batal</button>' +
          '<button class="mock-confirm-btn" id="mock-edc-connect">Hubungkan</button>' +
        '</div>' +
      '</div>'
    );
    f.querySelector('#mock-edc-cancel').onclick = function () { state.edc = { step: 'select', device: null, testing: false, testOk: false }; render(); };
    f.querySelector('#mock-edc-connect').onclick = function () {
      state.edc.step = 'connecting'; render();
      setTimeout(function () { state.edc.step = 'connected'; render(); }, 900);
    };
    return f;
  }
  if (e.step === 'connecting') {
    return el('<div class="mock-status-card"><div class="mock-spinner"></div><div style="font-weight:700;font-size:13px;">Menghubungkan ke ' + e.device.name + '...</div></div>');
  }
  if (e.step === 'connected') {
    var c = el(
      '<div class="mock-status-card">' +
        '<div class="mock-swatch" style="background:' + e.device.swatchColor + ';margin:0 auto 10px;"></div>' +
        '<div style="font-weight:800;font-size:13.5px;"><span class="mock-status-dot"></span>Terhubung — ' + e.device.name + '</div>' +
        '<div style="font-size:12px;color:var(--inkSoft);margin-top:4px;">' + e.device.model + '</div>' +
        (e.testing ? '<div class="mock-spinner" style="margin-top:14px;"></div>' : '') +
        (e.testOk ? '<div style="font-size:12px;color:var(--leaf);font-weight:700;margin-top:10px;">✓ Tes koneksi berhasil</div>' : '') +
        '<div class="mock-status-actions">' +
          '<button class="mock-btn-outline" id="mock-edc-test">Tes Koneksi</button>' +
          '<button class="mock-btn-outline" id="mock-edc-disconnect" style="color:var(--alert);">Putuskan</button>' +
        '</div>' +
      '</div>'
    );
    c.querySelector('#mock-edc-test').onclick = function () {
      state.edc.testing = true; state.edc.testOk = false; render();
      setTimeout(function () { state.edc.testing = false; state.edc.testOk = true; render(); }, 700);
    };
    c.querySelector('#mock-edc-disconnect').onclick = function () { state.edc = { step: 'select', device: null, testing: false, testOk: false }; render(); };
    return c;
  }
  return el('<div></div>');
}

window.MockGreenPos = {
  mount: function (rootEl) { _root = rootEl; render(); },
};
