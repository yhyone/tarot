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
  const [pastCard, nowCard, futureCard] = cards;
  const catText = categories.map(c => categoryLabels[c]).join('和');

  let html = `<h3>三牌综合解读</h3>`;

  // 开篇
  html += `<p>你问的是：「<strong>${question}</strong>」。三张牌从过去、现在、未来三个维度，共同描绘了关于这个问题的完整图景。</p>`;

  // 故事线：每张牌选一个核心关键词作为叙事锚点
  const pastAnchor = pastCard.keywords[0];
  const nowAnchor = nowCard.keywords[0];
  const futureAnchor = futureCard.keywords[0];

  html += `<p style="margin-top:0.8rem;"><strong>故事的脉络：</strong>过去的「${pastCard.nameCN}」以「${pastAnchor}」为起点，奠定了问题的根基；到了现在，「${nowCard.nameCN}」的「${nowAnchor}」能量正在主导你的处境；未来的「${futureCard.nameCN}」则指向「${futureAnchor}」这一方向。这条线串起来告诉你——</p>`;

  // 动态串联分析
  html += `<p>${buildStoryline(pastCard, nowCard, futureCard, question, categories)}</p>`;

  // 行动建议：按类别给出3条具体建议
  html += `<p style="margin-top:0.8rem;"><strong>给你的行动建议：</strong></p><ol style="padding-left:1.2rem;line-height:2;">`;
  html += buildActionItems(pastCard, nowCard, futureCard, question, categories);
  html += `</ol>`;

  return html;
}

function buildStoryline(past, now, future, question, categories) {
  // 基于三张牌的动态关系构建叙事
  const parts = [];

  // 过去→现在的关联
  const pastNowLink = findLink(past, now);
  if (pastNowLink) parts.push(pastNowLink);

  // 现在→未来的关联
  const nowFutureLink = findLink(now, future);
  if (nowFutureLink) parts.push(nowFutureLink);

  // 整体弧线
  parts.push(buildArc(past, now, future, categories));

  return parts.join('');
}

function findLink(from, to) {
  // 寻找两张牌之间的关键词关联
  const shared = from.keywords.filter(k => to.keywords.some(tk => tk.includes(k) || k.includes(tk)));
  if (shared.length > 0) {
    return `「${from.nameCN}」中的「${shared[0]}」与「${to.nameCN}」的「${shared[0]}」前后呼应——这不是巧合，而是一个明确的信号：${shared[0]}是你需要重点关注的议题。`;
  }
  // 互补线索
  const complementPairs = [
    [['束缚', '限制', '困境'], ['自由', '解脱', '突破', '释放']],
    [['结束', '终结'], ['新的开始', '开始', '重生']],
    [['冲突', '挑战'], ['胜利', '和谐', '平衡']],
    [['迷茫', '困惑', '不安'], ['清晰', '希望', '指引']],
    [['等待', '忍耐'], ['行动', '前进', '进展']],
  ];

  for (const [groupA, groupB] of complementPairs) {
    const fromMatch = from.keywords.some(k => groupA.some(a => k.includes(a)));
    const toMatch = to.keywords.some(k => groupB.some(b => k.includes(b)));
    if (fromMatch && toMatch) {
      return `「${from.nameCN}」到「${to.nameCN}」的变化显示了一个重要转折：从${from.keywords.find(k => groupA.some(a => k.includes(a)))}走向${to.keywords.find(k => groupB.some(b => k.includes(b)))}，这说明你所处的阶段正在发生本质的转变。`;
    }
  }

  return `「${from.nameCN}」和「${to.nameCN}」的组合提醒你，${from.keywords[0]}和${to.keywords[0]}这两个因素在前后影响着你的处境。`;
}

function buildArc(past, now, future, categories) {
  const catText = categories.map(c => categoryLabels[c]).join('和');

  // 判断整体走向
  const positiveSet = new Set(['新的开始', '胜利', '希望', '成功', '快乐', '爱', '和谐', '丰饶', '富足',
    '力量', '满足', '幸福', '圆满', '完成', '治愈', '创造力', '自信', '勇气', '成长', '庆祝']);
  const challengingSet = new Set(['结束', '悲伤', '冲突', '束缚', '焦虑', '困难', '匮乏', '崩塌',
    '失落', '心碎', '负担', '恐惧', '无力感', '欺骗', '僵局']);

  const allKeywords = [...past.keywords, ...now.keywords, ...future.keywords];
  const posCount = allKeywords.filter(k => positiveSet.has(k)).length;
  const negCount = allKeywords.filter(k => challengingSet.has(k)).length;

  if (posCount > negCount * 2) {
    return `整体来看，三张牌呈现出一条向上的弧线。从「${past.nameCN}」的铺垫，经过「${now.nameCN}」的转折，最终走向「${future.nameCN}」的明确方向——关于「${question}」这件事，牌面给你的信号是积极的。关键在于，你需要在当下阶段保持清醒和主动，不要让好势头从手中滑走。`;
  } else if (negCount > posCount * 2) {
    return `这组牌面确实呈现出一些挑战，从「${past.nameCN}」到「${future.nameCN}」的过程中，${catText}方面的压力是真实存在的。但三张牌同时也在告诉你：困难不是死局。尤其「${now.nameCN}」的出现说明，现在正是你可以做出改变的关键节点——改变当下的应对方式，未来的走向就会跟着变化。`;
  } else {
    return `三张牌从「${past.nameCN}」到「${future.nameCN}」的演变，展现了一个正在成形中的局面。${catText}方面的结果尚未确定，最大的变量就是「${now.nameCN}」——你在当下的选择和行动，将直接决定未来偏向哪一个方向。这不是宿命的预言，而是提醒你把握当下的力量。`;
  }
}

function buildActionItems(past, now, future, question, categories) {
  let items = '';

  // 根据过去牌给出第1条建议
  items += `<li>回顾「${past.nameCN}」给你的启示：${extractAdvice(past, 'past', question, categories[0])}</li>`;

  // 根据现在牌给出第2条建议
  items += `<li>当下聚焦「${now.nameCN}」的关键：${extractAdvice(now, 'now', question, categories[0])}</li>`;

  // 根据未来牌给出第3条建议
  items += `<li>为「${future.nameCN}」预示的未来做准备：${extractAdvice(future, 'future', question, categories[0])}</li>`;

  return items;
}

function extractAdvice(card, position, question, category) {
  // 从牌的解读中提取最相关的一句话建议
  let text = '';
  if (category === 'career') text = card.career;
  else if (category === 'love') text = card.love;
  else if (category === 'health') text = card.health;
  else text = card.meaning;

  // 从解读中找到最有行动性的一句话（通常包含"建议""需要""可以""应该"等词）
  const sentences = text.split(/[。！；]/).filter(s => s.trim());
  const actionSentence = sentences.find(s =>
    s.includes('建议') || s.includes('需要') || s.includes('应该') ||
    s.includes('鼓励') || s.includes('适合') || s.includes('提醒')
  );

  if (actionSentence && position === 'now') {
    return actionSentence.trim() + '。';
  } else if (actionSentence) {
    return actionSentence.trim() + '。' + (position === 'past' ? '不要让这个教训重演。' : '提前做好准备，你会感谢现在的自己。');
  }

  // 没有明确行动句，基于关键词生成
  return `把「${card.keywords[0]}」和「${card.keywords[1]}」作为你当前阶段的行动指南，每一项决策都问问自己是否符合这两个原则。`;
}

// ---------- 单张牌专属建议 ----------
function buildCardAdvice(card, position, question, categories) {
  let html = '<div class="advice-box"><h4>针对你的问题</h4>';

  const posContext = {
    '核心指引': { role: '指引你看到问题本质的钥匙', focus: '请关注牌面传递的核心信息，直接对照你的处境' },
    '过去': { role: '形成当前局面的深层原因', focus: '回顾过去，找到问题的根源所在' },
    '现在': { role: '此刻最需要你正视的关键议题', focus: '当下最重要的不是观望，而是针对性地采取行动' },
    '未来': { role: '当前路径下可能发展的方向', focus: '这个预兆不是结局，而是在提醒你调整现在的选择' }
  };

  const ctx = posContext[position] || posContext['核心指引'];

  html += `<p style="color:var(--muted);font-size:0.85rem;margin-bottom:0.6rem;">「${card.nameCN}」在「${position}」的位置，它的角色是——${ctx.role}。</p>`;

  // 针对每个类别生成不重复的精简建议
  categories.forEach(cat => {
    const catName = categoryLabels[cat];
    let detailText = '';
    if (cat === 'career') detailText = card.career;
    else if (cat === 'love') detailText = card.love;
    else if (cat === 'health') detailText = card.health;

    // 提取关键建议句，找第一句有实质行动指向的话
    const sentences = detailText.split(/[。！；]/).filter(s => s.trim());
    const keySentence = sentences.find(s =>
      s.includes('建议') || s.includes('需要') || s.includes('应该') ||
      s.includes('鼓励') || s.includes('适合') || s.includes('提醒') ||
      s.includes('可以') || s.includes('要')
    ) || sentences[0];

    html += `<p style="margin-top:0.5rem;"><strong>「${catName}」角度：</strong>${ctx.focus}。${card.nameCN}在这方面的提示是——${keySentence.trim()}。结合你的问题「${question}」，请在接下来的一周内，采取至少一个具体行动来回应这张牌的指引。</p>`;
  });

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
