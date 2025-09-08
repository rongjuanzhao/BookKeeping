"use client";

import React, { useState } from 'react';
import { useCategories } from '../contexts/CategoryContext';

// 默认分类和子项配置
const defaultCategories: { [key: string]: { defaultItems: string[]; icon: string } } = {
  '流动资金': { defaultItems: ['银行活期', '支付宝', '微信'], icon: '💰' },
  '固定资产': { defaultItems: ['车辆价值', '房产价值'], icon: '🏠' },
  '投资理财': { defaultItems: ['定期存款', '股票基金'], icon: '📈' },
  '应收款项': { defaultItems: ['他人借款'], icon: '📋' },
  '负债': { defaultItems: ['车贷', '房贷', '借贷'], icon: '💳' }
};

interface NewItemName {
  [key: string]: string;
}

export default function CategoryManagement() {
  const { addCustomItem, deleteCustomItem, categories } = useCategories();
  const [newItemName, setNewItemName] = useState<NewItemName>({});
  const [activeCategory, setActiveCategory] = useState<string>('流动资金');

  const handleAddItem = (category: string) => {
    const itemName = newItemName[category]?.trim();
    if (!itemName) return;
    addCustomItem(category, itemName);
    setNewItemName(prev => ({ ...prev, [category]: '' }));
  };

  const handleDeleteItem = (category: string, index: number) => {
    deleteCustomItem(category, index);
  };

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h2 className="text-gray-800 pb-2.5 mb-5" style={{ textAlign: 'left' }}>分类管理</h2>
      
      <div className="flex gap-2.5 mb-7.5 flex-wrap">
        {Object.keys(defaultCategories).map(category => (
          <button
            key={category}
            className={`p-3 border-none bg-gray-800 text-white rounded-lg cursor-pointer transition-all duration-300 flex items-center gap-2 ${
              activeCategory === category ? 'bg-blue-500' : 'hover:bg-gray-700'
            }`}
            onClick={() => setActiveCategory(category)}
          >
            <span className="text-xl">{defaultCategories[category].icon}</span>
            {category}
          </button>
        ))}
      </div>

      <div className="category-content">
        {Object.keys(categories).map(category => (
          activeCategory === category && (
            <div key={category} className="category-section mb-5">
              <h3 className="text-gray-800 mb-5 text-lg">{defaultCategories[category].icon} {category}</h3>
              
              <div className="items-list">
                <h4 className="text-gray-400 my-2.5 text-sm">默认子项</h4>
                <div className="default-items">
                  {categories[category]?.defaultItems?.map((item, index) => (
                    <div key={`default-${index}`} className="flex justify-between items-center p-3 my-1.5 rounded-lg border border-gray-400 text-gray-900">
                      <span>{item}</span>
                      <span className="text-xs bg-gray-500 p-1 px-2 rounded-xl">默认</span>
                    </div>
                  ))}
                </div>

                <h4 className="text-gray-400 my-2.5 text-sm">自定义子项</h4>
                <div className="custom-items">
                  {categories[category]?.customItems?.map((item, index) => (
                    <div key={`custom-${index}`} className="flex justify-between items-center p-3 my-1.5 rounded-lg border border-gray-400 text-gray-900">
                      <span>{item}</span>
                      <button 
                        className="bg-red-500 text-white border-none p-1.5 px-3 rounded cursor-pointer text-sm hover:bg-red-600"
                        onClick={() => handleDeleteItem(category, index)}
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>

                <div className="add-item-section mt-5 flex gap-2.5 items-center">
                  <input
                    type="text"
                    className="flex-1 p-2.5 border border-gray-400 rounded text-gray-900 bg-white"
                    placeholder="输入新子项名称"
                    value={newItemName[category] || ''}
                    onChange={(e) => setNewItemName(prev => ({ ...prev, [category]: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddItem(category)}
                  />
                  <button 
                    className="bg-green-500 text-white border-none p-2.5 px-5 rounded cursor-pointer hover:bg-green-600"
                    onClick={() => handleAddItem(category)}
                  >
                    添加子项
                  </button>
                </div>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}