// ===== Плавное появление секций =====
function initReveal(){
  const els = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, {threshold:0.12});
  els.forEach(el=>io.observe(el));
}

// ===== Мобильное меню =====
function initNavToggle(){
  const toggle = document.querySelector('.navtoggle');
  const links = document.querySelector('.navlinks');
  if(!toggle || !links) return;
  toggle.addEventListener('click', ()=>{
    const open = links.style.display === 'flex';
    links.style.cssText = open ? '' : 'display:flex; position:fixed; top:64px; left:0; right:0; background:var(--paper); flex-direction:column; padding:18px 28px; gap:16px; border-bottom:1px solid var(--line); z-index:99;';
  });
}

// ===== Раскрытие карточек новостей (делегирование, работает и для динамических карточек) =====
function initNewsToggle(){
  document.addEventListener('click', (e)=>{
    const card = e.target.closest('[data-news]');
    if(card) card.classList.toggle('open');
  });
}

// ===== Анимированные счётчики =====
function initCounters(){
  const counters = document.querySelectorAll('[data-count]');
  if(!counters.length) return;
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const decimals = el.dataset.count.includes('.') ? 1 : 0;
      const duration = 1400;
      const start = performance.now();
      function tick(now){
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = target * eased;
        el.textContent = (decimals ? val.toFixed(decimals) : Math.round(val)) + suffix;
        if(p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, {threshold:0.4});
  counters.forEach(c=>io.observe(c));
}

// ===== Рендер новостей из content/news.json =====
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function renderDetails(text){
  if(!text) return '';
  return text.split(/\n\s*\n/).map(block=>{
    block = block.trim();
    if(!block) return '';
    if(block.startsWith('>')){
      return `<p class="quote">${escapeHtml(block.replace(/^>\s*/,''))}</p>`;
    }
    return `<p>${escapeHtml(block)}</p>`;
  }).join('');
}

function newsCardHtml(item){
  const leadClass = item.lead ? ' lead' : '';
  const emojiHtml = item.lead
    ? `<span class="emoji">${item.emoji || '🍐'}</span><div>`
    : '';
  const closeDiv = item.lead ? '</div>' : '';
  const dateLabel = item.lead ? `Главное · ${escapeHtml(item.date)}` : escapeHtml(item.date);
  return `
    <div class="news-card${leadClass}" data-news>
      ${emojiHtml}
      <div class="date">${dateLabel}</div>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.teaser)}</p>
      <div class="news-more"><span>Читать подробности</span><span class="chev">⌄</span></div>
      <div class="news-extra">${renderDetails(item.details)}</div>
      ${closeDiv}
    </div>`;
}

async function renderNews(){
  const grid = document.getElementById('newsGrid');
  if(!grid) return;
  try{
    const res = await fetch('content/news.json', {cache:'no-store'});
    if(!res.ok) throw new Error('fetch failed');
    const data = await res.json();
    const items = (data.items || []).slice();
    // ведущая новость первой, остальные — как в файле
    items.sort((a,b)=> (b.lead?1:0) - (a.lead?1:0));
    grid.innerHTML = items.map(newsCardHtml).join('');
  }catch(err){
    grid.innerHTML = '<p style="padding:20px;color:rgba(28,26,18,0.6)">Не удалось загрузить новости. Обновите страницу или проверьте content/news.json.</p>';
    console.error(err);
  }
}

// ===== Инициализация =====
document.addEventListener('DOMContentLoaded', ()=>{
  document.body.classList.add('loaded');
  initNavToggle();
  initNewsToggle();
  initCounters();
  renderNews().finally(initReveal);
});
