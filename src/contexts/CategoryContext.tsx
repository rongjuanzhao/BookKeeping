"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 定义类型
interface CategoryConfig {
  defaultItems: string[];
  icon: string;
}

interface CategoryData {
  defaultItems: string[];
  customItems: string[];
}

interface Categories {
  [key: string]: CategoryData;
}

interface CategoryContextType {
  categories: Categories;
  addCustomItem: (category: string, itemName: string) => void;
  deleteCustomItem: (category: string, index: number) => void;
  getAllItems: (category: string) => string[];
  getAllCategoriesWithItems: () => { [key: string]: string[] };
}

// 默认分类和子项配置
const defaultCategories: { [key: string]: CategoryConfig } = {
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

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};

interface CategoryProviderProps {
  children: ReactNode;
}

export const CategoryProvider = ({ children }: CategoryProviderProps) => {
  const [categories, setCategories] = useState<Categories>({});

  // 初始化分类数据
  useEffect(() => {
    const initialized: Categories = {};
    Object.keys(defaultCategories).forEach(category => {
      initialized[category] = {
        defaultItems: [...defaultCategories[category].defaultItems],
        customItems: []
      };
    });
    setCategories(initialized);
  }, []);

  // 添加自定义子项
  const addCustomItem = (category: string, itemName: string) => {
    if (!itemName?.trim()) return;

    setCategories(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        customItems: [...prev[category].customItems, itemName.trim()]
      }
    }));
  };

  // 删除自定义子项
  const deleteCustomItem = (category: string, index: number) => {
    setCategories(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        customItems: prev[category].customItems.filter((_, i) => i !== index)
      }
    }));
  };

  // 获取所有子项（包括默认和自定义）
  const getAllItems = (category: string) => {
    if (!categories[category]) return [];
    return [...categories[category].defaultItems, ...categories[category].customItems];
  };

  // 获取所有分类的所有子项
  const getAllCategoriesWithItems = () => {
    const result: { [key: string]: string[] } = {};
    Object.keys(defaultCategories).forEach(category => {
      result[category] = getAllItems(category);
    });
    return result;
  };

  const value: CategoryContextType = {
    categories,
    addCustomItem,
    deleteCustomItem,
    getAllItems,
    getAllCategoriesWithItems
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
};