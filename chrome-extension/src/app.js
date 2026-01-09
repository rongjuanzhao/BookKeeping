// 全局状态
let currentAssetData = {
  currentDeposit: 0,
  alipay: 0,
  wechat: 0,
  car: 0,
  house: 0,
  fixedDeposit: 0,
  stocks: 0,
  receivable: 0,
  carLoan: 0,
  mortgage: 0,
  borrowing: 0
};

let updateRecords = [];

// 默认分类配置
const defaultCategories = {
  '流动资金': {
    defaultItems: ['银行活期', '支付宝', '微信'],
    icon: '💰'
  },
  '固定资产': {
    defaultItems: ['车辆价值', '房产价值'],
    icon: '🏠'
  },
  '投资理财': {
    defaultItems: ['定期存款', '股票基金'],
    icon: '📈'
  },
  '应收款项': {
    defaultItems: ['他人借款'],
    icon: '📋'
  },
  '负债': {
    defaultItems: ['车贷', '房贷', '借贷'],
    icon: '💳'
  }
};

// 分类数据
let categories = {};
let activeCategory = '流动资金';
let newItemName = {};

// 初始化应用
async function initApp() {
  await loadData();
  setupEventListeners();
  updateUI();
  drawChart();
}

// 从Chrome Storage加载数据
async function loadData() {
  try {
    const result = await chrome.storage.local.get(['currentAssetData', 'assetRecords', 'categories']);

    if (result.currentAssetData) {
      currentAssetData = result.currentAssetData;
    }

    if (result.assetRecords) {
      updateRecords = result.assetRecords;
    }

    if (result.categories) {
      categories = result.categories;
    } else {
      initializeCategories();
    }
  } catch (error) {
    console.error('加载数据失败:', error);
    initializeCategories();
  }
}

// 初始化分类数据
function initializeCategories() {
  categories = {};
  Object.keys(defaultCategories).forEach(category => {
    categories[category] = {
      defaultItems: [...defaultCategories[category].defaultItems],
      customItems: []
    };
  });
  saveCategories();
}

// 保存分类数据
async function saveCategories() {
  try {
    await chrome.storage.local.set({ categories: categories });
  } catch (error) {
    console.error('保存分类数据失败:', error);
  }
}

// 保存数据到Chrome Storage
async function saveData() {
  try {
    const record = {
      id: Date.now().toString(),
      title: '资产数据',
      amount: 0,
      date: new Date().toISOString(),
      category: '资产',
      subCategory: '',
      description: currentAssetData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 添加到记录列表开头
    updateRecords.unshift(record);

    await chrome.storage.local.set({
      currentAssetData: currentAssetData,
      assetRecords: updateRecords
    });
  } catch (error) {
    console.error('保存数据失败:', error);
    throw error;
  }
}

// 设置事件监听器
function setupEventListeners() {
  // 更新资产按钮
  document.getElementById('updateAsset').addEventListener('click', showUpdateModal);

  // 显示记录按钮
  document.getElementById('showRecords').addEventListener('click', showRecordsModal);

  // 分类管理按钮
  document.getElementById('showCategoryManagement').addEventListener('click', showCategoryManagementModal);

  // 关闭更新模态框
  document.getElementById('closeUpdateModal').addEventListener('click', hideUpdateModal);
  document.getElementById('cancelUpdate').addEventListener('click', hideUpdateModal);

  // 关闭记录模态框
  document.getElementById('closeRecordsModal').addEventListener('click', hideRecordsModal);

  // 关闭分类管理模态框
  document.getElementById('closeCategoryModal').addEventListener('click', hideCategoryManagementModal);

  // 表单提交
  document.getElementById('assetForm').addEventListener('submit', handleFormSubmit);

  // 点击遮罩层关闭模态框
  document.getElementById('updateModal').addEventListener('click', (e) => {
    if (e.target.id === 'updateModal') hideUpdateModal();
  });

  document.getElementById('recordsModal').addEventListener('click', (e) => {
    if (e.target.id === 'recordsModal') hideRecordsModal();
  });

  document.getElementById('categoryManagementModal').addEventListener('click', (e) => {
    if (e.target.id === 'categoryManagementModal') hideCategoryManagementModal();
  });
}

// 显示更新模态框
function showUpdateModal() {
  const form = document.getElementById('assetForm');

  // 填充当前数据
  Object.keys(currentAssetData).forEach(key => {
    const input = form.querySelector(`[name="${key}"]`);
    if (input) {
      input.value = currentAssetData[key];
    }
  });

  document.getElementById('updateModal').style.display = 'flex';
}

// 隐藏更新模态框
function hideUpdateModal() {
  document.getElementById('updateModal').style.display = 'none';
}

// 显示记录模态框
function showRecordsModal() {
  const content = document.getElementById('recordsContent');

  if (updateRecords.length === 0) {
    content.innerHTML = '<div class="empty-state">暂无更新记录</div>';
  } else {
    content.innerHTML = renderRecords();
  }

  document.getElementById('recordsModal').style.display = 'flex';
}

// 隐藏记录模态框
function hideRecordsModal() {
  document.getElementById('recordsModal').style.display = 'none';
}

// 处理表单提交
async function handleFormSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const newData = {};

  // 转换表单数据
  for (const [key, value] of formData.entries()) {
    newData[key] = parseFloat(value) || 0;
  }

  console.log('准备保存的数据:', newData);

  // 更新当前数据
  currentAssetData = newData;

  try {
    await saveData();
    updateUI();
    await drawChart();  // 等待图表绘制完成
    hideUpdateModal();
    console.log('数据保存成功');
  } catch (error) {
    console.error('保存失败详细错误:', error);
    alert('保存失败: ' + error.message);
  }
}

// 更新UI显示
function updateUI() {
  const totalAssets = Object.entries(currentAssetData).reduce((sum, [key, value]) => {
    const liabilities = ['carLoan', 'mortgage', 'borrowing'];
    return liabilities.includes(key) ? sum - value : sum + value;
  }, 0);

  const netWorth = totalAssets - (currentAssetData.car + currentAssetData.house + currentAssetData.receivable);
  const liabilitiesData = currentAssetData.carLoan + currentAssetData.mortgage + currentAssetData.borrowing;

  document.getElementById('totalAssets').textContent = '¥' + totalAssets.toLocaleString();
  document.getElementById('netWorth').textContent = '¥' + netWorth.toLocaleString();
  document.getElementById('liabilities').textContent = '¥' + liabilitiesData.toLocaleString();
}

// 绘制桑基图 - 使用D3-sankey，完全按照原Next.js应用的结构
async function drawChart() {
  const container = document.getElementById('sankeyChart');
  if (!container) {
    console.error('找不到sankeyChart容器');
    return;
  }

  console.log('开始绘制桑基图');

  // 清空容器
  container.innerHTML = '';

  // 检查D3是否可用
  if (typeof d3 === 'undefined') {
    console.error('D3库未加载');
    container.innerHTML = '<div style="text-align: center; color: red; padding: 20px;">D3库加载失败</div>';
    return;
  }

  if (typeof d3.sankey === 'undefined') {
    console.error('d3-sankey库未加载');
    container.innerHTML = '<div style="text-align: center; color: red; padding: 20px;">d3-sankey库加载失败</div>';
    return;
  }

  // 使用测试数据（如果数据都是0）
  const hasNonZeroData = Object.values(currentAssetData).some(value => value > 0);
  const processedData = hasNonZeroData ? currentAssetData : {
    currentDeposit: 50000,
    alipay: 10000,
    wechat: 5000,
    car: 150000,
    house: 3000000,
    fixedDeposit: 200000,
    stocks: 100000,
    receivable: 0,
    carLoan: 50000,
    mortgage: 2000000,
    borrowing: 0
  };

  console.log('使用的数据:', processedData);

  // 资产分类映射（与原应用保持一致）
  const categoryMapping = {
    '流动资金': {
      items: ['银行活期', '支付宝', '微信'],
      fields: ['currentDeposit', 'alipay', 'wechat']
    },
    '固定资产': {
      items: ['车辆价值', '房产价值'],
      fields: ['car', 'house']
    },
    '投资理财': {
      items: ['定期存款', '股票基金'],
      fields: ['fixedDeposit', 'stocks']
    },
    '应收款项': {
      items: ['他人借款'],
      fields: ['receivable']
    },
    '负债': {
      items: ['车贷', '房贷', '借贷'],
      fields: ['carLoan', 'mortgage', 'borrowing']
    }
  };

  // 计算各分类的值
  const categoryValues = {};
  const assetCategories = ['流动资金', '固定资产', '投资理财', '应收款项'];

  let totalAssetsValue = 0;
  assetCategories.forEach(category => {
    const mapping = categoryMapping[category];
    const categoryValue = mapping.fields.reduce((sum, field) => sum + (processedData[field] || 0), 0);
    categoryValues[category] = categoryValue;
    totalAssetsValue += categoryValue;
  });

  // 计算负债
  const liabilitiesMapping = categoryMapping['负债'];
  const liabilitiesValue = liabilitiesMapping.fields.reduce((sum, field) => sum + (processedData[field] || 0), 0);

  // 计算净资产
  const netAssetsValue = totalAssetsValue - liabilitiesValue;

  // 如果没有数据，显示提示信息
  if (!hasNonZeroData) {
    container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">暂无资产数据，请添加资产数据后查看图表</div>';
    return;
  }

  // 如果没有任何有效节点，直接返回
  if (totalAssetsValue === 0 && liabilitiesValue === 0) {
    container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">暂无资产数据，请添加资产数据后查看图表</div>';
    return;
  }

  // 创建节点和连接数据
  const nodes = [];
  const links = [];
  const nodeIdMap = {};
  let nodeId = 0;

  // 层级0: 净资产和负债
  if (netAssetsValue > 0) {
    nodes.push({
      id: nodeId,
      name: '净资产',
      category: 'net_assets',
      layer: 0,
      value: netAssetsValue
    });
    nodeIdMap['净资产'] = nodeId++;
  }

  if (liabilitiesValue > 0) {
    nodes.push({
      id: nodeId,
      name: '负债',
      category: 'liabilities',
      layer: 0,
      value: liabilitiesValue
    });
    nodeIdMap['负债'] = nodeId++;
  }

  // 层级1: 总资产
  if (totalAssetsValue > 0) {
    nodes.push({
      id: nodeId,
      name: '总资产',
      category: 'total_assets',
      layer: 1,
      value: totalAssetsValue
    });
    nodeIdMap['总资产'] = nodeId++;

    // 创建从净资产到总资产的连接
    if (netAssetsValue > 0) {
      links.push({
        source: nodeIdMap['净资产'],
        target: nodeIdMap['总资产'],
        value: Math.max(0.01, netAssetsValue)
      });
    }

    // 创建从负债到总资产的连接
    if (liabilitiesValue > 0) {
      links.push({
        source: nodeIdMap['负债'],
        target: nodeIdMap['总资产'],
        value: Math.max(0.01, liabilitiesValue)
      });
    }

    // 层级2: 资产分类
    assetCategories.forEach(category => {
      const categoryValue = categoryValues[category];
      if (categoryValue > 0) {
        nodes.push({
          id: nodeId,
          name: category,
          category: 'asset_category',
          layer: 2,
          value: categoryValue
        });
        nodeIdMap[category] = nodeId++;

        // 创建从总资产到分类的连接
        links.push({
          source: nodeIdMap['总资产'],
          target: nodeIdMap[category],
          value: Math.max(0.01, categoryValue)
        });

        // 层级3: 具体资产项
        const mapping = categoryMapping[category];
        mapping.items.forEach((item, index) => {
          const field = mapping.fields[index];
          const itemValue = processedData[field] || 0;
          if (itemValue > 0) {
            nodes.push({
              id: nodeId,
              name: item,
              category: 'asset_detail',
              layer: 3,
              value: itemValue
            });
            nodeIdMap[item] = nodeId++;

            links.push({
              source: nodeIdMap[category],
              target: nodeIdMap[item],
              value: Math.max(0.01, itemValue)
            });
          }
        });
      }
    });
  }

  // 如果没有节点，返回
  if (nodes.length === 0 || links.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">暂无资产数据，请添加资产数据后查看图表</div>';
    return;
  }

  // 设置图表尺寸
  const width = 580;
  const height = 320;
  const margin = { top: 5, right: 10, bottom: 5, left: 10 };

  // 创建SVG
  const svg = d3.select('#sankeyChart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // 颜色映射（与原应用保持一致）
  const colorMap = {
    'net_assets': '#4c78a8',
    'liabilities': '#e45756',
    'total_assets': '#72b7b2',
    'asset_category': '#f58518',
    'asset_detail': '#9d755d'
  };

  const nodeColor = (d) => colorMap[d.category] || '#999';

  // 计算总价值用于百分比计算
  const totalValue = nodes.reduce((sum, node) => {
    if (node.layer === 0 && node.value) {
      return sum + node.value;
    }
    return sum;
  }, 0);

  // 创建桑基图生成器
  const sankeyGenerator = d3.sankey()
    .nodeWidth(10)
    .nodePadding(20)
    .extent([[0, 0], [width, height]])
    .nodeId(d => d.id)
    .iterations(32);

  // 按层级排序节点
  const sortedNodes = [...nodes].sort((a, b) => a.layer - b.layer);

  // 转换数据为d3-sankey格式
  const { nodes: sankeyNodes, links: sankeyLinks } = sankeyGenerator({
    nodes: sortedNodes.map(d => Object.assign({}, d)),
    links: links.map(d => Object.assign({}, d))
  });

  // 创建连线
  const link = svg.append('g')
    .selectAll('.link')
    .data(sankeyLinks)
    .enter()
    .append('path')
    .attr('class', 'link sankey-link')
    .attr('d', d3.sankeyLinkHorizontal())
    .attr('fill', 'none')
    .attr('stroke', d => nodeColor(d.source))
    .attr('stroke-width', d => Math.max(1, d.width || 1))
    .attr('stroke-opacity', 0.5);

  // 创建节点
  const node = svg.append('g')
    .selectAll('.node')
    .data(sankeyNodes)
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', d => `translate(${d.x0},${d.y0})`);

  // 添加节点矩形
  node.append('rect')
    .attr('height', d => (d.y1 || 0) - (d.y0 || 0))
    .attr('width', d => (d.x1 || 0) - (d.x0 || 0))
    .attr('fill', d => nodeColor(d));

  // 添加节点标签
  node.append('text')
    .attr('x', d => {
      const layer = d.layer;
      if (layer === 0) return (d.x1 || 0) - (d.x0 || 0) + 5;
      if (layer === 1) return ((d.x1 || 0) - (d.x0 || 0)) / 2;
      if (layer === 2) return ((d.x1 || 0) - (d.x0 || 0)) / 2;
      if (layer === 3) return (d.x1 || 0) - (d.x0 || 0) + 10;
      return ((d.x1 || 0) - (d.x0 || 0)) / 2;
    })
    .attr('y', d => ((d.y1 || 0) - (d.y0 || 0)) / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', d => {
      const layer = d.layer;
      if (layer === 0) return 'start';
      if (layer === 1) return 'middle';
      if (layer === 2) return 'middle';
      if (layer === 3) return 'start';
      return 'middle';
    })
    .attr('font-size', '12px')
    .attr('fill', '#666')
    .text(d => {
      const name = d.name || '';
      const value = d.value || 0;
      const percentage = totalValue > 0 ? ((value / totalValue) * 100).toFixed(2) : "0.00";
      return `${name} ${percentage}%`;
    });
}

// 渲染更新记录
function renderRecords() {
  const groupedRecords = {};

  // 按日期分组
  updateRecords.forEach(record => {
    const date = new Date(record.date);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    if (!groupedRecords[dateKey]) {
      groupedRecords[dateKey] = [];
    }
    groupedRecords[dateKey].push(record);
  });

  // 按日期排序
  const sortedDates = Object.keys(groupedRecords).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  let html = '';

  sortedDates.forEach(dateKey => {
    html += `<div class="date-group">
              <div class="date-header">${dateKey}</div>`;

    groupedRecords[dateKey].forEach(record => {
      html += renderRecordItem(record);
    });

    html += '</div>';
  });

  return html;
}

// 渲染单条记录
function renderRecordItem(record) {
  const assetNames = {
    currentDeposit: '银行活期',
    alipay: '支付宝',
    wechat: '微信',
    car: '车辆价值',
    house: '房产价值',
    fixedDeposit: '定期存款',
    stocks: '股票基金',
    receivable: '他人借款',
    carLoan: '车贷',
    mortgage: '房贷',
    borrowing: '借贷'
  };

  const date = new Date(record.date);
  const timeStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  let detailsHtml = '';
  Object.entries(record.description).forEach(([key, value]) => {
    const className = value < 0 ? 'debt-value' : 'asset-value';
    detailsHtml += `<div class="detail-row">
                      <span>${assetNames[key]}:</span>
                      <span class="${className}">¥${value.toLocaleString()}</span>
                    </div>`;
  });

  return `<div class="record-item">
            <div class="record-time">更新时间: ${timeStr}</div>
            <div class="record-details">${detailsHtml}</div>
          </div>`;
}

// 分类管理相关函数
function showCategoryManagementModal() {
  const content = document.getElementById('categoryContent');
  content.innerHTML = renderCategoryManagement();
  document.getElementById('categoryManagementModal').style.display = 'flex';

  // 添加事件监听器
  setupCategoryManagementEventListeners();
}

function hideCategoryManagementModal() {
  document.getElementById('categoryManagementModal').style.display = 'none';
}

function renderCategoryManagement() {
  let tabsHtml = '<div class="category-tabs">';

  Object.keys(defaultCategories).forEach(category => {
    const isActive = category === activeCategory ? 'active' : '';
    tabsHtml += `
      <button class="category-tab ${isActive}" data-category="${category}">
        <span class="category-tab-icon">${defaultCategories[category].icon}</span>
        ${category}
      </button>
    `;
  });

  tabsHtml += '</div>';

  let contentHtml = '<div class="category-content">';

  Object.keys(categories).forEach(category => {
    if (category === activeCategory) {
      contentHtml += renderCategorySection(category);
    }
  });

  contentHtml += '</div>';

  return tabsHtml + contentHtml;
}

function renderCategorySection(category) {
  const categoryData = categories[category];
  let html = `<div class="category-section" data-category="${category}">`;

  // 默认子项
  html += `
    <div class="items-list">
      <h4>默认子项</h4>
      <div class="default-items">
  `;

  categoryData.defaultItems.forEach(item => {
    html += `
      <div class="item-row">
        <span>${item}</span>
        <span class="default-item-badge">默认</span>
      </div>
    `;
  });

  html += '</div>';

  // 自定义子项
  html += `
    <h4>自定义子项</h4>
    <div class="custom-items">
  `;

  categoryData.customItems.forEach((item, index) => {
    html += `
      <div class="item-row">
        <span>${item}</span>
        <button class="delete-item-button" data-category="${category}" data-index="${index}">删除</button>
      </div>
    `;
  });

  html += '</div>';

  // 添加新子项
  html += `
    <div class="add-item-section">
      <input
        type="text"
        class="add-item-input"
        data-category="${category}"
        placeholder="输入新子项名称"
        value="${newItemName[category] || ''}"
      />
      <button class="add-item-button" data-category="${category}">添加子项</button>
    </div>
  `;

  html += '</div>';

  return html;
}

function setupCategoryManagementEventListeners() {
  // Tab切换
  document.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      activeCategory = e.currentTarget.dataset.category;
      showCategoryManagementModal();
    });
  });

  // 删除子项
  document.querySelectorAll('.delete-item-button').forEach(button => {
    button.addEventListener('click', (e) => {
      const category = e.target.dataset.category;
      const index = parseInt(e.target.dataset.index);
      deleteCustomItem(category, index);
      showCategoryManagementModal();
    });
  });

  // 添加子项
  document.querySelectorAll('.add-item-button').forEach(button => {
    button.addEventListener('click', (e) => {
      const category = e.target.dataset.category;
      const input = document.querySelector(`.add-item-input[data-category="${category}"]`);
      const itemName = input.value.trim();

      if (itemName) {
        addCustomItem(category, itemName);
        newItemName[category] = '';
        showCategoryManagementModal();
      }
    });
  });

  // 输入框回车事件
  document.querySelectorAll('.add-item-input').forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const category = e.target.dataset.category;
        const itemName = e.target.value.trim();

        if (itemName) {
          addCustomItem(category, itemName);
          newItemName[category] = '';
          showCategoryManagementModal();
        }
      }
    });

    // 保存输入值
    input.addEventListener('input', (e) => {
      const category = e.target.dataset.category;
      newItemName[category] = e.target.value;
    });
  });
}

function addCustomItem(category, itemName) {
  if (!itemName.trim()) return;

  categories[category].customItems.push(itemName.trim());
  saveCategories();
}

function deleteCustomItem(category, index) {
  categories[category].customItems.splice(index, 1);
  saveCategories();
}

// 启动应用
document.addEventListener('DOMContentLoaded', initApp);
