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

function makeActionTip(card, position, categories) {
  var kw = card.keywords || [];
  var cat = (categories && categories[0]) ? categories[0] : 'career';
  var tips = [];

  // 基于关键词生成具体行动
  var kwActions = {
    '新的开始': '今天做一件你一直想但没敢做的事，哪怕很小',
    '行动力': '现在就写下第一个具体步骤，并在24小时内完成它',
    '冒险': '走出舒适区一步：联系一个你尊敬但不太熟的人',
    '勇气': '列出你害怕面对的一件事，然后今天就去面对它',
    '等待': '本周不做任何重大决定，专注观察和收集信息',
    '内省': '今晚花15分钟独处，写下你真正的想法和感受',
    '耐心': '把大目标拆成三个小步骤，每天只完成一个',
    '平衡': '检查工作和生活的比例，本周做一件纯粹为自己开心的事',
    '放下': '写下三件你一直抓着不放的事，然后有意识地放手其中一件',
    '沟通': '主动联系一个你最近疏远的人，坦诚说出你的想法',
    '选择': '列出利弊清单，然后相信你的第一直觉做出选择',
    '坚持': '回顾你已经走了多远，给自己一个小的奖励然后继续',
    '改变': '本周改变一个小习惯：早起15分钟、少看手机、多喝水',
    '规划': '花30分钟做一个详细的周计划，把大目标分解成每日任务',
    '独立': '本周自己做一个重要决定，不征求任何人的意见',
    '合作': '找一个你信任的人，把你的问题坦诚地分享给TA',
    '学习': '本周学一个新技能或读一本与你问题相关的书',
    '休息': '安排一个完全不工作的下午，做让自己放松的事',
    '创造': '用写作/绘画/音乐等方式表达你当前的感受',
    '希望': '写下你对未来最好的想象，然后找出今天能做的一小步',
    '信心': '列出你过去成功的三件事，提醒自己你有能力应对',
    '爱': '向你关心的人表达一次真诚的感谢或爱意',
    '庆祝': '认可自己最近的一个成就，无论大小，庆祝一下',
    '胜利': '把成功经验总结下来，看看能不能复制到当前问题上',
    '专注': '本周只聚焦一件事，拒绝所有其他干扰',
    '自由': '打破一个不必要的规则或习惯，给自己更多空间',
    '掌控': '整理一个你一直拖延的领域：桌面、账单或日程',
    '力量': '做一件需要你展现内在力量的事，哪怕是站出来说一句话',
    '智慧': '请教一个有经验的人，听听TA的建议再自己做判断',
    '直觉': '本周做决策时，先听内心的第一反应，再听理性的分析',
    '释放': '写一封信（可以不发出去），把压在心里的情绪全部释放出来',
    '恢复': '给自己完整的8小时睡眠，明天重新开始',
    '疗愈': '做一件让你感到被照顾的事：泡茶、散步、听音乐',
    '转变': '接受变化正在发生，列出三个变化带来的新机会',
    '结束': '正式终结一件拖延已久的事：取消订阅、整理房间、告别旧习惯',
    '满足': '写下三件让你感恩的事，感受已经拥有的丰盛',
    '幸福': '安排一件今天就能做的小确幸：好吃的一餐、一本好書',
    '富足': '重新审视你的资源：你拥有的比你以为的更多',
    '稳定': '建立一个简单的日常routine，让它成为你的锚点',
    '责任': '审视你承担的责任，哪些可以分担或放下',
    '决策': '设定一个截止时间做决定，不再拖延',
    '突破': '做一件你从没做过的事来打破僵局',
    '探索': '用好奇心代替恐惧，去了解一个你以前回避的领域',
    '成长': '回顾过去三个月的成长，设定下一个成长目标',
    '分享': '把你学到的经验或资源分享给有需要的人',
    '慷慨': '本周做一次不求回报的付出：时间、帮助或鼓励',
    '目标': '写下你最重要的三个目标，然后只保留一个作为近期重心',
    '愿景': '做一个愿景板或简单的清单，把自己的理想可视化',
    '真相': '对自己诚实一次：你现在最想要的是什么，而不是别人期望你要什么',
    '公正': '在做决策时考虑对所有相关方的影响，追求公平的结果',
    '信仰': '找到一件你深信不疑的原则，让它指引你当前的困境',
    '快乐': '今天找到一件让你真正开心的小事并马上去做',
    '成功': '回顾你最近的一次成功，分析是什么让你做到的，然后复制它',
    '活力': '今天做20分钟运动，用身体的活力带动心理的状态',
    '清晰': '把混乱的想法写下来，一条条理清楚，然后挑最重要的先做',
    '温暖': '做一件温暖他人的小事，一个拥抱、一句鼓励都有力量',
    '命运': '接受有些事情无法控制，但你可以控制自己的态度和回应',
    '转折': '站在十字路口时，选那条让你心跳加速的路，别选最安全的路',
    '机遇': '睁大眼睛留意身边的新机会，它们往往藏在你不经意的地方',
    '循环': '识别生活中反复出现的模式，打破那个让你陷入循环的关键环节',
    '变化': '本周主动改变一件日常小事，让自己适应变化带来的不确定性',
    '丰饶': '盘点你拥有的资源：技能、关系、经验，你会发现比你想象的多得多',
    '滋养': '做一件能滋养你身心的事：一顿健康的美食、一次按摩或一次散步',
    '母性': '关心和照顾身边的人，但别忘了先照顾好自己的需求',
    '权威': '在需要你发声的场合站出来，用你的专业和自信影响他人',
    '秩序': '整理一个混乱的角落，外在的秩序会带来内在的平静',
    '传统': '从过去的经验中寻找智慧，但不要被旧有的模式限制住',
    '结合': '寻找与对你有帮助的人合作的机会，1+1可以大于2',
    '前进': '不要回头看，专注当下的一步，迈出去就是胜利',
    '克服困难': '把困难拆解成小问题，一个一个解决，不要被整体吓倒',
    '和谐': '在冲突中找到共同点，从对方的角度想一分钟再回应',
    '蜕变': '相信这个过程，蝴蝶在破茧时也是最困难的时候',
    '重生': '旧的一页翻过去了，带着经验走向全新的开始',
    '治愈': '给自己时间和空间疗伤，不要强迫自己快速好起来',
    '灵感': '随身带一个本子，灵感来时马上记下来，别让它溜走',
    '信念': '每天对自己说一句肯定的话，信念会在重复中生根发芽',
    '不安': '面对你的不安情绪，写下它、承认它，然后你会发现它没那么可怕',
    '梦境': '关注你的梦和直觉，它们往往藏着你白天忽略的答案',
    '幻象': '不要被表象迷惑，多问几个为什么，找到事情的真相',
    '放松': '今晚提前1小时关掉手机，做一些不需要脑力的事',
    '和解': '和过去的人或事和解，不是为了对方，是为了自己轻松前行',
    '连接': '本周安排一次和重要的人面对面的时间，真诚地交流',
    '吸引': '做最好的自己，对的人会被你的能量自然吸引过来',
    '互相': '感情是双向的，问问对方需要什么，而不是只关注自己的需求',
    '给予': '力所能及帮助身边一个人，哪怕只是认真倾听十分钟',
    '接纳': '接纳自己目前的状态，改变从不否定自己开始',
    '归属': '找到你的圈子或社区，融入一个让你感到被接纳的地方',
    '防守': '保护好自己的边界和成果，不要被别人的意见轻易动摇',
    '警惕': '本周多留意细节，重要的事一定要再三确认',
    '韧性': '提醒自己过去的困难你都走过来了，这次也不会例外',
    '负担': '把背上的包袱列出来，问问自己哪些其实可以放下来',
    '自律': '每天坚持做一件小事，自律的力量会在积累中显现',
    '享受': '允许自己享受努力换来的成果，你值得拥有这份快乐',
    '成就': '把你最近的成就写下来（哪怕很小），它会成为你继续的动力',
    '精进': '找出你工作上还能提升的一个点，本周专注把它做好做透',
    '勤奋': '少做规划和空想，多动手执行，行动是最好的解药',
    '细节': '重新检查你正在做的事，把每个细节都做好就是专业',
    '技能': '投资一小时提升一项能让你在职场更有竞争力的技能',
    '财富': '审视你的财务习惯，找到一个可以优化的点今天就改',
    '投资': '把时间和精力投入到能带来长期回报的事情上，而非短期快感',
    '务实': '别想太多，把手头能做的事先做好，行动比空想更有说服力',
    '安全': '在追求改变的同时保留一个安全网，让自己更有底气去冒险',
    '经营': '像经营一家公司一样经营自己的生活，关注投入产出比',
    '慷慨': '慷慨分享你的经验和资源，你给出的最终会以另一种形式回来',
    '持家': '创造一个让你回家就感到放松和温暖的空间环境',
    '可靠': '说到做到，哪怕是很小的事，让别人知道你是可以信赖的人',
    '效率': '找个你觉得效率低下的事，想想怎么用更聪明的方式完成它',
  };

  // 遍历关键词，找到匹配的行动建议
  for (var i = 0; i < kw.length; i++) {
    var keys = Object.keys(kwActions);
    for (var j = 0; j < keys.length; j++) {
      if (kw[i].indexOf(keys[j]) >= 0 || keys[j].indexOf(kw[i]) >= 0) {
        if (tips.indexOf(kwActions[keys[j]]) < 0) {
          tips.push(kwActions[keys[j]]);
        }
        break;
      }
    }
    if (tips.length >= 2) break;
  }

  // 如果没找到匹配，根据类别生成通用建议
  if (tips.length === 0) {
    if (cat === 'career') tips.push('列出当前工作中的三个优先事项，本周聚焦完成其中最重要的一件');
    else if (cat === 'love') tips.push('本周安排一次和伴侣或心仪对象的深度对话，不带手机不被打扰');
    else if (cat === 'health') tips.push('本周坚持做一件对身体有益的小事：早睡、多喝水或饭后散步');
    else tips.push('把' + (kw[0] || '专注') + '作为本周的主题词，每天都提醒自己');
  }

  // 根据位置追加额外建议
  if (position === '未来') tips.push('提前为这个方向做好准备，从今天就开始');
  if (position === '过去') tips.push('不要让过去的模式在未来重演，从现在开始改变');

  return tips.join('；') + '。';
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

  html += '<p style="margin-top:0.5rem;color:var(--accent-strong);"><strong>行动提示：</strong>' + makeActionTip(card, position, categories) + '</p>';

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
