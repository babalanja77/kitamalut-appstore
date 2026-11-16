'use strict';
const state = { apps: [], category: 'Semua', query: '', loadState: 'loading' };
const $ = (q) => document.querySelector(q);
const root = $('#app-grid');
const status = $('#catalog-status');
const count = $('#count');
const dialog = $('#app-detail');
const body = $('#detail-body');
const normalize = value => String(value ?? '').toLocaleLowerCase('id-ID');
const allowedCategory = new Set(['Semua', 'Produktivitas', 'Bisnis', 'Pendidikan', 'Alat & Utilitas']);
const plain = (tag, className, text) => { const el = document.createElement(tag); if (className) el.className = className; if (text !== undefined) el.textContent = String(text); return el; };
function formatBytes(bytes) {
  const amount = Number(bytes);
  if (!Number.isFinite(amount) || amount <= 0) return 'Ukuran belum tersedia';
  return amount >= 1024*1024 ? `${(amount/(1024*1024)).toFixed(1)} MB` : `${Math.round(amount/1024)} KB`;
}
function filteredApps() {
  const q = normalize(state.query).trim();
  return state.apps.filter(app => (state.category === 'Semua' || app.category === state.category) &&
    (!q || [app.name, app.developer_name, app.short_description, app.category].some(v => normalize(v).includes(q))));
}
function setCategory(cat) {
  if (!allowedCategory.has(cat)) return;
  state.category = cat;
  document.querySelectorAll('[data-category]').forEach(node => {
    const active = node.dataset.category === cat;
    node.classList.toggle('active', active);
    node.classList.toggle('selected', active);
    node.setAttribute('aria-pressed', String(active));
  });
  render();
}
function makeCard(app) {
  const article = plain('article', 'app-card');
  const top = plain('div', 'card-top');
  const logo = plain('div', 'app-logo', (app.name || '?').trim().slice(0,1).toUpperCase());
  logo.setAttribute('aria-hidden','true');
  const titleGroup = plain('div','card-name');
  titleGroup.append(plain('h3', '', app.name), plain('p','',app.developer_name));
  top.append(logo, titleGroup);
  article.append(top, plain('p','card-summary', app.short_description));
  const bottom = plain('div','card-bottom');
  bottom.append(plain('span','category-tag',app.category || 'Aplikasi'));
  const open = plain('button','detail-btn','Lihat Detail  →');
  open.type='button'; open.addEventListener('click', () => showDetail(app));
  bottom.append(open); article.append(bottom);
  return article;
}
function showDetail(app) {
  body.replaceChildren();
  const top=plain('div','detail-top');
  const logo=plain('div','app-logo big',(app.name || '?').slice(0,1).toUpperCase());
  logo.setAttribute('aria-hidden','true');
  const info=plain('div'); const title=plain('h2','',app.name);title.id='detail-title';
  info.append(title, plain('p','detail-developer',app.developer_name));top.append(logo,info);
  body.append(top,plain('p','detail-description',app.short_description),plain('p','detail-meta',`Kategori: ${app.category || 'Aplikasi'}  ·  Versi: ${app.version_name || '—'}  ·  ${formatBytes(app.file_size_bytes)}`));
  const link=plain('a','download-btn','Unduh APK  ↓');
  const slug=String(app.slug || '');
  if (/^[a-z0-9](?:[a-z0-9-]{0,118}[a-z0-9])?$/.test(slug)) {
    link.href=`/api/download/${encodeURIComponent(slug)}`;
    link.rel='nofollow';
    body.append(link);
  } else body.append(plain('p','detail-unavailable','Unduhan sementara tidak tersedia.'));
  body.append(plain('p','detail-note','File Android (APK) dipasang atas persetujuan Anda. Periksa izin yang diminta aplikasi.'));
  dialog.showModal();
}
function render() {
  root.replaceChildren();
  if (state.loadState==='loading') {status.textContent='Memuat katalog aplikasi...';status.hidden=false;root.hidden=true;count.textContent='';return;}
  if (state.loadState==='error') {status.textContent='Katalog sedang tidak dapat dimuat. Silakan coba kembali nanti.';status.hidden=false;root.hidden=true;count.textContent='';return;}
  const apps=filteredApps();
  count.textContent=`${apps.length} aplikasi`;
  if (!apps.length) {
    status.textContent=state.query.trim() ? 'Tidak ada aplikasi yang sesuai pencarian.' : (state.category!=='Semua' ? 'Belum ada aplikasi untuk kategori ini.' : 'Katalog aplikasi sedang disiapkan. Kunjungi kembali untuk pembaruan.');
    status.hidden=false;root.hidden=true;
  } else { status.hidden=true;root.hidden=false;for(const app of apps) root.append(makeCard(app)); }
}
async function loadCatalog() {
  state.loadState='loading';render();
  try {
    const response=await fetch('/api/apps?limit=50',{headers:{Accept:'application/json'},cache:'no-store'});
    if(!response.ok) throw new Error('Katalog tidak tersedia');
    const payload=await response.json();
    if(!payload || !Array.isArray(payload.apps)) throw new Error('Format katalog tidak valid');
    state.apps=payload.apps.filter(app=>app && typeof app.name==='string' && typeof app.slug==='string');
    state.loadState='ready';
  } catch (_) { state.apps=[];state.loadState='error'; }
  render();
}
document.querySelectorAll('[data-category]').forEach(btn=>btn.addEventListener('click',()=>setCategory(btn.dataset.category)));
$('#search').addEventListener('input',event=>{state.query=event.target.value;render();});
$('#bottom-business').addEventListener('click',()=>setCategory('Bisnis'));
$('#close-detail').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
setCategory('Semua');
loadCatalog();