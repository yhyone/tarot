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
  const drawModeSection = document.getElementById('draw-mode-section');
  const spreadActions = document.getElementById('spread-actions');
  const btnToDraw = document.getElementById('btn-to-draw');

  cards.forEach(card => {
    card.addEventListener('click', function(e) {
      if (e.target.closest('.btn')) return;
      cards.forEach(c => c.classList.remove('selected'));
      this.classList.add('selected');
      state.spread = this.dataset.spread;
      drawModeSection.style.display = 'block';
      spreadActions.style.display = 'flex';
      drawModeSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });

  document.querySelectorAll('.btn-outline[data-spread]').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      state.spread = this.dataset.spread;
      cards.forEach(c => c.classList.remove('selected'));
      const card = document.querySelector(`.spread-card[data-spread="${state.spread}"]`);
      if (card) card.classList.add('selected');
      drawModeSection.style.display = 'block';
      spreadActions.style.display = 'flex';
      drawModeSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
  const config = spreadConfig[state.spread];
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

  // 每张牌的详细解读
  state.drawnCards.forEach((card, i) => {
    const pos = config.positions[i];
    const imgPath = getCardImagePath(card);

    let bodyHTML = '';
    bodyHTML += `<h4>牌意概述</h4><p>${card.meaning}</p>`;

    if (state.categories.includes('career')) {
      bodyHTML += `<h4>💼 事业解读</h4><p>${card.career}</p>`;
    }
    if (state.categories.includes('love')) {
      bodyHTML += `<h4>💕 婚姻/爱情解读</h4><p>${card.love}</p>`;
    }
    if (state.categories.includes('health')) {
      bodyHTML += `<h4>🌿 健康解读</h4><p>${card.health}</p>`;
    }

    // 针对问题的专属建议
    bodyHTML += buildCardAdvice(card, pos, state.question, state.categories);

    container.innerHTML += `
      <div class="result-card">
        <div class="result-card-img-large" onclick="openCardModal('${imgPath}')">
          <img src="${imgPath}" alt="${card.nameCN}" loading="lazy"
               onerror="this.style.display='none'">
        </div>
        <div class="result-card-header">
          <div class="result-card-title">
            <span class="result-position">${pos}</span>
            <h3 class="result-card-name">${card.nameCN}</h3>
            <p style="color:var(--muted);font-size:0.85rem;">${card.nameEN}${card.suit ? ' · ' + suitLabels[card.suit] : ''}</p>
            <div class="result-card-keywords">
              ${card.keywords.map(k => `<span class="keyword-tag">${k}</span>`).join('')}
            </div>
          </div>
        </div>
        <div class="result-card-body">${bodyHTML}</div>
      </div>
    `;
  });

  document.getElementById('btn-redraw-result').onclick = () => {
    initDraw();
    goToStep('step-draw');
  };
  document.getElementById('btn-restart').onclick = resetAll;
}

// ---------- 综合解读（三张牌） ----------
function buildSpreadSummary(cards, positions, question, categories) {
  const catText = categories.map(c => categoryLabels[c]).join('和');
  const pastCard = cards[0], nowCard = cards[1], futureCard = cards[2];

  // 分析趋势：对比三张牌的正负面
  const trend = analyzeTrend(cards);

  let html = `<h3>三牌综合解读</h3>`;

  html += `<p>你提出的问题是：「<strong>${question}</strong>」</p>`;
  html += `<p>三张牌共同构成了关于这个问题的完整画面：</p>`;

  html += `<p><strong>🔹 过去的根源</strong>——${pastCard.nameCN}（${pastCard.keywords.slice(0,3).join('、')}）揭示了问题产生的背景。${pastCard.meaning}</p>`;

  html += `<p><strong>🔹 当下的状态</strong>——${nowCard.nameCN}（${nowCard.keywords.slice(0,3).join('、')}）反映了你目前正在经历的状况。${nowCard.meaning}</p>`;

  html += `<p><strong>🔹 未来的走向</strong>——${futureCard.nameCN}（${futureCard.keywords.slice(0,3).join('、')}）指出了事情可能发展的方向。${futureCard.meaning}</p>`;

  html += `<p><strong>🔹 综合来看：</strong>${trend}</p>`;

  // 针对问题的综合行动建议
  html += `<p style="margin-top: 0.8rem;"><strong>🔹 行动建议：</strong>`;
  html += buildActionAdvice(cards, question, categories);
  html += `</p>`;

  return html;
}

function analyzeTrend(cards) {
  const pastKW = cards[0].keywords;
  const nowKW = cards[1].keywords;
  const futureKW = cards[2].keywords;

  // 基于每张牌的实际关键词生成趋势描述
  const pastDesc = pastKW.slice(0, 2).join('和');
  const nowDesc = nowKW.slice(0, 2).join('与');
  const futureDesc = futureKW.slice(0, 2).join('和');

  const trendParts = [
    `过去的「${cards[0].nameCN}」带来了${pastDesc}的能量，这是你问题的起点与背景。`,
    `当下的「${cards[1].nameCN}」以${nowDesc}为核心，说明你正处于一个需要${nowKW[0]}的阶段。`,
    `未来的「${cards[2].nameCN}」指向${futureDesc}的方向，这是当前路径下最可能的发展结果。`
  ];

  // 未来牌的正负面倾向
  const positiveSet = new Set(['新的开始', '胜利', '希望', '成功', '快乐', '爱', '和谐', '丰饶',
    '富足', '力量', '满足', '幸福', '圆满', '完成', '治愈', '创造力', '自信', '勇气', '成长', '庆祝']);
  const challengingSet = new Set(['结束', '悲伤', '冲突', '束缚', '焦虑', '困难', '匮乏', '崩塌',
    '失落', '心碎', '负担', '恐惧', '无力感', '欺骗', '僵局']);

  const futurePositive = futureKW.filter(k => positiveSet.has(k)).length;
  const futureChallenging = futureKW.filter(k => challengingSet.has(k)).length;

  let conclusion = '';
  if (futurePositive > futureChallenging) {
    conclusion = `整体来看，牌阵呈现出积极向上的走向。如果你能在「${cards[1].nameCN}」代表的当下阶段做出正确的选择，就有机会迎来「${cards[2].nameCN}」所预示的好结果。`;
  } else if (futureChallenging > futurePositive) {
    conclusion = `牌阵提醒你，前方需要面对一些挑战。但「${cards[2].nameCN}」的出现也告诉你——挑战本身也是成长的契机。正视问题、调整当下，你完全有能力改变牌面所预示的走向。`;
  } else {
    conclusion = `牌面显示一个关键的转折期。过去的「${cards[0].nameCN}」在逐渐淡去，未来的「${cards[2].nameCN}」尚未定型，一切取决于你现在——「${cards[1].nameCN}」阶段——做出的选择和行动。`;
  }

  return trendParts.join('') + conclusion;
}

function buildActionAdvice(cards, question, categories) {
  let advice = '';

  if (categories.includes('career')) {
    const past = cards[0].career;
    const now = cards[1].career;
    const future = cards[2].career;
    advice += `<p><strong>💼 事业：</strong>回顾过去——${past} 眼于当下——${now} 展望未来——${future}</p>`;
  }
  if (categories.includes('love')) {
    const past = cards[0].love;
    const now = cards[1].love;
    const future = cards[2].love;
    advice += `<p><strong>💕 感情：</strong>从过去的「${cards[0].nameCN}」到现在的「${cards[1].nameCN}」再到未来的「${cards[2].nameCN}」，感情脉络逐渐清晰。${past.slice(0, 80)}…… 当前最需要关注的是：${now.slice(0, 80)}…… 未来的启示是：${future.slice(0, 80)}……</p>`;
  }
  if (categories.includes('health')) {
    const past = cards[0].health;
    const now = cards[1].health;
    const future = cards[2].health;
    advice += `<p><strong>🌿 健康：</strong>三张牌从过去到现在再到未来给出了完整的健康指引。${past} ${now} ${future}</p>`;
  }
  if (!advice) {
    advice = `<p>结合你的问题「${question}」，三张牌从过去、现在、未来三个维度为你揭示了事情的全貌。请仔细阅读下方每张牌的详细解读，找到与你当下处境最共鸣的部分。</p>`;
  }
  return advice;
}

// ---------- 单张牌专属建议 ----------
function buildCardAdvice(card, position, question, categories) {
  let html = '<div class="advice-box"><h4>针对你的问题</h4>';

  const posGuide = {
    '核心指引': '这张牌是你当前问题的核心指引，请将以下解读与你的处境对照',
    '过去': '这张牌揭示了你问题的根源和过去的背景',
    '现在': '这张牌反映了你当前的状态和关键所在',
    '未来': '这张牌预示了未来的趋势和可能的结果'
  };

  html += `<p style="color:var(--muted);font-size:0.85rem;margin-bottom:0.5rem;">${posGuide[position] || ''}：你问的是「${question}」</p>`;

  categories.forEach(cat => {
    const catName = categoryLabels[cat];
    let interpretation = '';
    if (cat === 'career') interpretation = card.career;
    else if (cat === 'love') interpretation = card.love;
    else if (cat === 'health') interpretation = card.health;

    html += `<p><strong>「${catName}」方向：</strong>结合你当前「${position}」的位置来看——${interpretation}</p>`;
  });

  // 基于卡片关键词给出行动提示
  const actionVerbs = {
    '新的开始': '迈出第一步', '行动力': '立即采取行动', '勇气': '直面恐惧',
    '等待': '保持耐心', '内省': '花时间独处反思', '平衡': '调整生活节奏',
    '沟通': '主动开启对话', '选择': '做出明确决定', '放下': '学会放手',
    '坚持': '继续坚持不放弃', '改变': '拥抱即将到来的变化', '希望': '保持积极信念',
    '爱': '用心表达爱意', '创造': '发挥你的创造力', '学习': '投入学习提升自己',
    '休息': '给自己放个假', '合作': '寻求他人帮助', '独立': '靠自己解决问题',
    '信心': '相信自己', '规划': '制定详细计划', '庆祝': '肯定已有成果',
  };

  const matchingAction = Object.entries(actionVerbs).find(([key]) =>
    card.keywords.some(k => k.includes(key) || key.includes(k))
  );

  if (matchingAction) {
    html += `<p style="margin-top:0.5rem;"><strong>建议行动：</strong>这张牌最重要的提示是——${matchingAction[1]}。从今天开始，请试着把这个建议融入你的日常生活中。</p>`;
  }

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
