import { initBrandBanner } from './brand-banner.js';
import { initMouseTrail } from './mouse-trail.js';
import { initContactPanel } from './contact-panel.js';
/* =========================================================
   CATALOG PAGE — data + filter/sort/render logic for catalog.html.

   Category filtering is multi-select: each specific category button
   toggles independently (click to add, click again to remove), and
   several can be active at once -- matching products are anything
   that has AT LEAST ONE of the selected tags (OR, not AND).

   "Все" is a special reset button, not just another toggle: clicking
   it clears every selected category and shows the full catalog. If
   the person instead turns off every selected category one by one
   (rather than hitting "Все"), the filter set becomes empty again and
   "Все" lights back up on its own -- an empty selection and "Все"
   both mean the same thing ("no filter"), so they always stay in
   sync (see updateCategoryActiveStates).
   ========================================================= */

const PRODUCTS = [
  { id:'flirt',   name:'Нежный флирт',      desc:'Розовые и белые альстромерии в нежной упаковке', price:2800, img:'images/bouquet-flirt.png',   tags:['Хит недели'],            isNew:false },
  { id:'field',   name:'Полевой букет',     desc:'Ромашки, зелень и полевые травы',                price:2400, img:'images/bouquet-field.png',   tags:['Бестселлер'],            isNew:false },
  { id:'peach',   name:'Утренний персик',   desc:'Пионовидные розы, ромашки и гвоздика',           price:3100, img:'images/bouquet-peach.png',   tags:['Новинка'],               isNew:true  },
  { id:'cloud',   name:'Ромашковое облако', desc:'Огромная шапка хризантем с гипсофилой',          price:4500, img:'images/bouquet-cloud.png',   tags:['Премиум'],               isNew:false },
  { id:'whisper', name:'Тихий шёпот',       desc:'Эустома, гвоздика и пастельные тона',            price:2200, img:'images/bouquet-whisper.png', tags:['Топ подарок'],           isNew:false },

  { id:'scarlet', name:'Алый скандал',      desc:'25 красных роз, минимум зелени, максимум драмы', price:3900, img:'images/bouquet-scarlet.jpg', tags:['Хит недели','Монобукет'], isNew:false },
  { id:'ivory',   name:'Слоновая кость',    desc:'Кремовые пионовидные розы и эвкалипт',           price:4200, img:'images/bouquet-ivory.jpg',   tags:['Премиум','Топ подарок'],  isNew:false },
  { id:'citrus',  name:'Цитрусовый заряд',  desc:'Оранжевые ранункулюсы и жёлтые тюльпаны',        price:2600, img:'images/bouquet-citrus.jpg',  tags:['Новинка'],                isNew:true  },
  { id:'mono',    name:'Моно тюльпан',      desc:'25 тюльпанов одного оттенка, без декора',        price:1900, img:'images/bouquet-mono.jpg',    tags:['Монобукет','Бестселлер'], isNew:false },
  { id:'wild',    name:'Дикий сад',         desc:'Смесь садовых трав, маков и васильков',          price:2500, img:'images/bouquet-wild.jpg',    tags:['Бестселлер'],             isNew:false },
  { id:'noir',    name:'Ночной карнавал',   desc:'Тёмно-бордовые розы и чёрный ранункулюс',        price:4700, img:'images/bouquet-noir.jpg',    tags:['Премиум'],                isNew:false },
  { id:'peony',   name:'Пионовый час',      desc:'Сезонные пионы, розовые и коралловые',           price:3600, img:'images/bouquet-peony.jpg',   tags:['Хит недели','Новинка'],   isNew:true  },
  { id:'mint',    name:'Мятная свежесть',   desc:'Белые розы, мята и серебристая зелень',          price:3300, img:'images/bouquet-mint.jpg',    tags:['Топ подарок'],            isNew:false },
  { id:'sunset',  name:'Закатный микс',     desc:'Гвоздики, розы и хризантемы тёплых тонов',       price:2900, img:'images/bouquet-sunset.jpg',  tags:['Бестселлер'],             isNew:false },
];

const CATEGORY_COUNT_IDS = {
  'all':          'count-all',
  'Хит недели':   'count-hit',
  'Бестселлер':   'count-best',
  'Новинка':      'count-new',
  'Премиум':      'count-premium',
  'Топ подарок':  'count-gift',
  'Монобукет':    'count-mono',
};

const state = {
  search: '',
  categories: new Set(), // empty set === "Все" / no filter
  sort: 'popular',
};

const gridEl     = document.getElementById('catalogGrid');
const countEl    = document.getElementById('catalogCount');
const emptyEl    = document.getElementById('catalogEmpty');
const searchEl   = document.getElementById('catalogSearch');
const sortEl     = document.getElementById('catalogSort');
const categoryItems = document.querySelectorAll('#catalogCategoryList .catalog-category-item');
const resetBtn   = document.getElementById('catalogResetBtn');

/* fill in the live per-category counts in the sidebar once, on load --
   they reflect the full catalog, not the current filter state, so a
   person can see how many items exist in each bucket before clicking */
function renderCategoryCounts(){
  Object.entries(CATEGORY_COUNT_IDS).forEach(([category, elId]) => {
    const el = document.getElementById(elId);
    if (!el) return;
    const count = category === 'all'
      ? PRODUCTS.length
      : PRODUCTS.filter(p => p.tags.includes(category)).length;
    el.textContent = count;
  });
}

/* keeps every category button's visual is-active state in sync with
   state.categories -- called after every toggle so "Все" and the
   individually-selected buttons never disagree with each other */
function updateCategoryActiveStates(){
  const noneSelected = state.categories.size === 0;
  categoryItems.forEach(item => {
    const cat = item.dataset.category;
    const active = cat === 'all' ? noneSelected : state.categories.has(cat);
    item.classList.toggle('is-active', active);
  });
}

function matchesFilters(item){
  if (state.search){
    const q = state.search.trim().toLowerCase();
    if (!item.name.toLowerCase().includes(q)) return false;
  }
  if (state.categories.size > 0){
    const matchesAnySelected = item.tags.some(t => state.categories.has(t));
    if (!matchesAnySelected) return false;
  }
  return true;
}

function sortItems(items){
  const sorted = [...items];
  switch (state.sort){
    case 'new':       sorted.sort((a, b) => (b.isNew - a.isNew)); break;
    case 'name-asc':  sorted.sort((a, b) => a.name.localeCompare(b.name, 'ru')); break;
    default: /* popular -- keep the curated data order as-is */ break;
  }
  return sorted;
}

/* экранирует значения, которые попадают в HTML-атрибуты data-checkout-*,
   чтобы кавычки/амперсанды в названии или описании товара не сломали
   разметку карточки */
function escapeAttr(str){
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function render(){
  const filtered = sortItems(PRODUCTS.filter(matchesFilters));

  countEl.textContent = `Показано ${filtered.length} из ${PRODUCTS.length} букетов`;

  gridEl.innerHTML = filtered.map(item => `
    <article class="catalog-card" data-id="${item.id}">
      <div class="catalog-card-media">
        <span class="catalog-card-tag">${item.tags[0]}</span>
        <img src="${item.img}" alt="${item.name}" loading="lazy">
      </div>
      <div class="catalog-card-body">
        <h3 class="catalog-card-name">${item.name}</h3>
        <p class="catalog-card-desc">${item.desc}</p>
        <div class="catalog-card-footer">
          <span class="catalog-card-price">${item.price.toLocaleString('ru-RU')} ₽</span>
          <button type="button"
                  class="catalog-card-cta"
                  data-checkout-name="${escapeAttr(item.name)}"
                  data-checkout-price="${item.price}"
                  data-checkout-desc="${escapeAttr(item.desc)}"
                  data-checkout-img="${escapeAttr(item.img)}">Заказать <span>→</span></button>
        </div>
      </div>
    </article>
  `).join('');

  emptyEl.hidden = filtered.length !== 0;
  gridEl.hidden = filtered.length === 0;

  const cards = gridEl.querySelectorAll('.catalog-card');
  if (window.gsap){
    gsap.to(cards, {
      opacity: 1, y: 0, duration: .5, stagger: .04, ease: 'power3.out',
    });
  } else {
    cards.forEach(c => { c.style.opacity = 1; c.style.transform = 'none'; });
  }
}

searchEl.addEventListener('input', () => {
  state.search = searchEl.value;
  render();
});

categoryItems.forEach(item => {
  item.addEventListener('click', () => {
    const cat = item.dataset.category;

    if (cat === 'all'){
      state.categories.clear();
    } else if (state.categories.has(cat)){
      state.categories.delete(cat);
    } else {
      state.categories.add(cat);
    }

    updateCategoryActiveStates();
    render();
  });
});

sortEl.addEventListener('change', () => {
  state.sort = sortEl.value;
  render();
});

if (resetBtn){
  resetBtn.addEventListener('click', () => {
    state.search = '';
    state.categories.clear();
    state.sort = 'popular';
    searchEl.value = '';
    sortEl.value = 'popular';
    updateCategoryActiveStates();
    render();
  });
}

/* custom cursor -- same behaviour as index.html, purely cosmetic */
const cursor = document.getElementById('cursor');
if (cursor){
  if (matchMedia('(pointer:fine)').matches){
    window.addEventListener('mousemove', e => {
      if (window.gsap) gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: .15, ease: 'power2.out' });
      else { cursor.style.left = e.clientX + 'px'; cursor.style.top = e.clientY + 'px'; }
    });
    document.addEventListener('mouseover', e => {
      if (e.target.closest('a,button')) cursor.style.width = cursor.style.height = '56px';
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest('a,button')) cursor.style.width = cursor.style.height = '34px';
    });
  } else {
    cursor.style.display = 'none';
  }
}

updateCategoryActiveStates();
renderCategoryCounts();
render();
initBrandBanner();
initMouseTrail();
initContactPanel();