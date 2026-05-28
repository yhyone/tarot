/* ============================================
   塔罗牌占卜 - 主逻辑
   ============================================ */

// ---------- 全局状态 ----------
const state = {
  spread: null,           // 'single' | 'three'
  drawMode: null,         // 'random' | 'selfpick'
  categories: [],         // ['career', 'love', 'health']
  question: '',
  drawnCards: [],         // 最终选中的牌
  selfPickPool: [],       // 自选模式下展示的6张牌
  selectedIndices: [],    // 自选模式下用户选中的索引
};

// ---------- 牌阵配置 ----------
const spreadConfig = {
  single: {
    name: '单张牌',
    positions: ['核心指引'],
    count: 1,
  },
  three: {
    name: '三张牌（过去·现在·未来）',
    positions: ['过去', '现在', '未来'],
    count: 3,
  },
};

const categoryLabels = { career: '事业', love: '婚姻/爱情', health: '健康' };
const suitLabels = { wands: '权杖', cups: '圣杯', swords: '宝剑', pentacles: '星币' };

// ---------- 辅助 ----------
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getCardImagePath(card) {
  return 'cards/' + card.id + '.jpg';
}

// ---------- 步骤导航 ----------
function goToStep(stepId) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.getElementById(stepId).classList.add('active');

  const stepMap = { 'step-spread': 1, 'step-draw': 2, 'step-category': 3, 'step-result': 4 };
  const currentStep = stepMap[stepId] || 1;
  document.querySelectorAll('.step-dot').forEach(dot => {
    const s = parseInt(dot.dataset.step);
    dot.classList.remove('active', 'done');
    if (s < currentStep) dot.classList.add('done');
    if (s === currentStep) dot.classList.add('active');
  });
  document.querySelectorAll('.step-line').forEach((line, i) => {
    line.classList.toggle('done', i < currentStep - 1);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------- 步骤1：选择牌阵 + 抽牌方式 ----------
function initSpreadSelection() {
  const cards = document.querySelectorAll('.spread-card');
  const spreadList = document.getElementById('spread-cards-list');
  const drawModeSection = document.getElementById('draw-mode-section');
  const spreadActions = document.getElementById('spread-actions');
  const btnToDraw = document.getElementById('btn-to-draw');

  function showDrawMode() {
    spreadList.style.display = 'none';
    drawModeSection.style.display = 'block';
    spreadActions.style.display = 'flex';
  }

  function showSpreads() {
    spreadList.style.display = '';
    drawModeSection.style.display = 'none';
    spreadActions.style.display = 'none';
    document.querySelector('input[name="drawMode"]:checked').checked = false;
  }

  document.getElementById('btn-back-to-spreads').addEventListener('click', showSpreads);

  cards.forEach(card => {
    card.addEventListener('click', function(e) {
      if (e.target.closest('.btn')) return;
      cards.forEach(c => c.classList.remove('selected'));
      this.classList.add('selected');
      state.spread = this.dataset.spread;
      showDrawMode();
    });
  });

  document.querySelectorAll('.btn-outline[data-spread]').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      state.spread = this.dataset.spread;
      cards.forEach(c => c.classList.remove('selected'));
      const card = document.querySelector(`.spread-card[data-spread="${state.spread}"]`);
      if (card) card.classList.add('selected');
      showDrawMode();
    });
  });

  btnToDraw.addEventListener('click', () => {
    const modeInput = document.querySelector('input[name="drawMode"]:checked');
    if (!modeInput) {
      alert('请选择抽牌方式：随机抽取 或 自选牌');
      return;
    }
    state.drawMode = modeInput.value;
    initDraw();
    goToStep('step-draw');
  });
}

// ---------- 步骤3：解读方向和问题 ----------
function initCategoryStep() {
  document.getElementById('btn-back-draw').addEventListener('click', () => {
    goToStep('step-draw');
  });

  const input = document.getElementById('question-input');
  document.getElementById('char-count').textContent = input.value.length;
  input.addEventListener('input', function() {
    document.getElementById('char-count').textContent = this.value.length;
  });

  document.getElementById('btn-show-result').addEventListener('click', () => {
    const checked = document.querySelectorAll('input[name="category"]:checked');
    state.categories = Array.from(checked).map(cb => cb.value);
    if (state.categories.length === 0) {
      alert('请至少选择一个解读方向（事业、爱情或健康）');
      return;
    }
    state.question = input.value.trim();
    if (!state.question) {
      alert('请写下你的具体问题，这样解读才能更有针对性。如果实在没有具体问题，请至少写一句你想了解的方向。');
      return;
    }
    showResults();
    goToStep('step-result');
  });
}

// ---------- 步骤3：抽牌 ----------
function initDraw() {
  const config = spreadConfig[state.spread];
  // 清理
  state.drawnCards = [];
  state.selfPickPool = [];
  state.selectedIndices = [];

  if (state.drawMode === 'random') {
    initRandomDraw(config);
  } else {
    initSelfPickDraw(config);
  }
}

// --- 随机模式 ---
function initRandomDraw(config) {
  state.drawnCards = shuffle(TAROT_DECK).slice(0, config.count);

  const hintText = config.count === 1 ? '点击牌背翻牌' : '点击任意牌背，一次翻开全部';
  document.getElementById('draw-title').textContent = `请抽取塔罗牌 (${config.name})`;
  document.getElementById('draw-pos-desc').textContent = hintText;

  const drawArea = document.getElementById('draw-area');
  drawArea.innerHTML = '';
  drawArea.className = 'draw-grid ' + state.spread;

  config.positions.forEach((pos, i) => {
    const div = document.createElement('div');
    div.className = 'tarot-card';
    div.dataset.index = i;
    div.innerHTML = `
      <div class="tarot-card-inner">
        <div class="tarot-card-back">
          <div class="tarot-card-back-inner">
            <span class="card-back-star">✦</span>
            <span class="card-back-text">${config.count === 1 ? '点 击 翻 牌' : '点 击 揭 晓'}</span>
          </div>
        </div>
        <div class="tarot-card-front">
          <div class="card-placeholder">?</div>
        </div>
      </div>
      <p class="draw-position-label">${pos}</p>
    `;

    div.addEventListener('click', function() {
      if (this.classList.contains('flipped')) return;
      if (config.count === 1) {
        flipRandomCard(this, i);
      } else {
        flipAllCards();
      }
    });

    drawArea.appendChild(div);
  });

  document.getElementById('draw-actions').style.display = 'none';
  document.getElementById('btn-redraw').onclick = () => initDraw();
  document.getElementById('btn-view-result').onclick = () => {
    goToStep('step-category');
  };
}

function setCardFace(frontEl, card) {
  frontEl.innerHTML = '';
  const imgPath = getCardImagePath(card);
  const img = document.createElement('img');
  img.src = imgPath;
  img.alt = card.nameCN;
  img.loading = 'lazy';
  img.onerror = function() {
    const placeholder = document.createElement('div');
    placeholder.className = 'card-placeholder';
    placeholder.textContent = card.nameCN;
    frontEl.innerHTML = '';
    frontEl.appendChild(placeholder);
  };
  frontEl.appendChild(img);
}

function flipRandomCard(el, index) {
  const card = state.drawnCards[index];
  el.classList.add('flipped');
  setCardFace(el.querySelector('.tarot-card-front'), card);
  el.querySelector('.draw-position-label').textContent += ` — ${card.nameCN}`;

  const flippedCount = document.querySelectorAll('#draw-area .tarot-card.flipped').length;
  if (flippedCount >= spreadConfig[state.spread].count) {
    document.getElementById('draw-actions').style.display = 'flex';
    document.getElementById('draw-pos-desc').textContent = '全部牌已抽取完毕';
  }
}

function flipAllCards() {
  const cards = document.querySelectorAll('#draw-area .tarot-card');
  const delay = 80;

  cards.forEach((el, i) => {
    setTimeout(() => {
      el.classList.add('flipped');
      setCardFace(el.querySelector('.tarot-card-front'), state.drawnCards[i]);
      el.querySelector('.draw-position-label').textContent += ` — ${state.drawnCards[i].nameCN}`;
    }, i * delay);
  });

  const totalDelay = (cards.length - 1) * delay + 700;
  setTimeout(() => {
    document.getElementById('draw-actions').style.display = 'flex';
    document.getElementById('draw-pos-desc').textContent = '全部牌已抽取完毕';
  }, totalDelay);
}

// --- 自选模式 ---
function initSelfPickDraw(config) {
  state.selfPickPool = shuffle(TAROT_DECK).slice(0, 6);
  state.selectedIndices = [];

  document.getElementById('draw-title').textContent = `凭直觉选择你的牌 (${config.name})`;
  document.getElementById('draw-pos-desc').textContent =
    config.count === 1
      ? '6张牌已展开，请凭直觉选出最吸引你的 1 张'
      : '6张牌已展开，请凭直觉依次选出吸引你的 3 张（第1张=过去，第2张=现在，第3张=未来）';

  const drawArea = document.getElementById('draw-area');
  drawArea.innerHTML = '';
  drawArea.className = 'draw-grid selfpick';

  for (let i = 0; i < 6; i++) {
    const card = state.selfPickPool[i];
    const imgPath = getCardImagePath(card);

    const div = document.createElement('div');
    div.className = 'tarot-card pickable face-up';
    div.dataset.poolIndex = i;

    const frontVisible = document.createElement('div');
    frontVisible.className = 'tarot-card-front-visible';

    const img = document.createElement('img');
    img.src = imgPath;
    img.alt = card.nameCN;
    img.loading = 'lazy';
    img.onerror = function() {
      const placeholder = document.createElement('div');
      placeholder.className = 'card-placeholder';
      placeholder.innerHTML = '<span>' + card.nameCN + '</span>';
      frontVisible.innerHTML = '';
      frontVisible.appendChild(placeholder);
    };
    frontVisible.appendChild(img);

    const checkMark = document.createElement('div');
    checkMark.className = 'pick-check-mark';
    checkMark.textContent = '✓';
    frontVisible.appendChild(checkMark);

    div.appendChild(frontVisible);

    div.addEventListener('click', function() {
      togglePick(this, i, config);
    });

    drawArea.appendChild(div);
  }

  // 确认按钮区域
  let confirmArea = document.getElementById('pick-confirm-area');
  if (!confirmArea) {
    confirmArea = document.createElement('div');
    confirmArea.id = 'pick-confirm-area';
    confirmArea.className = 'step-actions';
    confirmArea.innerHTML = '<button class="btn btn-primary" id="pick-confirm-btn" style="display:none">确认选择 →</button>';
    drawArea.after(confirmArea);
  } else {
    confirmArea.style.display = 'block';
    confirmArea.querySelector('#pick-confirm-btn').style.display = 'none';
  }

  document.getElementById('pick-confirm-btn').onclick = () => {
    confirmSelfPick(config);
  };

  document.getElementById('draw-actions').style.display = 'none';
  document.getElementById('btn-redraw').onclick = () => initDraw();
  document.getElementById('btn-view-result').onclick = () => {
    goToStep('step-category');
  };
}

function togglePick(el, poolIndex, config) {
  const idx = state.selectedIndices.indexOf(poolIndex);
  if (idx >= 0) {
    state.selectedIndices.splice(idx, 1);
    el.classList.remove('picked');
    // 更新剩余选中牌的序号标记
    updatePickOrderMarks();
  } else {
    if (state.selectedIndices.length >= config.count) {
      const removedIdx = state.selectedIndices.shift();
      document.querySelector(`.tarot-card[data-pool-index="${removedIdx}"]`).classList.remove('picked');
    }
    state.selectedIndices.push(poolIndex);
    el.classList.add('picked');
    updatePickOrderMarks();
  }

  const confirmBtn = document.getElementById('pick-confirm-btn');
  confirmBtn.style.display = state.selectedIndices.length === config.count ? 'inline-flex' : 'none';
}

function updatePickOrderMarks() {
  // 移除所有序号标记
  document.querySelectorAll('.pick-order-badge').forEach(b => b.remove());
  // 为选中的牌添加序号
  state.selectedIndices.forEach((poolIndex, order) => {
    const el = document.querySelector(`.tarot-card[data-pool-index="${poolIndex}"]`);
    const badge = document.createElement('span');
    badge.className = 'pick-order-badge';
    badge.textContent = order + 1;
    el.appendChild(badge);
  });
}

function confirmSelfPick(config) {
  state.drawnCards = state.selectedIndices.map(i => state.selfPickPool[i]);

  // 未选中的牌变暗
  document.querySelectorAll('#draw-area .tarot-card.pickable').forEach(el => {
    const poolIndex = parseInt(el.dataset.poolIndex);
    if (!state.selectedIndices.includes(poolIndex)) {
      el.style.opacity = '0.2';
      el.style.pointerEvents = 'none';
      el.style.transform = 'scale(0.95)';
    }
  });

  // 为选中的牌添加位置标签
  state.selectedIndices.forEach((poolIndex, selectionOrder) => {
    const el = document.querySelector(`.tarot-card[data-pool-index="${poolIndex}"]`);
    const card = state.selfPickPool[poolIndex];
    const pos = config.positions[selectionOrder];

    let label = el.querySelector('.draw-position-label');
    if (!label) {
      label = document.createElement('p');
      label.className = 'draw-position-label';
      el.appendChild(label);
    }
    label.textContent = `${pos} — ${card.nameCN}`;
    label.style.color = 'var(--accent-strong)';
    label.style.fontWeight = '600';

    // 更新选中标记为位置标签
    const badge = el.querySelector('.pick-order-badge');
    if (badge) badge.remove();
  });

  document.getElementById('pick-confirm-btn').style.display = 'none';
  document.getElementById('pick-confirm-area').style.display = 'none';
  document.getElementById('draw-actions').style.display = 'flex';
  document.getElementById('draw-pos-desc').textContent = '你选的牌已确认';
}

// ---------- 步骤4：结果展示 ----------
function showResults() {
  try {
    const config = spreadConfig[state.spread];
    if (!config || !state.drawnCards || state.drawnCards.length === 0) {
      console.error('showResults: 缺少牌阵配置或抽牌数据', state);
      alert('出错了，请返回重新抽牌');
      return;
    }

    document.getElementById('result-spread-name').textContent =
      `牌阵：${config.name}  |  模式：${state.drawMode === 'random' ? '随机抽取' : '自选牌'}  |  解读方向：${state.categories.map(c => categoryLabels[c]).join('、')}`;

    const container = document.getElementById('result-container');
    container.innerHTML = '';

    // 三张牌：先展示综合解读
    const summaryDiv = document.getElementById('result-summary');
    if (config.count === 3) {
      summaryDiv.style.display = 'block';
      summaryDiv.innerHTML = buildSpreadSummary(state.drawnCards, config.positions, state.question, state.categories);
    } else {
      summaryDiv.style.display = 'none';
    }

    // 用文档片段批量构建，避免多次innerHTML
    const fragment = document.createDocumentFragment();

    state.drawnCards.forEach((card, i) => {
      const pos = config.positions[i] || '';
      const imgPath = getCardImagePath(card);
      const suitText = card.suit ? ' · ' + (suitLabels[card.suit] || '') : '';

      // 构建body HTML
      const bodyParts = [];
      bodyParts.push('<h4>牌意概述</h4><p>' + card.meaning + '</p>');

      if (state.categories.includes('career')) {
        bodyParts.push('<h4>💼 事业解读</h4><p>' + card.career + '</p>');
      }
      if (state.categories.includes('love')) {
        bodyParts.push('<h4>💕 婚姻/爱情解读</h4><p>' + card.love + '</p>');
      }
      if (state.categories.includes('health')) {
        bodyParts.push('<h4>🌿 健康解读</h4><p>' + card.health + '</p>');
      }

      bodyParts.push(buildCardAdvice(card, pos, state.question, state.categories));

      const bodyHTML = bodyParts.join('');

      // 构建关键词标签
      const keywordTags = (card.keywords || []).map(k => '<span class="keyword-tag">' + k + '</span>').join('');

      const cardDiv = document.createElement('div');
      cardDiv.className = 'result-card';
      cardDiv.innerHTML =
        '<div class="result-card-img-large" onclick="openCardModal(\'' + imgPath + '\')">' +
          '<img src="' + imgPath + '" alt="' + card.nameCN + '" loading="lazy" onerror="this.style.display=\'none\'">' +
        '</div>' +
        '<div class="result-card-header">' +
          '<div class="result-card-title">' +
            '<span class="result-position">' + pos + '</span>' +
            '<h3 class="result-card-name">' + card.nameCN + '</h3>' +
            '<p style="color:var(--muted);font-size:0.85rem;">' + card.nameEN + suitText + '</p>' +
            '<div class="result-card-keywords">' + keywordTags + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="result-card-body">' + bodyHTML + '</div>';

      fragment.appendChild(cardDiv);
    });

    container.appendChild(fragment);

    document.getElementById('btn-redraw-result').onclick = function() {
      initDraw();
      goToStep('step-draw');
    };
    document.getElementById('btn-restart').onclick = resetAll;
  } catch (e) {
    console.error('showResults error:', e.message, e.stack);
    alert('解读生成出错，请返回重新抽牌再试一次。');
  }
}

// ---------- 综合解读（三张牌） ----------
function buildSpreadSummary(cards, positions, question, categories) {
  var pastCard = cards[0], nowCard = cards[1], futureCard = cards[2];
  var catText = categories.map(function(c) { return categoryLabels[c]; }).join('和');
  var q = question || '';

  var html = '<h3>三牌综合解读</h3>';
  html += '<p>你问的是：「<strong>' + q + '</strong>」。三张牌从过去、现在、未来三个维度，共同描绘了关于这个问题的完整图景。</p>';

  // 故事脉络
  html += '<p style="margin-top:0.8rem;"><strong>故事的脉络：</strong>';
  html += '过去的「' + pastCard.nameCN + '」（' + (pastCard.keywords[0] || '') + '）为起点，';
  html += '到了现在，「' + nowCard.nameCN + '」（' + (nowCard.keywords[0] || '') + '）正在主导你的处境，';
  html += '未来的「' + futureCard.nameCN + '」（' + (futureCard.keywords[0] || '') + '）则指明了方向。</p>';

  // 三张牌之间的关联
  html += '<p>' + buildStoryline(pastCard, nowCard, futureCard) + '</p>';

  // 行动建议
  html += '<p style="margin-top:0.8rem;"><strong>给你的行动建议：</strong></p>';
  html += '<ol style="padding-left:1.2rem;line-height:2;">';
  html += buildActionItems(pastCard, nowCard, futureCard, q, categories);
  html += '</ol>';

  return html;
}

function buildStoryline(past, now, future) {
  var pkw = past.keywords[0] || '';
  var nkw = now.keywords[0] || '';
  var fkw = future.keywords[0] || '';

  var sharedPN = past.keywords.filter(function(k) {
    return now.keywords.some(function(tk) { return tk.indexOf(k) >= 0 || k.indexOf(tk) >= 0; });
  });
  var sharedNF = now.keywords.filter(function(k) {
    return future.keywords.some(function(tk) { return tk.indexOf(k) >= 0 || k.indexOf(tk) >= 0; });
  });

  var parts = [];
  if (sharedPN.length > 0) {
    parts.push('「' + past.nameCN + '」和「' + now.nameCN + '」通过「' + sharedPN[0] + '」这一共同主题串联起来——过去的影响仍在当下延续。');
  } else {
    parts.push('从「' + past.nameCN + '」到「' + now.nameCN + '」的转变，说明你已经走过了' + pkw + '的阶段，正进入' + nkw + '的新局面。');
  }

  if (sharedNF.length > 0) {
    parts.push('「' + now.nameCN + '」与「' + future.nameCN + '」共享「' + sharedNF[0] + '」的信号，当下的选择将直接影响未来的结果。');
  } else {
    parts.push('「' + now.nameCN + '」指向「' + future.nameCN + '」的趋势表明，' + nkw + '的状态将逐步发展为' + fkw + '的方向。');
  }

  return parts.join('');
}

function buildActionItems(past, now, future, question, categories) {
  var items = '';
  var cat = (categories && categories[0]) ? categories[0] : 'career';

  items += '<li><strong>回顾过去：</strong>' + getAdviceSnippet(past, cat) + '</li>';
  items += '<li><strong>把握当下：</strong>' + getAdviceSnippet(now, cat) + '</li>';
  items += '<li><strong>迎接未来：</strong>' + getAdviceSnippet(future, cat) + '</li>';

  return items;
}

function getAdviceSnippet(card, category) {
  var text = '';
  if (category === 'career') text = card.career || '';
  else if (category === 'love') text = card.love || '';
  else if (category === 'health') text = card.health || '';
  else text = card.meaning || '';

  // 取解读的第一句（到第一个句号）作为摘要
  var idx = text.indexOf('。');
  if (idx > 0) return text.substring(0, idx + 1);
  return text.substring(0, 80);
}

// ---------- 单张牌专属建议 ----------
function buildCardAdvice(card, position, question, categories) {
  var html = '<div class="advice-box"><h4>针对你的问题</h4>';

  var q = question || '';
  var posLabel = position || '核心指引';

  html += '<p style="color:var(--muted);font-size:0.85rem;margin-bottom:0.6rem;">「' + card.nameCN + '」在「' + posLabel + '」的位置，结合你的问题「' + q + '」来看：</p>';

  for (var i = 0; i < categories.length; i++) {
    var cat = categories[i];
    var catName = categoryLabels[cat] || cat;
    var text = '';
    if (cat === 'career') text = card.career || '';
    else if (cat === 'love') text = card.love || '';
    else if (cat === 'health') text = card.health || '';

    // 取解读的第一句话作为核心建议
    var dot = text.indexOf('。');
    var snippet = dot > 0 ? text.substring(0, dot + 1) : text.substring(0, 80);

    html += '<p style="margin-top:0.5rem;"><strong>「' + catName + '」角度：</strong>' + snippet + '</p>';
  }

  html += '<p style="margin-top:0.5rem;color:var(--accent-strong);"><strong>行动提示：</strong>从今天开始，把这张牌的指引融入你的日常生活中。问自己：如果' + card.nameCN + '的能量站在我这边，我会做出怎样不同的选择？</p>';

  html += '</div>';
  return html;
}

// ---------- 重置 ----------
function resetAll() {
  state.spread = null;
  state.drawMode = null;
  state.categories = [];
  state.question = '';
  state.drawnCards = [];
  state.selfPickPool = [];
  state.selectedIndices = [];

  document.getElementById('question-input').value = '';
  document.getElementById('char-count').textContent = '0';
  document.querySelectorAll('input[name="category"]:checked').forEach(cb => cb.checked = false);
  document.querySelectorAll('input[name="drawMode"]:checked').forEach(r => r.checked = false);
  document.querySelectorAll('.spread-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('draw-mode-section').style.display = 'none';
  document.getElementById('spread-cards-list').style.display = '';
  document.getElementById('spread-actions').style.display = 'none';
  document.getElementById('draw-actions').style.display = 'none';
  const confirmArea = document.getElementById('pick-confirm-area');
  if (confirmArea) confirmArea.style.display = 'none';

  goToStep('step-spread');
}

// ---------- 弹窗 ----------
function openCardModal(imgSrc) {
  const modal = document.getElementById('card-modal');
  document.getElementById('modal-img').src = imgSrc;
  modal.classList.add('active');
}
function closeModal() {
  document.getElementById('card-modal').classList.remove('active');
}

// ---------- 初始化 ----------
document.addEventListener('DOMContentLoaded', () => {
  initSpreadSelection();
  initCategoryStep();

  document.querySelector('.modal-backdrop').addEventListener('click', closeModal);
  document.querySelector('.modal-close').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  goToStep('step-spread');
});
