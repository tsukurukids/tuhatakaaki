/* ===================================================
   忘れ物チェック — app.js
   =================================================== */

// ─── State ────────────────────────────────────────────────────────────────────
let categories = JSON.parse(localStorage.getItem('categories')) || [];
let currentCategoryId = null;
let editingCategoryId = null;
let selectedIcon = '🎒';
let selectedDays = [];
let itemSelectedDays = [];
let completionCelebrated = false; // 重複発火防止
let editingItemId = null;         // 編集中のアイテムのID
let activeTimeFilter = null;      // 絞り込み中の「時」（null = すべて表示）
let viewMode = 'category';        // 'category' or 'schedule'

const ICONS = [
  '🎒', '✈️', '🏕️', '💼', '🎓', '🏋️', '🎸', '🍳', '🏖️', '🧳',
  '🚀', '🎯', '🏠', '🚂', '🎪', '🛸', '🎨', '🎭', '🔬', '🎃',
  '🦸', '🧸', '🌸', '🍀', '🦋', '🌊', '⚽', '🎮', '📚', '💡'
];

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

// ─── DOM ──────────────────────────────────────────────────────────────────────
const categorySelector = document.getElementById('category-selector');
const addCategoryBtn = document.getElementById('add-category-btn');
const currentCategoryTitle = document.getElementById('current-category-title');
const editCategoryBtn = document.getElementById('edit-category-btn');
const deleteCategoryMainBtn = document.getElementById('delete-category-main-btn');
const progressFill = document.getElementById('progress-fill');
const progressTextContent = document.getElementById('progress-text-content');
const newItemInput = document.getElementById('new-item-input');
// 時間帯の入力欄
const newItemTime = document.getElementById('new-item-time');
// 時間帯絞り込みバー
const timeFilterContainer = document.getElementById('time-filter-container');
const addBtn = document.getElementById('add-btn');
const itemList = document.getElementById('item-list');
const resetBtn = document.getElementById('reset-btn');
// すべてのアイテムをチェックするボタン
const checkAllBtn = document.getElementById('check-all-btn');
// チェック済みを削除するボタン
const deleteCheckedBtn = document.getElementById('delete-checked-btn');
// すべてのアイテムを削除するボタン
const deleteAllItemsBtn = document.getElementById('delete-all-items-btn');
const themeToggleBtn = document.getElementById('theme-toggle');
const modeToggle = document.querySelector('.mode-toggle');

// 削除を確認するモーダルの部品たち
const confirmModal = document.getElementById('confirm-modal');
const confirmModalTitle = document.getElementById('confirm-modal-title');
const confirmModalMessage = document.getElementById('confirm-modal-message');
const confirmOkBtn = document.getElementById('confirm-ok-btn');
const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
const langSelector = document.getElementById('lang-selector');
const dateDisplay = document.getElementById('date-display');
// 現在時刻を表示するための場所
const clockDisplay = document.getElementById('clock-display');

// Modal
const categoryModal = document.getElementById('category-modal');
const modalTitle = document.getElementById('modal-title');
const closeModalBtn = document.getElementById('close-modal-btn');
const catNameInput = document.getElementById('cat-name-input');
const iconSelector = document.getElementById('icon-selector');
const saveCatBtn = document.getElementById('save-cat-btn');
const deleteCatBtn = document.getElementById('delete-cat-btn');
const modalDaySelector = document.getElementById('modal-day-selector-container');

// QRコードを表示する画面の部品たち
const shareModal = document.getElementById('share-modal');
const closeShareBtn = document.getElementById('close-share-btn');
const shareBtn = document.getElementById('share-btn');
const qrCodeImg = document.getElementById('qr-code-img');

// アイテム編集モーダルの部品たち
const editItemModal = document.getElementById('edit-item-modal');
const closeEditItemBtn = document.getElementById('close-edit-item-btn');
const editItemNameInput = document.getElementById('edit-item-name-input');
const editItemTimeInput = document.getElementById('edit-item-time-input');
const editItemDaySelector = document.getElementById('edit-item-day-selector');
const saveEditItemBtn = document.getElementById('save-edit-item-btn');

// 背景カラー変更のための部品たち
const colorPaletteBtn = document.getElementById('color-palette-btn');
const colorModal = document.getElementById('color-modal');
const closeColorModalBtn = document.getElementById('close-color-modal');
const colorOptionsGrid = document.getElementById('color-options-grid');

// 週間予定表の部品たち
const viewCategoryTab = document.getElementById('view-category-tab');
const viewScheduleTab = document.getElementById('view-schedule-tab');
const scheduleView = document.getElementById('schedule-view');
const scheduleGrid = document.getElementById('schedule-grid');
const categoryWrapper = document.querySelector('.category-wrapper');
const progressContainer = document.querySelector('.progress-container');
const inputArea = document.querySelector('.input-area');
const actionsArea = document.querySelector('.actions');
const categoryHeader = document.querySelector('.category-header');

// きれいな色の組み合わせをいくつか用意するよ！
const THEME_COLORS = [
  { name: 'ベリー', primary: '#7c6ef5', g1: '#7c6ef5', g2: '#f06292', g3: '#48d3c8' },
  { name: 'ソーダ', primary: '#3b82f6', g1: '#3b82f6', g2: '#06b6d4', g3: '#2dd4bf' },
  { name: 'メロン', primary: '#10b981', g1: '#10b981', g2: '#34d399', g3: '#a7f3d0' },
  { name: '夕焼け', primary: '#f97316', g1: '#f97316', g2: '#fbbf24', g3: '#fde047' },
  { name: 'いちご', primary: '#ef4444', g1: '#ef4444', g2: '#fb7185', g3: '#fda4af' },
  { name: '宇宙', primary: '#8b5cf6', g1: '#8b5cf6', g2: '#d946ef', g3: '#f472b6' },
  { name: '森', primary: '#059669', g1: '#059669', g2: '#4ade80', g3: '#bef264' },
  { name: '空', primary: '#0ea5e9', g1: '#0ea5e9', g2: '#7dd3fc', g3: '#e0f2fe' }
];

// ─── Theme ────────────────────────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved === 'light' ? 'light' : '');
  updateThemeIcon(saved);

  // 保存されている好みの色があれば、それを呼び出すよ！
  const savedColor = JSON.parse(localStorage.getItem('themeColor'));
  if (savedColor) {
    applyThemeColor(savedColor);
  }
}

// 画面に新しい色をぬる関数
function applyThemeColor(colors) {
  const root = document.documentElement;
  root.style.setProperty('--primary', colors.primary);
  root.style.setProperty('--gradient-1', colors.g1);
  root.style.setProperty('--gradient-2', colors.g2);
  root.style.setProperty('--gradient-3', colors.g3);
}

function updateThemeIcon(theme) {
  const icon = themeToggleBtn.querySelector('i');
  if (theme === 'light') {
    icon.className = 'fa-solid fa-sun';
  } else {
    icon.className = 'fa-solid fa-moon';
  }
}

themeToggleBtn.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next === 'light' ? 'light' : '');
  localStorage.setItem('theme', next);
  updateThemeIcon(next);
});

// ─── 背景カラー変更の動き ──────────────────────────────────────────────────────────

// パレットボタンを押したときに、色を選ぶ画面を開く
colorPaletteBtn.addEventListener('click', () => {
  // 色のボタンを作る
  colorOptionsGrid.innerHTML = '';
  THEME_COLORS.forEach(c => {
    const btn = document.createElement('button');
    btn.style.width = '50px';
    btn.style.height = '50px';
    btn.style.borderRadius = '50%';
    btn.style.border = '3px solid white';
    btn.style.cursor = 'pointer';
    btn.style.background = `linear-gradient(135deg, ${c.g1}, ${c.g2})`;
    btn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';

    // ボタンを押したときに色を変える！
    btn.addEventListener('click', () => {
      applyThemeColor(c);
      localStorage.setItem('themeColor', JSON.stringify(c));
      colorModal.classList.add('hidden'); // 閉じる
    });

    colorOptionsGrid.appendChild(btn);
  });

  colorModal.classList.remove('hidden');
});

// 「×」ボタンで画面を閉じる
closeColorModalBtn.addEventListener('click', () => colorModal.classList.add('hidden'));

// 画面の外をタップしても閉じる
colorModal.addEventListener('click', (e) => {
  if (e.target === colorModal) colorModal.classList.add('hidden');
});

// ─── Language ─────────────────────────────────────────────────────────────────
let currentLang = localStorage.getItem('lang') || 'ja';

function t(key) {
  return (translations[currentLang] && translations[currentLang][key]) || key;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
  });
}

langSelector.value = currentLang;
langSelector.addEventListener('change', () => {
  currentLang = langSelector.value;
  localStorage.setItem('lang', currentLang);
  applyTranslations();
  renderCategories();
  renderItems();
  updateProgress();
  renderTimeFilter();
});

// ─── Clock ──────────────────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  // 時:分:秒 の形式で表示する（2桁に揃える）
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  clockDisplay.textContent = `${h}:${m}:${s}`;
}

// ─── Date Display ─────────────────────────────────────────────────────────────
function updateDateDisplay() {
  const now = new Date();
  const opts = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  dateDisplay.textContent = now.toLocaleDateString(currentLang === 'ja' ? 'ja-JP' : (currentLang === 'es' ? 'es-ES' : 'en-US'), opts);
}

// ─── Save ─────────────────────────────────────────────────────────────────────
function saveData() {
  localStorage.setItem('categories', JSON.stringify(categories));
}

// ─── Progress ─────────────────────────────────────────────────────────────────
function updateProgress() {
  const cat = categories.find(c => c.id === currentCategoryId);
  if (!cat || cat.items.length === 0) {
    progressFill.style.width = '0%';
    progressTextContent.textContent = t('progressFormat')
      .replace('{completed}', 0)
      .replace('{total}', 0);
    completionCelebrated = false;
    return;
  }
  const checked = cat.items.filter(i => i.checked).length;
  const total = cat.items.length;
  const pct = Math.round((checked / total) * 100);
  progressFill.style.width = pct + '%';
  progressTextContent.textContent = t('progressFormat')
    .replace('{completed}', checked)
    .replace('{total}', total);

  // 全完了時にエフェクト発動
  if (checked === total && total > 0) {
    if (!completionCelebrated) {
      completionCelebrated = true;
      triggerCompletionEffect();
    }
  } else {
    completionCelebrated = false;
  }

  // カテゴリーのバッジ（残り件数）も更新する
  renderCategories();
}

// ─── Categories ───────────────────────────────────────────────────────────────
function renderCategories() {
  const scrollPos = categorySelector.scrollLeft;
  categorySelector.innerHTML = '';
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'category-btn' + (cat.id === currentCategoryId ? ' active' : '');
    btn.dataset.id = cat.id; // 並べ替え用にIDを持たせる

    // 未チェックのアイテム数を数える
    const uncheckedCount = cat.items.filter(i => !i.checked).length;

    // アイコンとカテゴリー名
    const iconSpan = document.createElement('span');
    iconSpan.textContent = cat.icon;
    const nameSpan = document.createElement('span');
    nameSpan.textContent = cat.name;

    btn.appendChild(iconSpan);
    btn.appendChild(nameSpan);

    // 未チェックがある場合だけバッジを表示する
    if (uncheckedCount > 0) {
      const badge = document.createElement('span');
      badge.className = 'cat-badge';
      badge.textContent = t('remainingBadge').replace('{count}', uncheckedCount);
      btn.appendChild(badge);
    }

    btn.addEventListener('click', () => {
      currentCategoryId = cat.id;
      completionCelebrated = false;
      activeTimeFilter = null; // カテゴリーを変えたら絞り込みをリセットする
      renderCategories();
      renderTimeFilter();
      renderItems();
      updateProgress();
      updateHeader();
    });
    categorySelector.appendChild(btn);
  });
  categorySelector.scrollLeft = scrollPos;
}

function updateHeader() {
  const cat = categories.find(c => c.id === currentCategoryId);
  if (cat) {
    currentCategoryTitle.innerHTML = `${cat.icon} <span>${cat.name}</span>`;
    if (cat.days && cat.days.length > 0) {
      const dayStr = cat.days.map(d => t(d)).join('・');
      currentCategoryTitle.innerHTML += ` <span class="title-day">(${dayStr})</span>`;
    }
  } else {
    currentCategoryTitle.textContent = '';
  }
}

// ─── Time Filter ─────────────────────────────────────────────────────────────
// 現在のカテゴリーのアイテムから時間帯ボタンを自動で作る関数
function renderTimeFilter() {
  const cat = categories.find(c => c.id === currentCategoryId);
  timeFilterContainer.innerHTML = '';

  // カテゴリーがないか、時間を設定しているアイテムが1つもなければ非表示
  if (!cat) { timeFilterContainer.classList.add('hidden'); return; }

  // 各アイテムの時間帯から「時」の数字だけ取り出して集める
  const hours = new Set();
  cat.items.forEach(item => {
    if (!item.time) return;
    const match = item.time.match(/^(\d+)/); // 先頭の数字が「時」
    if (match) hours.add(parseInt(match[1]));
  });

  // 時間を持つアイテムがなければ非表示にする
  if (hours.size === 0) {
    timeFilterContainer.classList.add('hidden');
    return;
  }

  // 時間帯ボタンが存在するので表示する
  timeFilterContainer.classList.remove('hidden');

  // 「すべて」ボタンを一番左に追加する
  const allBtn = document.createElement('button');
  allBtn.className = 'time-filter-chip' + (activeTimeFilter === null ? ' active' : '');
  allBtn.textContent = t('all');
  allBtn.addEventListener('click', () => {
    activeTimeFilter = null; // 絞り込みを解除
    renderTimeFilter();
    renderItems();
    updateProgress();
  });
  timeFilterContainer.appendChild(allBtn);

  // 小さい時間順に時間帯ボタンを並べる
  [...hours].sort((a, b) => a - b).forEach(h => {
    const btn = document.createElement('button');
    btn.className = 'time-filter-chip' + (activeTimeFilter === h ? ' active' : '');
    btn.textContent = `${h}:00〜${h + 1}:00`; // 例：「10:00〜11:00」
    btn.addEventListener('click', () => {
      // 同じボタンをもう一度押すと絞り込みを解除する
      activeTimeFilter = (activeTimeFilter === h) ? null : h;
      renderTimeFilter();
      renderItems();
      updateProgress();
    });
    timeFilterContainer.appendChild(btn);
  });
}

// ─── Items ────────────────────────────────────────────────────────────────────
function renderItems() {
  itemList.innerHTML = '';
  const cat = categories.find(c => c.id === currentCategoryId);

  if (!cat) {
    const li = document.createElement('li');
    li.className = 'item-card';
    li.style.justifyContent = 'center';
    li.style.color = 'var(--text-faint)';
    li.style.fontSize = '0.9rem';
    li.textContent = t('noCategory');
    itemList.appendChild(li);
    return;
  }

  // 時間帯フィルターを適用する（絞り込み中はその時間のアイテムだけ残す）
  let displayItems = cat.items;
  if (activeTimeFilter !== null) {
    displayItems = cat.items.filter(item => {
      if (!item.time) return false;
      const match = item.time.match(/^(\d+)/);
      return match && parseInt(match[1]) === activeTimeFilter;
    });
  }

  if (displayItems.length === 0) {
    const li = document.createElement('li');
    li.className = 'item-card';
    li.style.justifyContent = 'center';
    li.style.color = 'var(--text-faint)';
    li.style.fontSize = '0.9rem';
    // 絞り込み中かどうかでメッセージを変える
    li.textContent = activeTimeFilter !== null
      ? `${activeTimeFilter}:00〜${activeTimeFilter + 1}:00 のアイテムはありません`
      : t('noItems');
    itemList.appendChild(li);
    return;
  }

  displayItems.forEach((item, idx) => {
    const li = document.createElement('li');
    li.className = 'item-card' + (item.checked ? ' checked' : '');
    li.dataset.id = item.id; // 並べ替え用にIDを持たせる
    li.style.animationDelay = `${idx * 0.04}s`;

    // Checkbox + Text
    const content = document.createElement('div');
    content.className = 'item-content';
    content.addEventListener('click', () => toggleItem(item.id));

    const checkbox = document.createElement('div');
    checkbox.className = 'checkbox';
    checkbox.innerHTML = '<i class="fa-solid fa-check"></i>';

    const text = document.createElement('span');
    text.className = 'item-text';
    text.dataset.id = item.id; // 編集時にこの要素を特定するためのID
    text.textContent = item.text;
    addDragScroll(text); // ドラッグで横スクロールできるようにする

    // テキストラッパー（名前と曜日・時間帯を縦並びにする筡）
    const textWrapper = document.createElement('div');
    textWrapper.className = 'item-text-wrapper';
    textWrapper.appendChild(text);

    if (item.days && item.days.length > 0) {
      const dayBadge = document.createElement('span');
      dayBadge.className = 'item-day';
      dayBadge.textContent = item.days.map(d => t(d)).join('・');
      textWrapper.appendChild(dayBadge); // 名前の下に曜日を表示する
    }

    // 時間帯が入力されている場合は小さなバッジとして表示する
    if (item.time) {
      const timeBadge = document.createElement('span');
      timeBadge.className = 'item-time';
      timeBadge.textContent = `⏰ ${item.time}`;
      textWrapper.appendChild(timeBadge); // 曜日のさらに下に表示する
    }

    content.appendChild(checkbox);
    content.appendChild(textWrapper);

    // 編集ボタン — ✏️ を押すと名前が入力欄に変わる
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-item-btn';
    editBtn.setAttribute('aria-label', 'edit');
    editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      startEditItem(item.id);
    });

    // Delete button — 2段階タップ（1回目→確認、2回目→削除）
    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.setAttribute('aria-label', 'delete');
    delBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    let deleteConfirmPending = false;
    let deleteConfirmTimer = null;

    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (deleteConfirmPending) {
        // 2回目：実際に削除
        clearTimeout(deleteConfirmTimer);
        deleteItem(item.id);
      } else {
        // 1回目：確認状態に
        deleteConfirmPending = true;
        delBtn.classList.add('delete-confirm');
        delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        // 2秒後に自動リセット
        deleteConfirmTimer = setTimeout(() => {
          deleteConfirmPending = false;
          delBtn.classList.remove('delete-confirm');
          delBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        }, 2000);
      }
    });

    // --- ドラッグハンドル（並べ替え用の三本線） ---
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    dragHandle.innerHTML = '<i class="fa-solid fa-bars"></i>';

    li.appendChild(content);
    li.appendChild(editBtn);
    li.appendChild(delBtn);
    li.appendChild(dragHandle); // 一番右に追加
    itemList.appendChild(li);
  });
}

function toggleItem(itemId) {
  const cat = categories.find(c => c.id === currentCategoryId);
  if (!cat) return;
  const item = cat.items.find(i => i.id === itemId);
  if (!item) return;
  item.checked = !item.checked;
  saveData();
  renderItems();
  updateProgress();
}

function deleteItem(itemId) {
  const cat = categories.find(c => c.id === currentCategoryId);
  if (!cat) return;
  cat.items = cat.items.filter(i => i.id !== itemId);
  saveData();
  renderItems();
  updateProgress();
}

// ─── Edit Item ────────────────────────────────────────────────────────────────
function startEditItem(itemId) {
  // 変更したいアイテムを探す
  const cat = categories.find(c => c.id === currentCategoryId);
  if (!cat) return;
  const item = cat.items.find(i => i.id === itemId);
  if (!item) return;

  // 編集するアイテムのIDを記録する
  editingItemId = itemId;

  // モーダルに現在の値をセットする
  editItemNameInput.value = item.text;
  editItemTimeInput.value = item.time || '';

  // 曜日チップを初期化してから、選択済みの曜日をオンにする
  editItemDaySelector.querySelectorAll('.day-chip').forEach(chip => {
    const day = chip.dataset.day;
    if (item.days && item.days.includes(day)) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });

  // モーダルを開く
  editItemModal.classList.remove('hidden');
  setTimeout(() => editItemNameInput.focus(), 100);
}

// ─── Drag Scroll ──────────────────────────────────────────────────────────────
// マウスでドラッグして横スクロールできるようにする関数
function addDragScroll(el) {
  let startX = 0;
  let scrollStart = 0;
  let isDragging = false;

  el.addEventListener('mousedown', (e) => {
    // セレクトボックス（言語選び）はブラウザの動きに任せるよ
    if (e.target.tagName === 'SELECT') return;

    startX = e.pageX;            // マウスを押した位置を記録する
    scrollStart = el.scrollLeft; // 現在のスクロール位置を記録する
    isDragging = false;
  });

  el.addEventListener('mousemove', (e) => {
    if (e.buttons !== 1) return; // マウスボタンが押されていない時は無視
    if (e.target.tagName === 'SELECT') return;

    const dx = e.pageX - startX;
    // 10px以上動いたら「スライド中」とみなすよ
    if (Math.abs(dx) > 10) isDragging = true;

    if (isDragging) {
      el.scrollLeft = scrollStart - dx;
      e.preventDefault(); // スライド中に文字が選ばれたりするのを防ぐよ
    }
  });

  // スライドしたときに、うっかりボタンを押さないように「見張り」をするよ
  el.addEventListener('click', (e) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation(); // ボタンの反応を止めるよ
      isDragging = false;
    }
  }, true); // キャプチャモードで先回りをします！
}

// ─── Add Item ─────────────────────────────────────────────────────────────────
function addItem() {
  const text = newItemInput.value.trim();
  if (!text || !currentCategoryId) return;
  const cat = categories.find(c => c.id === currentCategoryId);
  if (!cat) return;
  // 時間帯の内容も一緒に保存する
  const time = newItemTime.value.trim();
  cat.items.push({
    id: Date.now().toString(),
    text,
    checked: false,
    days: [...itemSelectedDays],
    time: time
  });
  newItemInput.value = '';
  newItemTime.value = '';
  itemSelectedDays = [];
  document.querySelectorAll('#day-selector-container .day-chip').forEach(c => c.classList.remove('active'));
  completionCelebrated = false;
  saveData();
  renderItems();
  updateProgress();
}

addBtn.addEventListener('click', addItem);
newItemInput.addEventListener('keydown', e => { if (e.key === 'Enter') addItem(); });

// ─── Day Chips (item input) ────────────────────────────────────────────────────
document.querySelectorAll('#day-selector-container .day-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const day = chip.dataset.day;
    chip.classList.toggle('active');
    if (itemSelectedDays.includes(day)) {
      itemSelectedDays = itemSelectedDays.filter(d => d !== day);
    } else {
      itemSelectedDays.push(day);
    }
  });
});

// ─── すべてチェック ───────────────────────────────────────────────────────────
checkAllBtn.addEventListener('click', () => {
  const cat = categories.find(c => c.id === currentCategoryId);
  if (!cat) return;
  // すべての持ち物を「チェック済み」に変更する
  cat.items.forEach(i => i.checked = true);
  // お祝いエフェクトが出るようにチェックをリセット
  completionCelebrated = false;
  saveData();
  renderItems();
  updateProgress();
});

// ─── Reset ────────────────────────────────────────────────────────────────────
resetBtn.addEventListener('click', () => {
  const cat = categories.find(c => c.id === currentCategoryId);
  if (!cat) return;
  cat.items.forEach(i => i.checked = false);
  completionCelebrated = false;
  saveData();
  renderItems();
  updateProgress();
});

// ─── 確認モーダルを開く共通の関数 ────────────────────────────────────────────
// title: タイトル文字、message: 説明文、onOk: OKを押したときに実行する処理
function showConfirmModal(title, message, onOk) {
  confirmModalTitle.textContent = title;
  confirmModalMessage.textContent = message;
  confirmModal.classList.remove('hidden');

  // OKボタンの動き（1回だけ反応するようにする）
  const handleOk = () => {
    confirmModal.classList.add('hidden');
    confirmOkBtn.removeEventListener('click', handleOk);
    onOk(); // 実際の削除処理を呼び出す
  };
  confirmOkBtn.addEventListener('click', handleOk);
}

// キャンセルボタンで閉じる
confirmCancelBtn.addEventListener('click', () => {
  confirmModal.classList.add('hidden');
});
// モーダルの外をタップしても閉じる
confirmModal.addEventListener('click', (e) => {
  if (e.target === confirmModal) confirmModal.classList.add('hidden');
});

// ─── チェック済みを削除 ───────────────────────────────────────────────────────
// チェックが入っているアイテムだけをまとめて消す
deleteCheckedBtn.addEventListener('click', () => {
  const cat = categories.find(c => c.id === currentCategoryId);
  if (!cat) return;
  const checkedCount = cat.items.filter(i => i.checked).length;
  if (checkedCount === 0) return; // 削除するものがなければ何もしない
  // 確認モーダルを表示する
  showConfirmModal(
    t('deleteChecked'),
    t('deleteCheckedConfirm').replace('{count}', checkedCount),
    () => {
      cat.items = cat.items.filter(i => !i.checked);
      completionCelebrated = false;
      saveData();
      renderItems();
      updateProgress();
      renderTimeFilter();
    }
  );
});

// ─── すべて削除 ───────────────────────────────────────────────────────────────
// カテゴリー内のアイテムをすべて消す（確認モーダルで確かめてから削除する）
deleteAllItemsBtn.addEventListener('click', () => {
  const cat = categories.find(c => c.id === currentCategoryId);
  if (!cat || cat.items.length === 0) return;
  // 確認モーダルを表示する
  showConfirmModal(
    t('deleteAllItems'),
    t('deleteAllConfirm').replace('{name}', cat.name).replace('{count}', cat.items.length),
    () => {
      cat.items = [];
      completionCelebrated = false;
      saveData();
      renderItems();
      updateProgress();
      renderTimeFilter();
    }
  );
});

// ─── Category Modal ───────────────────────────────────────────────────────────
function openModal(mode, catId) {
  editingCategoryId = catId || null;
  selectedIcon = '🎒';
  selectedDays = [];

  // populate icons
  iconSelector.innerHTML = '';
  ICONS.forEach(ico => {
    const opt = document.createElement('button');
    opt.type = 'button';
    opt.className = 'icon-option' + (ico === selectedIcon ? ' selected' : '');
    opt.textContent = ico;
    opt.addEventListener('click', () => {
      document.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedIcon = ico;
    });
    iconSelector.appendChild(opt);
  });

  // reset modal day chips
  modalDaySelector.querySelectorAll('.day-chip').forEach(c => c.classList.remove('active'));

  if (mode === 'edit' && catId) {
    const cat = categories.find(c => c.id === catId);
    modalTitle.textContent = t('modalTitleEdit');
    catNameInput.value = cat.name;
    selectedIcon = cat.icon;
    selectedDays = [...(cat.days || [])];

    // update icon selection
    iconSelector.querySelectorAll('.icon-option').forEach(opt => {
      if (opt.textContent === selectedIcon) opt.classList.add('selected');
      else opt.classList.remove('selected');
    });

    // update day chips
    modalDaySelector.querySelectorAll('.day-chip').forEach(c => {
      if (selectedDays.includes(c.dataset.day)) c.classList.add('active');
    });

    deleteCatBtn.classList.remove('hidden');
  } else {
    modalTitle.textContent = t('modalTitleAdd');
    catNameInput.value = '';
    deleteCatBtn.classList.add('hidden');
  }

  categoryModal.classList.remove('hidden');
  setTimeout(() => catNameInput.focus(), 100);
}

function closeModal() {
  categoryModal.classList.add('hidden');
}

addCategoryBtn.addEventListener('click', () => openModal('add'));
editCategoryBtn.addEventListener('click', () => {
  if (currentCategoryId) openModal('edit', currentCategoryId);
});
closeModalBtn.addEventListener('click', closeModal);
categoryModal.addEventListener('click', e => { if (e.target === categoryModal) closeModal(); });

// ─── QRコード共有ボタンの動き ──────────────────────────────────────────────────
// ボタンを押すと、今のアドレス（URL）を使ってQRコード画像を自動で作る
shareBtn.addEventListener('click', () => {
  const currentUrl = encodeURIComponent(window.location.href);
  qrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${currentUrl}`;
  shareModal.classList.remove('hidden');
});

// 」×「ボタンでQRコード画面を閉じる
closeShareBtn.addEventListener('click', () => {
  shareModal.classList.add('hidden');
});

// 画面の外側をタップしても閉じる
shareModal.addEventListener('click', e => {
  if (e.target === shareModal) shareModal.classList.add('hidden');
});

// Modal day chips
modalDaySelector.querySelectorAll('.day-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const day = chip.dataset.day;
    chip.classList.toggle('active');
    if (selectedDays.includes(day)) {
      selectedDays = selectedDays.filter(d => d !== day);
    } else {
      selectedDays.push(day);
    }
  });
});

saveCatBtn.addEventListener('click', () => {
  const name = catNameInput.value.trim();
  if (!name) { catNameInput.focus(); return; }

  if (editingCategoryId) {
    const cat = categories.find(c => c.id === editingCategoryId);
    cat.name = name;
    cat.icon = selectedIcon;
    cat.days = [...selectedDays];
  } else {
    const newCat = {
      id: Date.now().toString(),
      name,
      icon: selectedIcon,
      days: [...selectedDays],
      items: []
    };
    categories.push(newCat);
    currentCategoryId = newCat.id;
    completionCelebrated = false;
  }

  saveData();
  closeModal();
  renderCategories();
  renderItems();
  updateProgress();
  updateHeader();
});

deleteCatBtn.addEventListener('click', () => {
  if (!editingCategoryId) return;
  // 削除するカテゴリーの名前を取り出す
  const cat = categories.find(c => c.id === editingCategoryId);
  const catName = cat ? cat.name : 'このカテゴリー';
  // 確認モーダルを表示する
  showConfirmModal(
    'カテゴリーを削除',
    `「${catName}」を削除しますか？\n中のアイテムもすべて消えます。`,
    () => {
      categories = categories.filter(c => c.id !== editingCategoryId);
      if (currentCategoryId === editingCategoryId) {
        currentCategoryId = categories.length > 0 ? categories[0].id : null;
        completionCelebrated = false;
      }
      saveData();
      closeModal();
      renderCategories();
      renderItems();
      updateProgress();
      updateHeader();
    }
  );
});

deleteCategoryMainBtn.addEventListener('click', () => {
  if (!currentCategoryId) return;
  // 削除するカテゴリーの名前を取り出す
  const cat = categories.find(c => c.id === currentCategoryId);
  const catName = cat ? cat.name : 'このカテゴリー';
  // 確認モーダルを表示する
  showConfirmModal(
    'カテゴリーを削除',
    `「${catName}」を削除しますか？\n中のアイテムもすべて消えます。`,
    () => {
      categories = categories.filter(c => c.id !== currentCategoryId);
      currentCategoryId = categories.length > 0 ? categories[0].id : null;
      completionCelebrated = false;
      saveData();
      renderCategories();
      renderItems();
      updateProgress();
      updateHeader();
    }
  );
});

// ─── Completion Effect ────────────────────────────────────────────────────────
/**
 * 全アイテムチェック完了時に
 * 画面の四隅・周辺からパーティクルが爆発するエフェクト
 */
function triggerCompletionEffect() {
  // キャンバスを生成してbodyに追加
  const canvas = document.createElement('canvas');
  canvas.id = 'completion-canvas';
  canvas.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    pointer-events: none;
    z-index: 9999;
  `;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const W = canvas.width;
  const H = canvas.height;

  // パーティクルカラー（アプリのテーマカラー）
  const COLORS = [
    '#7c6ef5', '#f06292', '#48d3c8',
    '#ffffff', '#ffd700', '#ff6eb4',
    '#34d399', '#818cf8', '#fb923c'
  ];

  const particles = [];
  const PARTICLE_COUNT = 200;

  // 四隅 + 上下左右の中点から発射
  const origins = [
    { x: 0, y: 0 }, // 左上
    { x: W, y: 0 }, // 右上
    { x: 0, y: H }, // 左下
    { x: W, y: H }, // 右下
    { x: W / 2, y: 0 }, // 上中央
    { x: W / 2, y: H }, // 下中央
    { x: 0, y: H / 2 }, // 左中央
    { x: W, y: H / 2 }, // 右中央
  ];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const origin = origins[i % origins.length];

    // 発射角度：画面内側へ
    let baseAngle;
    if (origin.x === 0 && origin.y === 0) baseAngle = Math.PI * 0.1;  // 右下
    else if (origin.x === W && origin.y === 0) baseAngle = Math.PI * 0.6; // 左下
    else if (origin.x === 0 && origin.y === H) baseAngle = -Math.PI * 0.1;  // 右上
    else if (origin.x === W && origin.y === H) baseAngle = -Math.PI * 0.6; // 左上
    else if (origin.x === W / 2 && origin.y === 0) baseAngle = Math.PI / 2;  // 下
    else if (origin.x === W / 2 && origin.y === H) baseAngle = -Math.PI / 2; // 上
    else if (origin.x === 0 && origin.y === H / 2) baseAngle = 0;             // 右
    else baseAngle = Math.PI;       // 左

    const spread = Math.PI * 0.45; // 拡散角度
    const angle = baseAngle + (Math.random() - 0.5) * spread;
    const speed = 4 + Math.random() * 9;
    const size = 5 + Math.random() * 9;

    // 形状: 丸・正方形・星
    const shapes = ['circle', 'rect', 'star'];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];

    particles.push({
      x: origin.x,
      y: origin.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size,
      shape,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      gravity: 0.25 + Math.random() * 0.15,
      life: 1.0,
      decay: 0.012 + Math.random() * 0.012,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.08 + Math.random() * 0.08,
    });
  }

  function drawStar(ctx, cx, cy, r, pts = 5) {
    const inner = r * 0.4;
    ctx.beginPath();
    for (let k = 0; k < pts * 2; k++) {
      const a = (k * Math.PI) / pts - Math.PI / 2;
      const rad = k % 2 === 0 ? r : inner;
      if (k === 0) ctx.moveTo(cx + rad * Math.cos(a), cy + rad * Math.sin(a));
      else ctx.lineTo(cx + rad * Math.cos(a), cy + rad * Math.sin(a));
    }
    ctx.closePath();
  }

  let frame;
  function animate() {
    ctx.clearRect(0, 0, W, H);

    let alive = false;
    particles.forEach(p => {
      if (p.life <= 0) return;
      alive = true;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx += Math.sin(p.wobble) * 0.3;
      p.wobble += p.wobbleSpeed;
      p.rotation += p.rotationSpeed;
      p.life -= p.decay;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else if (p.shape === 'star') {
        drawStar(ctx, 0, 0, p.size / 2);
        ctx.fill();
      }

      ctx.restore();
    });

    if (alive) {
      frame = requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  }

  animate();

  // 5秒後に強制終了（念のため）
  setTimeout(() => {
    cancelAnimationFrame(frame);
    canvas.remove();
  }, 5000);
}

// ─── Edit Item Modal Events ───────────────────────────────────────────────────
// 曜日チップを押すたびにオン/オフを切り替える
editItemDaySelector.querySelectorAll('.day-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    chip.classList.toggle('active');
  });
});

// 「×」ボタンでモーダルを閉じる
closeEditItemBtn.addEventListener('click', () => {
  editItemModal.classList.add('hidden');
  editingItemId = null;
});

// モーダルの外をタップしても閉じる
editItemModal.addEventListener('click', (e) => {
  if (e.target === editItemModal) {
    editItemModal.classList.add('hidden');
    editingItemId = null;
  }
});

// 「保存」ボタンで変更を保存する
saveEditItemBtn.addEventListener('click', () => {
  if (!editingItemId) return;
  const cat = categories.find(c => c.id === currentCategoryId);
  if (!cat) return;
  const item = cat.items.find(i => i.id === editingItemId);
  if (!item) return;

  const newName = editItemNameInput.value.trim();
  if (!newName) { editItemNameInput.focus(); return; } // 名前が空なら保存しない

  item.text = newName;
  item.time = editItemTimeInput.value.trim();
  item.days = [];
  editItemDaySelector.querySelectorAll('.day-chip.active').forEach(chip => {
    item.days.push(chip.dataset.day); // 選択済みの曜日を全部記録する
  });

  saveData();
  editItemModal.classList.add('hidden');
  editingItemId = null;
  renderItems();
  if (viewMode === 'schedule') renderSchedule();
});

// ─── 時間入力フォーマット ─────────────────────────────────────────────────────
// 数字だけ打てるようにして、「1000」→「10:00」に自動変換する関数
function setupTimeInput(inputEl) {
  // エラーメッセージを表示するための小さな文字欄を作る
  const errorMsg = document.createElement('span');
  errorMsg.className = 'time-input-error';
  errorMsg.textContent = '⚠️ 数字だけ入力してね！';
  // 入力欄のすぐ後ろに追加する
  inputEl.parentNode.insertBefore(errorMsg, inputEl.nextSibling);

  // キーを押した瞬間にチェックする
  inputEl.addEventListener('keydown', (e) => {
    // バックスペース・Delete・矢印キー・Tabは許可する
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
    const isDigit = e.key >= '0' && e.key <= '9';

    if (!isDigit && !allowedKeys.includes(e.key)) {
      // 数字以外を打ったら入力をブロック！
      e.preventDefault();

      // すでにエラー表示中でなければ、揺れアニメーションとエラー文を出す
      if (!inputEl.classList.contains('input-error-shake')) {
        errorMsg.style.display = 'block';       // エラー文を見せる
        inputEl.classList.add('input-error-shake'); // 入力欄をぷるぷる揺らす

        // 1.5秒後にエラー表示を消す
        setTimeout(() => {
          errorMsg.style.display = 'none';
          inputEl.classList.remove('input-error-shake');
        }, 1500);
      }
    }
  });

  // 文字が入力されるたびに「1000」→「10:00」の形に整える
  inputEl.addEventListener('input', () => {
    // コロン（:）などを取り除いて、数字だけ取り出す
    const digits = inputEl.value.replace(/\D/g, '');

    // 最大4桁までにする（例：「12345」→「1234」）
    const capped = digits.slice(0, 4);

    if (capped.length <= 2) {
      // 1〜2桁のときはそのまま表示（例：「10」）
      inputEl.value = capped;
    } else {
      // 3〜4桁のときは後ろ2桁を「分」にして、コロンを自動挿入
      // 例：「1000」→ 時間「10」+ 分「00」→「10:00」
      const hours = capped.slice(0, capped.length - 2);
      const minutes = capped.slice(-2);
      inputEl.value = `${hours}:${minutes}`;
    }
  });

  // 入力欄から離れたとき（打ち終わったとき）に補完 + 正しい範囲かチェックする
  inputEl.addEventListener('blur', () => {
    const digits = inputEl.value.replace(/\D/g, ''); // 数字だけ取り出す

    if (digits.length === 0) return; // 空のときは何もしない

    // 1〜2桁だけのときは「:00」を自動でつける（例：「10」→「10:00」）
    if (digits.length <= 2) {
      inputEl.value = `${digits}:00`;
    }

    // ── 正しい範囲かチェックする ──────────────────────────
    // コロンで「時」と「分」に分ける
    const parts = inputEl.value.split(':');
    const h = parseInt(parts[0], 10); // 時の数字
    const m = parseInt(parts[1], 10); // 分の数字

    // 時は 0〜23、分は 0〜59 じゃないとおかしい！
    const isInvalid = h > 23 || m > 59;

    if (isInvalid) {
      // エラーメッセージを表示する
      errorMsg.textContent = `⚠️ 正しい時間を入れてね！（例: 8:00, 23:30）`;
      errorMsg.style.display = 'block';
      inputEl.classList.add('input-error-shake'); // ぷるぷる揺らす
      inputEl.value = ''; // おかしい値は消す

      // 1.5秒後にエラーを隠す
      setTimeout(() => {
        errorMsg.style.display = 'none';
        inputEl.classList.remove('input-error-shake');
      }, 1500);
    }
  });
}

// ─── 並べ替え（ドラッグ＆ドロップ）機能 ───────────────────────────────────────────
/**
 * 並べ替え機能を有効にするための共通関数
 * @param {HTMLElement} container 並べ替えたいアイテムが入っている親要素
 * @param {string} selector 並べ替え対象のアイテムを示すCSSセレクタ
 * @param {function} onOrderChange 順序が変わったときに呼ばれる関数（新しい順序のIDリストを渡す）
 * @param {string} direction 'vertical' または 'horizontal'
 */
function setupSortable(container, selector, onOrderChange, direction = 'vertical', handleSelector = null) {
  let dragEl = null;
  let ghostEl = null;
  let placeholder = null;
  let longPressTimer = null;
  let isSorting = false;
  let startX = 0;
  let startY = 0;
  let lastPoint = { clientX: 0, clientY: 0 };
  let scrollInterval = null;

  // 自動スクロールのための「スクロール可能な親要素」を探す
  const getScrollParent = (el) => {
    let parent = el.parentElement;
    while (parent) {
      const style = window.getComputedStyle(parent);
      if (direction === 'vertical' && (style.overflowY === 'auto' || style.overflowY === 'scroll' || parent.tagName === 'MAIN')) return parent;
      if (direction === 'horizontal' && (style.overflowX === 'auto' || style.overflowX === 'scroll')) return parent;
      if (parent.tagName === 'MAIN' || parent.tagName === 'BODY') return parent;
      parent = parent.parentElement;
    }
    return window;
  };

  const scrollParent = getScrollParent(container);

  const handleStart = (e) => {
    const target = e.target.closest(selector);
    if (!target) return;
    if (e.target.closest('button') && e.target.closest('button') !== target) return;

    const point = e.touches ? e.touches[0] : e;
    startX = point.clientX;
    startY = point.clientY;
    dragEl = target;

    longPressTimer = setTimeout(() => {
      startSort(point);
    }, 600);

    const handleCancel = () => {
      clearTimeout(longPressTimer);
      window.removeEventListener('pointermove', handleMoveCheck);
      window.removeEventListener('pointerup', handleCancel);
    };

    const handleMoveCheck = (me) => {
      const mp = me.touches ? me.touches[0] : me;
      if (Math.abs(mp.clientX - startX) > 10 || Math.abs(mp.clientY - startY) > 10) {
        handleCancel();
      }
    };

    window.addEventListener('pointermove', handleMoveCheck);
    window.addEventListener('pointerup', handleCancel);
  };

  const startSort = (point) => {
    isSorting = true;
    lastPoint = { clientX: point.clientX, clientY: point.clientY };

    if (window.navigator.vibrate) window.navigator.vibrate(40);
    dragEl.classList.add('is-sorting');

    ghostEl = dragEl.cloneNode(true);
    ghostEl.classList.add('drag-ghost');
    const rect = dragEl.getBoundingClientRect();
    ghostEl.style.width = rect.width + 'px';
    ghostEl.style.height = rect.height + 'px';
    document.body.appendChild(ghostEl);

    placeholder = document.createElement('div');
    placeholder.className = 'drag-placeholder';
    placeholder.style.width = rect.width + 'px';
    placeholder.style.height = rect.height + 'px';
    dragEl.parentNode.insertBefore(placeholder, dragEl);
    dragEl.style.display = 'none';

    updateGhostPosition(point);

    // 自動スクロールのループ開始
    startAutoScroll();

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const startAutoScroll = () => {
    const threshold = 70; // 端から何pxでスクロール開始するか
    const speed = 10;     // スクロール速度

    scrollInterval = setInterval(() => {
      if (!isSorting) return;

      const rect = scrollParent === window
        ? { top: 0, left: 0, bottom: window.innerHeight, right: window.innerWidth }
        : scrollParent.getBoundingClientRect();

      if (direction === 'vertical') {
        if (lastPoint.clientY < rect.top + threshold) {
          scrollParent.scrollTop -= speed;
        } else if (lastPoint.clientY > rect.bottom - threshold) {
          scrollParent.scrollTop += speed;
        }
      } else {
        if (lastPoint.clientX < rect.left + threshold) {
          scrollParent.scrollLeft -= speed;
        } else if (lastPoint.clientX > rect.right - threshold) {
          scrollParent.scrollLeft += speed;
        }
      }
    }, 16); // 約60fps
  };

  const updateGhostPosition = (point) => {
    ghostEl.style.left = point.clientX - (parseFloat(ghostEl.style.width) / 2) + 'px';
    ghostEl.style.top = point.clientY - (parseFloat(ghostEl.style.height) / 2) + 'px';
  };

  const onPointerMove = (e) => {
    if (!isSorting) return;
    const point = e.touches ? e.touches[0] : e;
    lastPoint = { clientX: point.clientX, clientY: point.clientY };
    updateGhostPosition(point);

    const siblings = [...container.querySelectorAll(`${selector}:not(.is-sorting)`)];
    const nextEl = siblings.find(sib => {
      const r = sib.getBoundingClientRect();
      return direction === 'vertical'
        ? point.clientY < r.top + r.height / 2
        : point.clientX < r.left + r.width / 2;
    });

    if (nextEl) {
      container.insertBefore(placeholder, nextEl);
    } else {
      container.appendChild(placeholder);
    }
  };

  const onPointerUp = () => {
    if (!isSorting) return;
    isSorting = false;
    clearInterval(scrollInterval);

    placeholder.parentNode.insertBefore(dragEl, placeholder);
    dragEl.style.display = '';
    dragEl.classList.remove('is-sorting');

    ghostEl.remove();
    placeholder.remove();
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);

    const newOrderIds = [...container.querySelectorAll(selector)].map(el => el.dataset.id);
    onOrderChange(newOrderIds);
  };

  container.addEventListener('pointerdown', handleStart);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
function init() {
  initTheme();
  applyTranslations();
  updateDateDisplay();
  // 時計を起動して、1秒ごとに時刻を更新する
  updateClock();
  setInterval(updateClock, 1000);

  // 時間入力欄の自動フォーマット機能を両方の欄に設定する
  setupTimeInput(newItemTime);        // アイテム追加画面の時間欄
  setupTimeInput(editItemTimeInput);  // アイテム編集画面の時間欄

  // 時間帯絞り込みバーをマウスでドラッグして横スクロールできるようにする
  addDragScroll(timeFilterContainer);
  // 上部のボタンエリアもドラッグしてスライドできるようにする
  addDragScroll(modeToggle);

  if (categories.length > 0 && !currentCategoryId) {
    currentCategoryId = categories[0].id;
  }

  updateViewMode();
  updateHeader();

  // カテゴリーの並べ替えを有効にする
  setupSortable(categorySelector, '.category-btn', (newIds) => {
    const sorted = newIds.map(id => categories.find(c => c.id === id));
    categories = sorted;
    saveData();
    // renderCategories(); // これを呼ぶとスクロールが戻るので注意が必要ですが、順序確定時は必要
  }, 'horizontal');

  // アイテムの並べ替えを有効にする
  // 第5引数にハンドルセレクタを指定
  setupSortable(itemList, '.item-card', (newIds) => {
    const cat = categories.find(c => c.id === currentCategoryId);
    if (!cat) return;
    // 表示されているものだけでなく、全アイテムの順序を更新する
    const sorted = newIds.map(id => cat.items.find(i => i.id === id));
    const remaining = cat.items.filter(item => !newIds.includes(item.id));
    cat.items = [...sorted, ...remaining];
    saveData();
    updateProgress();
  }, 'vertical', '.drag-handle');

  // ビューの切り替え
  viewCategoryTab.addEventListener('click', () => {
    viewMode = 'category';
    updateViewMode();
  });

  viewScheduleTab.addEventListener('click', () => {
    viewMode = 'schedule';
    updateViewMode();
  });
}

function updateViewMode() {
  if (viewMode === 'category') {
    viewCategoryTab.classList.add('active');
    viewScheduleTab.classList.remove('active');
    
    categoryWrapper.classList.remove('hidden');
    categoryHeader.classList.remove('hidden');
    progressContainer.classList.remove('hidden');
    inputArea.classList.remove('hidden');
    actionsArea.classList.remove('hidden');
    itemList.classList.remove('hidden');
    timeFilterContainer.classList.remove('hidden');
    
    scheduleView.classList.add('hidden');
    
    renderCategories();
    renderItems();
    updateProgress();
    renderTimeFilter();
  } else {
    viewCategoryTab.classList.remove('active');
    viewScheduleTab.classList.add('active');
    
    categoryWrapper.classList.add('hidden');
    categoryHeader.classList.add('hidden');
    progressContainer.classList.add('hidden');
    inputArea.classList.add('hidden');
    actionsArea.classList.add('hidden');
    itemList.classList.add('hidden');
    timeFilterContainer.classList.add('hidden');
    
    scheduleView.classList.remove('hidden');
    renderSchedule();
  }
}

function renderSchedule() {
  scheduleGrid.innerHTML = '';
  
  // 各曜日のカードを作る（月〜日）
  const weekDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  
  weekDays.forEach(dayKey => {
    const dayCard = document.createElement('div');
    dayCard.className = 'day-card';
    dayCard.dataset.day = dayKey;
    
    const dayHeader = document.createElement('div');
    dayHeader.className = 'day-header';
    
    const dayTitle = document.createElement('div');
    dayTitle.className = 'day-title';
    
    const dayName = document.createElement('span');
    dayName.className = 'day-name';
    dayName.textContent = t(dayKey); // i18nから曜日名を取得
    
    const dayLabel = document.createElement('span');
    dayLabel.className = 'day-label';
    dayLabel.textContent = t(dayKey + 'Short'); // 月, 火 などの短い形式
    
    dayTitle.appendChild(dayName);
    dayTitle.appendChild(dayLabel);
    dayHeader.appendChild(dayTitle);
    dayCard.appendChild(dayHeader);
    
    const itemsList = document.createElement('ul');
    itemsList.className = 'day-items-list';
    
    // 全カテゴリーからこの曜日のアイテムを探す
    let dayItems = [];
    categories.forEach(cat => {
      cat.items.forEach(item => {
        if (item.days && item.days.includes(dayKey)) {
          dayItems.push({ ...item, categoryIcon: cat.icon });
        }
      });
    });
    
    // 時間順に並べ替える
    dayItems.sort((a, b) => {
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
    
    if (dayItems.length === 0) {
      const placeholder = document.createElement('li');
      placeholder.className = 'no-items-placeholder';
      placeholder.textContent = t('noItemsForDay');
      itemsList.appendChild(placeholder);
    } else {
      dayItems.forEach(item => {
        const li = document.createElement('li');
        li.className = 'day-item' + (item.checked ? ' checked' : '');
        
        const content = document.createElement('div');
        content.className = 'day-item-content';
        
        const icon = document.createElement('span');
        icon.className = 'day-item-icon';
        icon.textContent = item.categoryIcon;
        
        const textWrapper = document.createElement('div');
        textWrapper.className = 'item-text-wrapper';
        
        const name = document.createElement('span');
        name.className = 'day-item-name';
        name.textContent = item.text;
        
        textWrapper.appendChild(name);
        
        if (item.time) {
          const time = document.createElement('span');
          time.className = 'day-item-time';
          time.textContent = `⏰ ${item.time}`;
          textWrapper.appendChild(time);
        }
        
        content.appendChild(icon);
        content.appendChild(textWrapper);
        
        const check = document.createElement('div');
        check.className = 'day-item-check';
        check.innerHTML = '<i class="fa-solid fa-check"></i>';
        
        li.appendChild(content);
        li.appendChild(check);
        
        li.addEventListener('click', () => {
          toggleDayItem(item.id);
        });
        
        itemsList.appendChild(li);
      });
    }
    
    dayCard.appendChild(itemsList);
    scheduleGrid.appendChild(dayCard);
  });
}

function refreshCurrentView() {
  if (viewMode === 'category') {
    renderItems();
    updateProgress();
    renderTimeFilter();
    updateHeader();
  } else {
    renderSchedule();
  }
}

function toggleDayItem(itemId) {
  // 全カテゴリーの中から対象のアイテムを探してトグルする
  categories.forEach(cat => {
    const item = cat.items.find(i => i.id === itemId);
    if (item) {
      item.checked = !item.checked;
    }
  });
  
  saveData();
  refreshCurrentView();
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registered', reg))
      .catch(err => console.log('Service Worker registration failed', err));
  });
}

init();
