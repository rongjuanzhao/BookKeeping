# 简易记账 Chrome 插件

这是一个基于Chrome Storage API的个人资产管理插件，支持资产记录、更新历史查看和桑基图可视化。

## 功能特点

- ✅ **本地存储**: 所有数据存储在浏览器本地，完全隐私保护
- ✅ **资产管理**: 支持多种资产类型（银行、支付宝、微信、房产、车辆等）
- ✅ **更新记录**: 自动保存每次更新的历史记录
- ✅ **可视化**: 桑基图展示资产构成
- ✅ **跨设备同步**: 通过Chrome账户自动同步数据
- ✅ **离线使用**: 完全无需网络连接

## 安装方法

### 1. 开发者模式安装

1. 打开Chrome浏览器，访问 `chrome://extensions/`
2. 启用右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择此项目的 `chrome-extension` 文件夹
5. 插件安装完成！

### 2. 生成图标（首次安装前）

请先阅读 `icons/README.md` 生成所需的PNG图标文件，或者暂时修改manifest.json移除图标配置。

## 使用方法

### 添加资产数据

1. 点击浏览器工具栏中的插件图标
2. 点击"更新资产"按钮
3. 填写各类资产金额
4. 点击"保存"

### 查看更新记录

1. 点击"更新记录"按钮
2. 查看按日期分组的所有历史更新记录
3. 每条记录显示具体的资产变化

### 数据导出与导入

在插件页面中可以：
- 导出所有数据为JSON文件
- 从JSON文件恢复数据

## 技术架构

### 前端框架
- React 19 (通过CDN引入)
- ReactDOM 19
- Babel (用于解析JSX)

### 数据存储
- Chrome Storage API
  - `chrome.storage.local`: 存储大量数据
  - `chrome.storage.sync`: 跨设备同步设置

### 可视化
- D3.js v7
- D3-Sankey

### 样式
- 自定义CSS
- 响应式设计

## 项目结构

```
chrome-extension/
├── manifest.json          # 插件配置文件
├── popup.html            # 弹窗页面
├── styles.css           # 样式文件
├── icons/              # 图标文件目录
│   ├── icon.svg       # SVG源图标
│   └── README.md      # 图标生成说明
└── src/                # 源代码目录
    ├── App.jsx        # 主应用组件
    └── storage.ts     # 数据存储服务
```

## 数据结构

### 资产数据格式
```typescript
{
  currentDeposit: number,  // 银行活期
  alipay: number,         // 支付宝
  wechat: number,         // 微信
  car: number,            // 车辆价值
  house: number,          // 房产价值
  fixedDeposit: number,   // 定期存款
  stocks: number,         // 股票基金
  receivable: number,     // 他人借款
  carLoan: number,        // 车贷
  mortgage: number,       // 房贷
  borrowing: number       // 借贷
}
```

### 记录数据格式
```typescript
{
  id: string,
  title: string,
  amount: number,
  date: string,
  category: string,
  subCategory: string,
  description: AssetData,
  createdAt: string,
  updatedAt: string
}
```

## 开发说明

### 本地测试

1. 修改代码后，在 `chrome://extensions/` 页面点击刷新按钮
2. 重新加载插件以应用更改

### 调试方法

1. 右键点击插件图标，选择"检查弹出内容"
2. 使用Chrome开发者工具进行调试

### 权限说明

插件需要以下权限：
- `storage`: 访问Chrome Storage API
- `unlimitedStorage`: 无限制存储空间

## 未来计划

- [ ] 添加数据备份提醒功能
- [ ] 支持多货币类型
- [ ] 添加资产增长趋势图表
- [ ] 支持数据导出为Excel格式
- [ ] 添加预算管理功能
- [ ] 支持标签和备注

## 隐私政策

本插件完全尊重用户隐私：

1. 所有数据存储在用户浏览器本地
2. 不向任何服务器发送数据
3. 不收集任何用户信息
4. 数据仅通过Chrome官方同步功能进行设备间同步

## 开源许可

本项目基于原Next.js项目改造而来，保留相应的开源许可。

## 联系方式

如有问题或建议，欢迎提issue或PR。