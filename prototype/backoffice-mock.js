/**
 * Interactive mock of GreenPos Backoffice, built from the real app's source
 * (backoffice/src/components/layout/Sidebar.tsx, lib/constants.ts,
 * app/dashboard|produk|stores|users|promo|riwayat|reporting|pengaturan/*)
 * and backend seed data — standalone dummy data, no server required.
 */

var BO_MERCHANT = { name: 'Kopi & Roti Nusantara Group', address: 'Jl. Sudirman No. 88, Jakarta Selatan', logoUrl: '' };

var BO_STORES = [
  { id: 'store-1', name: 'Toko Pusat - Sudirman', address: 'Jl. Sudirman No. 88, Jakarta Selatan', active: true },
  { id: 'store-2', name: 'Cabang Bandung', address: 'Jl. Braga No. 21, Bandung', active: true },
];

var BO_USERS = [
  { id: 'u1', name: 'Rangga Saputra', username: 'admin01', storeName: 'Semua Store', active: true },
  { id: 'u2', name: 'Sari Wulandari', username: 'manager01', storeName: 'Toko Pusat - Sudirman', active: true },
  { id: 'u3', name: 'Dewi Anjani', username: 'kasir01', storeName: 'Toko Pusat - Sudirman', active: true },
  { id: 'u4', name: 'Fajar Nugroho', username: 'ppic01', storeName: 'Semua Store', active: true },
  { id: 'u5', name: 'Melati Putri', username: 'finance01', storeName: 'Semua Store', active: true },
];

var BO_CATEGORY_COLORS = { Minuman: '#DBEAFE', Roti: '#FDE9C7', Snack: '#FFE0C2', Makanan: '#D6F2E3' };
var BO_PRODUCTS = [
  { id: 'p1', sku: 'KOP-001', name: 'Kopi Susu Gula Aren', category: 'Minuman', price: 22000, stock: 48, minStock: 10, emoji: '☕' },
  { id: 'p2', sku: 'KOP-002', name: 'Americano', category: 'Minuman', price: 18000, stock: 30, minStock: 10, emoji: '☕' },
  { id: 'p3', sku: 'KOP-003', name: 'Matcha Latte', category: 'Minuman', price: 25000, stock: 0, minStock: 10, emoji: '🍵' },
  { id: 'p4', sku: 'ROT-001', name: 'Croissant Butter', category: 'Roti', price: 19000, stock: 21, minStock: 8, emoji: '🥐' },
  { id: 'p5', sku: 'ROT-002', name: 'Roti Sourdough', category: 'Roti', price: 32000, stock: 14, minStock: 5, emoji: '🍞' },
  { id: 'p6', sku: 'ROT-003', name: 'Donat Cokelat', category: 'Roti', price: 12000, stock: 40, minStock: 10, emoji: '🍩' },
  { id: 'p7', sku: 'SNK-001', name: 'Kentang Goreng', category: 'Snack', price: 21000, stock: 0, minStock: 10, emoji: '🍟' },
  { id: 'p8', sku: 'SNK-002', name: 'Nugget Ayam', category: 'Snack', price: 24000, stock: 18, minStock: 8, emoji: '🍗' },
  { id: 'p9', sku: 'MKN-001', name: 'Nasi Goreng Spesial', category: 'Makanan', price: 35000, stock: 25, minStock: 8, emoji: '🍛' },
  { id: 'p10', sku: 'MKN-002', name: 'Mie Ayam Bakso', category: 'Makanan', price: 28000, stock: 0, minStock: 8, emoji: '🍜' },
  { id: 'p11', sku: 'KOP-004', name: 'Es Teh Manis', category: 'Minuman', price: 10000, stock: 60, minStock: 15, emoji: '🧋' },
  { id: 'p12', sku: 'ROT-004', name: 'Cheese Cake Slice', category: 'Roti', price: 27000, stock: 0, minStock: 5, emoji: '🍰' },
  { id: 'p13', sku: 'MIN-099', name: 'Teh Tarik', category: 'Minuman', price: 15000, stock: 20, minStock: 5, emoji: '🥤' },
];

var BO_PROMOS = [
  { id: 'promo1', name: 'Diskon Akhir Pekan 15%', description: 'Ditampilkan ke kasir', type: 'percentage', value: 15, minPurchase: 30000, active: true },
  { id: 'promo2', name: 'Hemat Rp 5.000', description: 'Min. belanja Rp 50.000', type: 'nominal', value: 5000, minPurchase: 50000, active: false },
];

var BO_TRANSACTIONS = [
  { invoice: 'INV-20260816-004', time: '16 Agu 2026, 16:42', kasir: 'Dewi Anjani', method: 'QRIS', status: 'Lunas', total: 46750 },
  { invoice: 'INV-20260816-003', time: '16 Agu 2026, 14:10', kasir: 'Dewi Anjani', method: 'Cash', status: 'Lunas', total: 32000 },
  { invoice: 'INV-20260816-002', time: '16 Agu 2026, 11:05', kasir: 'Dewi Anjani', method: 'EDC', status: 'Lunas', total: 95350 },
  { invoice: 'INV-20260815-006', time: '15 Agu 2026, 19:22', kasir: 'Dewi Anjani', method: 'QRIS', status: 'Lunas', total: 27000 },
  { invoice: 'INV-20260815-005', time: '15 Agu 2026, 17:48', kasir: 'Dewi Anjani', method: 'Cash', status: 'Lunas', total: 64000 },
];

var BO_REPORTING = [
  { date: '2026-08-16', method: 'Cash', count: 5, total: 210000 },
  { date: '2026-08-16', method: 'QRIS', count: 3, total: 135000 },
  { date: '2026-08-16', method: 'EDC', count: 2, total: 190700 },
  { date: '2026-08-15', method: 'Cash', count: 6, total: 245000 },
  { date: '2026-08-15', method: 'QRIS', count: 4, total: 178000 },
  { date: '2026-08-15', method: 'EDC', count: 1, total: 95350 },
];

var BO_EDC_TERMINALS = {
  'store-1': [
    { id: 't1', label: 'Kasir 1', mode: 'simulator', mid: '', stationCode: '' },
    { id: 't2', label: 'Kasir 2 (BCA)', mode: 'live', mid: '000000000012345', stationCode: '01' },
  ],
  'store-2': [],
};

var BO_QRIS_CONFIG = {
  'store-1': { enabled: true, env: 'sandbox', serverKey: 'SB-Mid-server-xxxxxxxxxxxxxxxxxxxx', clientKey: 'SB-Mid-client-xxxxxxxxxxxxxxxxxxxx' },
  'store-2': { enabled: false, env: 'sandbox', serverKey: '', clientKey: '' },
};

var BO_DASHBOARD = {
  todayTransactionCount: 4,
  todayRevenue: 218000,
  salesTrend: [
    { date: '10 Agu', revenue: 120000 }, { date: '11 Agu', revenue: 95000 }, { date: '12 Agu', revenue: 180000 },
    { date: '13 Agu', revenue: 150000 }, { date: '14 Agu', revenue: 210000 }, { date: '15 Agu', revenue: 175000 },
    { date: '16 Agu', revenue: 218000 },
  ],
  paymentBreakdown: [
    { method: 'cash', count: 2, total: 96000 },
    { method: 'qris', count: 1, total: 46750 },
    { method: 'edc', count: 1, total: 75250 },
  ],
  topProducts: [
    { name: 'Americano', qtySold: 12, revenue: 216000 },
    { name: 'Kopi Susu Gula Aren', qtySold: 9, revenue: 198000 },
    { name: 'Croissant Butter', qtySold: 7, revenue: 133000 },
  ],
};

var NAV_ITEMS = [
  { id: 'dashboard', icon: '📊', title: 'Dashboard', subtitle: 'Ringkasan performa toko 7 hari terakhir' },
  { id: 'merchant', icon: '🏢', title: 'Profil Merchant', subtitle: 'Nama dan alamat bisnis Anda' },
  { id: 'stores', icon: '🏬', title: 'Stores', subtitle: 'Kelola cabang/outlet merchant Anda' },
  { id: 'users', icon: '👥', title: 'Pengguna', subtitle: 'Kelola akun staff, akses menu, dan cakupan store' },
  { id: 'produk', icon: '📦', title: 'Produk & Stok', subtitle: 'Kelola katalog produk dan stok' },
  { id: 'promo', icon: '🏷️', title: 'Promo', subtitle: 'Diskon otomatis diterapkan ke keranjang' },
  { id: 'riwayat', icon: '🧾', title: 'Riwayat Transaksi', subtitle: 'Cari transaksi yang sudah selesai' },
  { id: 'reporting', icon: '📈', title: 'Reporting', subtitle: 'Rekonsiliasi pembayaran per metode' },
  { id: 'edc', icon: '💳', title: 'Pengaturan EDC', subtitle: 'Integrasi mesin EDC per store' },
  { id: 'qris', icon: '🔳', title: 'Pengaturan QRIS', subtitle: 'Akun Midtrans per store' },
];

var BO_DEMO_USER = { username: 'admin01', password: 'demo123', name: 'Rangga Saputra' };

var _boRoot = null;
var boState = {
  loggedIn: false,
  loginError: null,
  page: 'dashboard',
  storeFilter: BO_STORES[0].id,
  userSearch: '',
  showForm: null, // which inline "tambah" form is open, per page
};

function boFmtRp(n) { return 'Rp ' + n.toLocaleString('id-ID'); }
function boEl(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }

function boRender() {
  if (!_boRoot) return;
  _boRoot.innerHTML = '';
  _boRoot.appendChild(boState.loggedIn ? boRenderShell() : boRenderLogin());
}

/* ---------------- LOGIN ---------------- */
function boRenderLogin() {
  var wrap = boEl(
    '<div class="mock-login" style="width:100%;">' +
      '<div class="mock-login-card">' +
        '<div class="mock-login-brand"><img src="assets/logo-mark.png" alt="GreenPos"><span class="w1">green</span> <span class="w2">pos</span></div>' +
        '<h2>Masuk</h2>' +
        '<p class="hint">Kelola merchant, store, dan pengaturan pembayaran Anda.</p>' +
        (boState.loginError ? '<div class="mock-err">' + boState.loginError + '</div>' : '') +
        '<div class="mock-field"><label>Username</label><input id="bo-username" placeholder="admin01"></div>' +
        '<div class="mock-field"><label>Password</label><input id="bo-password" type="password" placeholder="********"></div>' +
        '<button class="mock-submit" id="bo-submit-btn">Masuk</button>' +
        '<div class="mock-demo-box">' +
          '<div class="lbl">Mode Demo — klik untuk isi otomatis:</div>' +
          '<div class="mock-demo-acct" id="bo-quickfill"><b>Administrator</b><span>admin01</span></div>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
  wrap.querySelector('#bo-quickfill').onclick = function () {
    wrap.querySelector('#bo-username').value = BO_DEMO_USER.username;
    wrap.querySelector('#bo-password').value = BO_DEMO_USER.password;
  };
  wrap.querySelector('#bo-submit-btn').onclick = function () {
    var u = wrap.querySelector('#bo-username').value.trim();
    var p = wrap.querySelector('#bo-password').value;
    if (u === BO_DEMO_USER.username && p === BO_DEMO_USER.password) {
      boState.loggedIn = true; boState.loginError = null;
      boRender();
    } else {
      boState.loginError = 'Username atau password salah.';
      boRender();
    }
  };
  return wrap;
}

/* ---------------- SHELL (sidebar + topbar + page content) ---------------- */
function boRenderShell() {
  var wrap = boEl('<div class="bo-mock-shell"></div>');
  var initial = BO_DEMO_USER.name.trim().charAt(0).toUpperCase();

  var sidebar = boEl(
    '<div class="bo-mock-sidebar">' +
      '<div class="bo-mock-brand"><img src="assets/logo-mark.png" alt="GreenPos"><span class="w1">green</span> <span class="w2">pos</span></div>' +
      NAV_ITEMS.map(function (n) {
        return '<div class="bo-mock-nav-item' + (boState.page === n.id ? ' active' : '') + '" data-page="' + n.id + '">' +
          '<span class="ic">' + n.icon + '</span><span>' + n.title + '</span></div>';
      }).join('') +
      '<div class="bo-mock-nav-spacer"></div>' +
      '<div class="bo-mock-user">' +
        '<div class="bo-mock-user-row">' +
          '<div class="bo-mock-avatar">' + initial + '</div>' +
          '<div><div class="bo-mock-user-name">' + BO_DEMO_USER.name + '</div><div class="bo-mock-user-role">Staff</div></div>' +
        '</div>' +
        '<div class="bo-mock-logout" id="bo-logout">🚪 <span>Keluar</span></div>' +
      '</div>' +
    '</div>'
  );
  sidebar.querySelectorAll('.bo-mock-nav-item').forEach(function (item) {
    item.onclick = function () { boState.page = item.getAttribute('data-page'); boState.showForm = null; boRender(); };
  });
  sidebar.querySelector('#bo-logout').onclick = function () {
    boState = { loggedIn: false, loginError: null, page: 'dashboard', storeFilter: BO_STORES[0].id, userSearch: '', showForm: null };
    boRender();
  };

  var meta = NAV_ITEMS.find(function (n) { return n.id === boState.page; });
  var content = boEl(
    '<div class="bo-mock-content">' +
      '<div class="bo-mock-topbar">' +
        '<div><h3>' + meta.title + '</h3><p>' + meta.subtitle + '</p></div>' +
        '<div class="merchant"><div class="mname">' + BO_MERCHANT.name + '</div><div class="sname">Semua Store</div></div>' +
      '</div>' +
      '<div class="bo-mock-body" id="bo-body"></div>' +
    '</div>'
  );
  var body = content.querySelector('#bo-body');
  var renderers = {
    dashboard: boRenderDashboard, merchant: boRenderMerchant, stores: boRenderStores, users: boRenderUsers,
    produk: boRenderProduk, promo: boRenderPromo, riwayat: boRenderRiwayat, reporting: boRenderReporting,
    edc: boRenderEdc, qris: boRenderQris,
  };
  body.appendChild(renderers[boState.page]());

  wrap.appendChild(sidebar);
  wrap.appendChild(content);
  return wrap;
}

/* ---------------- DASHBOARD ---------------- */
function boAreaChart(values) {
  var w = 600, h = 140, pad = 6;
  var max = Math.max.apply(null, values.map(function (v) { return v.revenue; })) * 1.15;
  var stepX = (w - pad * 2) / (values.length - 1);
  var pts = values.map(function (v, i) {
    var x = pad + i * stepX;
    var y = h - pad - (v.revenue / max) * (h - pad * 2);
    return [x, y];
  });
  var linePath = 'M' + pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' L');
  var areaPath = linePath + ' L' + pts[pts.length - 1][0] + ',' + (h - pad) + ' L' + pts[0][0] + ',' + (h - pad) + ' Z';
  var svg =
    '<svg viewBox="0 0 ' + w + ' ' + h + '" class="bo-chart-wrap" preserveAspectRatio="none">' +
      '<defs><linearGradient id="boFill" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="5%" stop-color="#2E9E4C" stop-opacity="0.35"/><stop offset="95%" stop-color="#2E9E4C" stop-opacity="0"/>' +
      '</linearGradient></defs>' +
      '<path d="' + areaPath + '" fill="url(#boFill)" stroke="none"/>' +
      '<path d="' + linePath + '" fill="none" stroke="#2E9E4C" stroke-width="2.5"/>' +
    '</svg>';
  return boEl('<div>' + svg + '<div style="display:flex;justify-content:space-between;font-size:9.5px;color:var(--inkSoft);margin-top:4px;">' +
    values.map(function (v) { return '<span>' + v.date + '</span>'; }).join('') + '</div></div>');
}

function boRenderDashboard() {
  var d = BO_DASHBOARD;
  var lowStock = BO_PRODUCTS.filter(function (p) { return p.stock <= p.minStock; }).length;
  var wrap = boEl('<div></div>');
  wrap.appendChild(boEl(
    '<div class="bo-stat-grid">' +
      '<div class="bo-stat-card"><div class="bo-stat-icon">🧾</div><div><div class="bo-stat-label">Transaksi Hari Ini</div><div class="bo-stat-value">' + d.todayTransactionCount + '</div></div></div>' +
      '<div class="bo-stat-card"><div class="bo-stat-icon">💰</div><div><div class="bo-stat-label">Omzet Hari Ini</div><div class="bo-stat-value">' + boFmtRp(d.todayRevenue) + '</div></div></div>' +
      '<div class="bo-stat-card"><div class="bo-stat-icon">📦</div><div><div class="bo-stat-label">Produk Terjual (7 hari)</div><div class="bo-stat-value">' + d.topProducts.reduce(function (s, p) { return s + p.qtySold; }, 0) + '</div></div></div>' +
      '<div class="bo-stat-card"><div class="bo-stat-icon alert">⚠️</div><div><div class="bo-stat-label">Stok Menipis</div><div class="bo-stat-value">' + lowStock + '</div></div></div>' +
    '</div>'
  ));
  var chartCard = boEl('<div class="bo-card"><h4>Tren Penjualan (7 hari)</h4></div>');
  chartCard.appendChild(boAreaChart(d.salesTrend));
  wrap.appendChild(chartCard);

  var methodLabel = { cash: 'Cash', qris: 'QRIS', edc: 'EDC' };
  var grid = boEl('<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;"></div>');
  var payCard = boEl('<div class="bo-card"><h4>Metode Pembayaran</h4></div>');
  d.paymentBreakdown.forEach(function (p) {
    payCard.appendChild(boEl('<div class="bo-row-between"><span class="l">' + methodLabel[p.method] + '</span><span class="r">' + p.count + 'x · ' + boFmtRp(p.total) + '</span></div>'));
  });
  var topCard = boEl('<div class="bo-card"><h4>Produk Terlaris</h4></div>');
  d.topProducts.forEach(function (p) {
    topCard.appendChild(boEl('<div class="bo-row-between"><span class="l">' + p.name + '</span><span class="r">' + p.qtySold + ' terjual · ' + boFmtRp(p.revenue) + '</span></div>'));
  });
  grid.appendChild(payCard); grid.appendChild(topCard);
  wrap.appendChild(grid);
  return wrap;
}

/* ---------------- PROFIL MERCHANT ---------------- */
function boRenderMerchant() {
  var wrap = boEl(
    '<div class="bo-card" style="max-width:420px;">' +
      '<div class="bo-form-field"><label>Nama Merchant</label><input id="bo-m-name" value="' + BO_MERCHANT.name + '"></div>' +
      '<div class="bo-form-field"><label>Alamat</label><input id="bo-m-address" value="' + BO_MERCHANT.address + '"></div>' +
      '<div class="bo-form-field"><label>Logo (opsional)</label><input id="bo-m-logo" placeholder="https://..." value="' + BO_MERCHANT.logoUrl + '"></div>' +
      '<button class="bo-btn" id="bo-m-save">Simpan Perubahan</button>' +
      '<span id="bo-m-saved" style="margin-left:10px;font-size:11.5px;color:var(--leaf);font-weight:700;display:none;">✓ Tersimpan</span>' +
    '</div>'
  );
  wrap.querySelector('#bo-m-save').onclick = function () {
    BO_MERCHANT.name = wrap.querySelector('#bo-m-name').value;
    BO_MERCHANT.address = wrap.querySelector('#bo-m-address').value;
    BO_MERCHANT.logoUrl = wrap.querySelector('#bo-m-logo').value;
    var badge = wrap.querySelector('#bo-m-saved');
    badge.style.display = 'inline';
    setTimeout(function () { badge.style.display = 'none'; }, 1800);
  };
  return wrap;
}

/* ---------------- STORES ---------------- */
function boRenderStores() {
  var wrap = boEl('<div></div>');
  var toolbar = boEl('<div class="bo-toolbar"><div></div><button class="bo-btn" id="bo-add-store">+ Tambah Store</button></div>');
  toolbar.querySelector('#bo-add-store').onclick = function () { boState.showForm = boState.showForm === 'store' ? null : 'store'; boRender(); };
  wrap.appendChild(toolbar);

  if (boState.showForm === 'store') {
    var form = boEl(
      '<div class="bo-inline-form">' +
        '<div class="bo-form-field"><label>Nama Store</label><input id="bo-s-name" placeholder="Cabang Bandung"></div>' +
        '<div class="bo-form-field"><label>Alamat</label><input id="bo-s-address" placeholder="Jl. ..."></div>' +
        '<button class="bo-btn" id="bo-s-submit">Tambah Store</button>' +
      '</div>'
    );
    form.querySelector('#bo-s-submit').onclick = function () {
      var name = form.querySelector('#bo-s-name').value.trim();
      if (!name) return;
      BO_STORES.push({ id: 'store-' + (BO_STORES.length + 1), name: name, address: form.querySelector('#bo-s-address').value, active: true });
      boState.showForm = null; boRender();
    };
    wrap.appendChild(form);
  }

  var card = boEl('<div class="bo-card"></div>');
  var table = boEl('<table class="bo-table"><thead><tr><th>Store</th><th>Alamat</th><th>Status</th><th style="text-align:right;">Aksi</th></tr></thead><tbody></tbody></table>');
  var tbody = table.querySelector('tbody');
  BO_STORES.forEach(function (s) {
    var tr = boEl(
      '<tr><td style="font-weight:700;">' + s.name + '</td><td class="bo-row-between-r" style="color:var(--inkSoft);">' + s.address + '</td>' +
      '<td><span class="bo-badge ' + (s.active ? 'active">Aktif' : 'inactive">Nonaktif') + '</span></td>' +
      '<td style="text-align:right;"><button class="bo-btn-outline" data-id="' + s.id + '">' + (s.active ? 'Nonaktifkan' : 'Aktifkan') + '</button></td></tr>'
    );
    tr.querySelector('button').onclick = function () { s.active = !s.active; boRender(); };
    tbody.appendChild(tr);
  });
  card.appendChild(table);
  wrap.appendChild(card);
  return wrap;
}

/* ---------------- USERS ---------------- */
function boRenderUsers() {
  var wrap = boEl('<div></div>');
  var toolbar = boEl(
    '<div class="bo-toolbar">' +
      '<input class="bo-search" id="bo-u-search" placeholder="Cari nama/username..." value="' + boState.userSearch + '">' +
      '<button class="bo-btn" id="bo-add-user">+ Tambah Pengguna</button>' +
    '</div>'
  );
  toolbar.querySelector('#bo-u-search').oninput = function (e) { boState.userSearch = e.target.value; boRender(); };
  toolbar.querySelector('#bo-add-user').onclick = function () { boState.showForm = boState.showForm === 'user' ? null : 'user'; boRender(); };
  wrap.appendChild(toolbar);

  if (boState.showForm === 'user') {
    var form = boEl(
      '<div class="bo-inline-form">' +
        '<div class="bo-form-grid"><div class="bo-form-field"><label>Username</label><input id="bo-u-username" placeholder="kasir02"></div>' +
        '<div class="bo-form-field"><label>Nama Lengkap</label><input id="bo-u-name" placeholder="Nama staff"></div></div>' +
        '<button class="bo-btn" id="bo-u-submit">Tambah Pengguna</button>' +
      '</div>'
    );
    form.querySelector('#bo-u-submit').onclick = function () {
      var name = form.querySelector('#bo-u-name').value.trim();
      var username = form.querySelector('#bo-u-username').value.trim();
      if (!name || !username) return;
      BO_USERS.push({ id: 'u' + (BO_USERS.length + 1), name: name, username: username, storeName: BO_STORES[0].name, active: true });
      boState.showForm = null; boRender();
    };
    wrap.appendChild(form);
  }

  var q = boState.userSearch.toLowerCase();
  var list = BO_USERS.filter(function (u) { return !q || u.name.toLowerCase().indexOf(q) >= 0 || u.username.toLowerCase().indexOf(q) >= 0; });
  var card = boEl('<div class="bo-card"></div>');
  var table = boEl('<table class="bo-table"><thead><tr><th>Nama</th><th>Store</th><th>Status</th><th style="text-align:right;">Aksi</th></tr></thead><tbody></tbody></table>');
  var tbody = table.querySelector('tbody');
  if (!list.length) tbody.appendChild(boEl('<tr><td colspan="4"><div class="bo-empty">Tidak ada pengguna ditemukan.</div></td></tr>'));
  list.forEach(function (u) {
    var tr = boEl(
      '<tr><td><div style="font-weight:700;">' + u.name + '</div><div style="font-size:10.5px;color:var(--inkSoft);">@' + u.username + '</div></td>' +
      '<td style="color:var(--inkSoft);">' + u.storeName + '</td>' +
      '<td><span class="bo-badge ' + (u.active ? 'active">Aktif' : 'inactive">Nonaktif') + '</span></td>' +
      '<td style="text-align:right;"><button class="bo-btn-outline" data-id="' + u.id + '">' + (u.active ? 'Nonaktifkan' : 'Aktifkan') + '</button></td></tr>'
    );
    tr.querySelector('button').onclick = function () { u.active = !u.active; boRender(); };
    tbody.appendChild(tr);
  });
  card.appendChild(table);
  wrap.appendChild(card);
  return wrap;
}

/* ---------------- PRODUK & STOK ---------------- */
function boRenderProduk() {
  var wrap = boEl('<div></div>');
  var toolbar = boEl('<div class="bo-toolbar"><div></div><button class="bo-btn" id="bo-add-produk">+ Tambah Produk</button></div>');
  toolbar.querySelector('#bo-add-produk').onclick = function () { boState.showForm = boState.showForm === 'produk' ? null : 'produk'; boRender(); };
  wrap.appendChild(toolbar);

  if (boState.showForm === 'produk') {
    var form = boEl(
      '<div class="bo-inline-form">' +
        '<div class="bo-form-grid">' +
          '<div class="bo-form-field"><label>Nama Produk</label><input id="bo-p-name" placeholder="Es Kopi Susu"></div>' +
          '<div class="bo-form-field"><label>Kategori</label><input id="bo-p-category" placeholder="Minuman"></div>' +
          '<div class="bo-form-field"><label>Harga</label><input id="bo-p-price" type="number" placeholder="20000"></div>' +
          '<div class="bo-form-field"><label>Stok Awal</label><input id="bo-p-stock" type="number" placeholder="20"></div>' +
        '</div>' +
        '<button class="bo-btn" id="bo-p-submit">Tambah Produk</button>' +
      '</div>'
    );
    form.querySelector('#bo-p-submit').onclick = function () {
      var name = form.querySelector('#bo-p-name').value.trim();
      if (!name) return;
      BO_PRODUCTS.push({
        id: 'p' + (BO_PRODUCTS.length + 1), sku: 'NEW-' + (BO_PRODUCTS.length + 1),
        name: name, category: form.querySelector('#bo-p-category').value || 'Minuman',
        price: Number(form.querySelector('#bo-p-price').value) || 0,
        stock: Number(form.querySelector('#bo-p-stock').value) || 0, minStock: 5, emoji: '🆕',
      });
      boState.showForm = null; boRender();
    };
    wrap.appendChild(form);
  }

  var card = boEl('<div class="bo-card"></div>');
  var table = boEl('<table class="bo-table"><thead><tr><th>Produk</th><th>Kategori</th><th style="text-align:right;">Harga</th><th style="text-align:right;">Stok</th><th style="text-align:right;">Aksi</th></tr></thead><tbody></tbody></table>');
  var tbody = table.querySelector('tbody');
  BO_PRODUCTS.forEach(function (p) {
    var low = p.stock <= p.minStock;
    var tr = boEl(
      '<tr><td><div class="bo-product-cell"><div class="em" style="background:' + (BO_CATEGORY_COLORS[p.category] || '#F1EEE5') + '">' + p.emoji + '</div>' +
      '<span style="font-weight:700;">' + p.name + '</span></div></td>' +
      '<td style="color:var(--inkSoft);">' + p.category + '</td>' +
      '<td style="text-align:right;">' + boFmtRp(p.price) + '</td>' +
      '<td style="text-align:right;' + (low ? 'color:var(--alert);font-weight:700;' : '') + '">' + p.stock + '</td>' +
      '<td style="text-align:right;"><button class="bo-btn-outline dec">-</button> <button class="bo-btn-outline inc">+</button></td></tr>'
    );
    tr.querySelector('.inc').onclick = function () { p.stock++; boRender(); };
    tr.querySelector('.dec').onclick = function () { p.stock = Math.max(0, p.stock - 1); boRender(); };
    tbody.appendChild(tr);
  });
  card.appendChild(table);
  wrap.appendChild(card);
  return wrap;
}

/* ---------------- PROMO ---------------- */
function boRenderPromo() {
  var wrap = boEl('<div></div>');
  var toolbar = boEl('<div class="bo-toolbar"><div></div><button class="bo-btn" id="bo-add-promo">+ Tambah Promo</button></div>');
  toolbar.querySelector('#bo-add-promo').onclick = function () { boState.showForm = boState.showForm === 'promo' ? null : 'promo'; boRender(); };
  wrap.appendChild(toolbar);

  if (boState.showForm === 'promo') {
    var form = boEl(
      '<div class="bo-inline-form">' +
        '<div class="bo-form-field"><label>Nama Promo</label><input id="bo-pr-name" placeholder="Diskon Member 10%"></div>' +
        '<div class="bo-form-grid">' +
          '<div class="bo-form-field"><label>Tipe Diskon</label><select id="bo-pr-type"><option value="percentage">Persentase (%)</option><option value="nominal">Nominal (Rp)</option></select></div>' +
          '<div class="bo-form-field"><label>Nilai</label><input id="bo-pr-value" type="number" placeholder="10"></div>' +
        '</div>' +
        '<button class="bo-btn" id="bo-pr-submit">Tambah Promo</button>' +
      '</div>'
    );
    form.querySelector('#bo-pr-submit').onclick = function () {
      var name = form.querySelector('#bo-pr-name').value.trim();
      if (!name) return;
      BO_PROMOS.push({
        id: 'promo' + (BO_PROMOS.length + 1), name: name, description: 'Ditampilkan ke kasir',
        type: form.querySelector('#bo-pr-type').value, value: Number(form.querySelector('#bo-pr-value').value) || 0,
        minPurchase: 0, active: true,
      });
      boState.showForm = null; boRender();
    };
    wrap.appendChild(form);
  }

  BO_PROMOS.forEach(function (p) {
    var card = boEl(
      '<div class="bo-promo-card">' +
        '<div class="top"><span class="name">' + p.name + '</span><span class="bo-badge ' + (p.active ? 'active">Aktif' : 'inactive">Nonaktif') + '</span></div>' +
        '<div class="desc">' + p.description + '</div>' +
        '<div class="meta">' + (p.type === 'percentage' ? p.value + '%' : boFmtRp(p.value)) + ' · min. belanja ' + boFmtRp(p.minPurchase) + '</div>' +
        '<button class="bo-btn-outline" style="margin-top:8px;">' + (p.active ? 'Nonaktifkan' : 'Aktifkan') + '</button>' +
      '</div>'
    );
    card.querySelector('button').onclick = function () { p.active = !p.active; boRender(); };
    wrap.appendChild(card);
  });
  return wrap;
}

/* ---------------- RIWAYAT TRANSAKSI ---------------- */
function boRenderRiwayat() {
  var wrap = boEl('<div class="bo-card"></div>');
  var table = boEl(
    '<table class="bo-table"><thead><tr><th>Invoice</th><th>Waktu</th><th>Kasir</th><th>Metode</th><th>Status</th><th style="text-align:right;">Total</th></tr></thead><tbody></tbody></table>'
  );
  var tbody = table.querySelector('tbody');
  BO_TRANSACTIONS.forEach(function (t) {
    tbody.appendChild(boEl(
      '<tr><td style="font-weight:700;">' + t.invoice + '</td><td style="color:var(--inkSoft);">' + t.time + '</td>' +
      '<td>' + t.kasir + '</td><td>' + t.method + '</td>' +
      '<td><span class="bo-badge active">' + t.status + '</span></td>' +
      '<td style="text-align:right;font-weight:700;">' + boFmtRp(t.total) + '</td></tr>'
    ));
  });
  wrap.appendChild(table);
  return wrap;
}

/* ---------------- REPORTING ---------------- */
function boRenderReporting() {
  var total = BO_REPORTING.reduce(function (s, r) { return s + r.total; }, 0);
  var wrap = boEl('<div class="bo-card"><div style="font-size:12.5px;margin-bottom:10px;">Total <b style="color:var(--ink);">' + boFmtRp(total) + '</b> dari ' + BO_REPORTING.length + ' baris</div></div>');
  var table = boEl(
    '<table class="bo-table"><thead><tr><th>Tanggal</th><th>Metode</th><th style="text-align:right;">Jumlah Transaksi</th><th style="text-align:right;">Total Sistem</th></tr></thead><tbody></tbody></table>'
  );
  var tbody = table.querySelector('tbody');
  BO_REPORTING.forEach(function (r) {
    tbody.appendChild(boEl(
      '<tr><td>' + r.date + '</td><td>' + r.method + '</td><td style="text-align:right;">' + r.count + '</td>' +
      '<td style="text-align:right;font-weight:700;">' + boFmtRp(r.total) + '</td></tr>'
    ));
  });
  wrap.appendChild(table);
  return wrap;
}

/* ---------------- PENGATURAN EDC ---------------- */
function boRenderEdc() {
  var wrap = boEl('<div></div>');
  var tabs = boEl('<div class="bo-store-tabs"></div>');
  BO_STORES.forEach(function (s) {
    var tab = boEl('<div class="bo-store-tab' + (boState.storeFilter === s.id ? ' active' : '') + '">' + s.name + '</div>');
    tab.onclick = function () { boState.storeFilter = s.id; boRender(); };
    tabs.appendChild(tab);
  });
  wrap.appendChild(tabs);

  var terminals = BO_EDC_TERMINALS[boState.storeFilter] || [];
  var card = boEl('<div class="bo-card"></div>');
  var toolbar = boEl('<div class="bo-toolbar"><div></div><button class="bo-btn" id="bo-add-edc">+ Tambah Terminal</button></div>');
  toolbar.querySelector('#bo-add-edc').onclick = function () { boState.showForm = boState.showForm === 'edc' ? null : 'edc'; boRender(); };
  card.appendChild(toolbar);

  if (boState.showForm === 'edc') {
    var form = boEl(
      '<div class="bo-inline-form">' +
        '<div class="bo-form-field"><label>Nama/Label Terminal</label><input id="bo-e-label" placeholder="Kasir 1 / Meja Depan"></div>' +
        '<div class="bo-form-field"><label>Mode</label><select id="bo-e-mode"><option value="simulator">Simulator (tanpa mesin fisik)</option><option value="live">Live (mesin EDC asli)</option></select></div>' +
        '<button class="bo-btn" id="bo-e-submit">Tambah Terminal</button>' +
      '</div>'
    );
    form.querySelector('#bo-e-submit').onclick = function () {
      var label = form.querySelector('#bo-e-label').value.trim();
      if (!label) return;
      if (!BO_EDC_TERMINALS[boState.storeFilter]) BO_EDC_TERMINALS[boState.storeFilter] = [];
      BO_EDC_TERMINALS[boState.storeFilter].push({ id: 't' + Date.now(), label: label, mode: form.querySelector('#bo-e-mode').value, mid: '', stationCode: '' });
      boState.showForm = null; boRender();
    };
    card.appendChild(form);
  }

  if (!terminals.length) {
    card.appendChild(boEl('<div class="bo-empty">Belum ada terminal EDC untuk store ini.</div>'));
  } else {
    var table = boEl('<table class="bo-table"><thead><tr><th>Terminal</th><th>Mode</th><th>Detail</th></tr></thead><tbody></tbody></table>');
    var tbody = table.querySelector('tbody');
    terminals.forEach(function (t) {
      tbody.appendChild(boEl(
        '<tr><td style="font-weight:700;">' + t.label + '</td>' +
        '<td><span class="bo-badge ' + (t.mode === 'live' ? 'active">Live' : 'inactive">Simulator') + '</span></td>' +
        '<td style="color:var(--inkSoft);">' + (t.mode === 'live' ? 'MID ' + (t.mid || '-') + ' · Kode Stasiun ' + (t.stationCode || '-') : '-') + '</td></tr>'
      ));
    });
    card.appendChild(table);
  }
  wrap.appendChild(card);
  return wrap;
}

/* ---------------- PENGATURAN QRIS ---------------- */
function boRenderQris() {
  var wrap = boEl('<div></div>');
  var tabs = boEl('<div class="bo-store-tabs"></div>');
  BO_STORES.forEach(function (s) {
    var tab = boEl('<div class="bo-store-tab' + (boState.storeFilter === s.id ? ' active' : '') + '">' + s.name + '</div>');
    tab.onclick = function () { boState.storeFilter = s.id; boRender(); };
    tabs.appendChild(tab);
  });
  wrap.appendChild(tabs);

  var cfg = BO_QRIS_CONFIG[boState.storeFilter] || { enabled: false, env: 'sandbox', serverKey: '', clientKey: '' };
  var card = boEl(
    '<div class="bo-card" style="max-width:420px;">' +
      '<label class="bo-form-check"><input type="checkbox" id="bo-q-enabled" ' + (cfg.enabled ? 'checked' : '') + '> Aktifkan QRIS untuk store ini</label>' +
      '<div id="bo-q-fields" style="' + (cfg.enabled ? '' : 'opacity:0.4;pointer-events:none;') + '">' +
        '<div class="bo-form-field"><label>Environment</label><select id="bo-q-env"><option value="sandbox"' + (cfg.env === 'sandbox' ? ' selected' : '') + '>Sandbox</option><option value="production"' + (cfg.env === 'production' ? ' selected' : '') + '>Production</option></select></div>' +
        '<div class="bo-form-field"><label>Midtrans Server Key</label><input id="bo-q-server" placeholder="SB-Mid-server-..." value="' + cfg.serverKey + '"></div>' +
        '<div class="bo-form-field"><label>Midtrans Client Key</label><input id="bo-q-client" placeholder="SB-Mid-client-..." value="' + cfg.clientKey + '"></div>' +
      '</div>' +
      '<button class="bo-btn" id="bo-q-save">Simpan</button>' +
      '<span id="bo-q-saved" style="margin-left:10px;font-size:11.5px;color:var(--leaf);font-weight:700;display:none;">✓ Tersimpan</span>' +
    '</div>'
  );
  var chk = card.querySelector('#bo-q-enabled');
  var fields = card.querySelector('#bo-q-fields');
  chk.onchange = function () { fields.style.opacity = chk.checked ? '1' : '0.4'; fields.style.pointerEvents = chk.checked ? 'auto' : 'none'; };
  card.querySelector('#bo-q-save').onclick = function () {
    BO_QRIS_CONFIG[boState.storeFilter] = {
      enabled: chk.checked, env: card.querySelector('#bo-q-env').value,
      serverKey: card.querySelector('#bo-q-server').value, clientKey: card.querySelector('#bo-q-client').value,
    };
    var badge = card.querySelector('#bo-q-saved');
    badge.style.display = 'inline';
    setTimeout(function () { badge.style.display = 'none'; }, 1800);
  };
  wrap.appendChild(card);
  return wrap;
}

window.MockGreenPosBackoffice = {
  mount: function (rootEl) { _boRoot = rootEl; boRender(); },
};
