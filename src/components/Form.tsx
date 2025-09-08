"use client";

import { useState, useEffect } from 'react';
import { useCategories } from '../contexts/CategoryContext';

// 定义类型
interface FormData {
  [key: string]: number;
}

interface Categories {
  [key: string]: string[];
}

interface FormProps {
  onUpdateData?: (name: string, value: number) => void;
  onSubmit?: (formData: FormData) => void;
  initialData?: FormData;
}

const Form = ({ onUpdateData, onSubmit, initialData = {} }: FormProps) => {
  const { getAllCategoriesWithItems } = useCategories();
  const [formData, setFormData] = useState<FormData>({});
  const [categories, setCategories] = useState<Categories>({});

  // 根据分类数据动态生成表单结构
  useEffect(() => {
    const allCategories = getAllCategoriesWithItems();
    const initialFormData: FormData = {};
    
    Object.entries(allCategories).forEach(([category, items]) => {
      items.forEach((item, index) => {
        // 将中文转换为英文字段名
        const fieldName = convertToFieldName(category, item, index);
        // 使用传入的初始数据，如果没有则默认为0
        initialFormData[fieldName] = initialData[fieldName] !== undefined ? initialData[fieldName] : 0;
      });
    });
    
    setFormData(initialFormData);
    setCategories(allCategories);
  }, [getAllCategoriesWithItems, initialData]);  // 添加initialData到依赖数组

  // 将中文分类和子项转换为英文字段名
  const convertToFieldName = (category: string, item: string, index: number): string => {
    const categoryMap: { [key: string]: { [key: string]: string } } = {
      '流动资金': {
        '银行活期': 'currentDeposit',
        '支付宝': 'alipay',
        '微信': 'wechat'
      },
      '固定资产': {
        '车辆价值': 'car',
        '房产价值': 'house'
      },
      '投资理财': {
        '定期存款': 'fixedDeposit',
        '股票基金': 'stocks'
      },
      '应收款项': {
        '他人借款': 'receivable'
      },
      '负债': {
        '车贷': 'carLoan',
        '房贷': 'mortgage',
        '借贷': 'borrowing'
      }
    };

    // 对于默认子项，使用预定义的字段名
    if (categoryMap[category] && categoryMap[category][item]) {
      return categoryMap[category][item];
    } else {
      // 为自定义子项创建唯一标识符，包含索引确保唯一性
      const safeCategory = category.replace(/[^a-zA-Z0-9]/g, '');
      const safeItem = item.replace(/[^a-zA-Z0-9]/g, '');
      return `${safeCategory}_${safeItem}_${index}`;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = Math.max(0, Number(value) || 0);
    setFormData(prev => ({
      ...prev,
      [name]: numericValue
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 如果提供了onUpdateData回调，则更新所有数据
    if (typeof onUpdateData === 'function') {
      Object.entries(formData).forEach(([key, value]) => {
        onUpdateData(key, value);
      });
    }

    // 如果提供了onSubmit回调，则提交表单数据
    if (typeof onSubmit === 'function') {
      onSubmit(formData);
    }
  };

  const renderFormFields = () => {
    if (!categories || Object.keys(categories).length === 0) {
      return <div>加载中...</div>;
    }

    return Object.entries(categories).map(([category, items]) => (
      <fieldset key={category} className="mb-6 p-0 pb-6 border-none border-b border-gray-200 rounded-none">
        <legend className="text-lg font-semibold mb-4">{category}</legend>
        {items.map((item, index) => {
          const fieldName = convertToFieldName(category, item, index);
          return (
            <div key={fieldName} className="flex items-center my-2.5">
              <label className="w-auto min-w-[120px] mr-4 text-left text-gray-700 font-medium">{item}：</label>
              <input className="p-3 border border-gray-300 rounded-lg w-full max-w-[300px] text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring focus:ring-blue-200 hover:border-gray-500"
                type="number"
                name={fieldName}
                value={formData[fieldName] !== undefined ? formData[fieldName] : 0}  // 使用formData中的值
                onChange={handleChange}
                min="0"
                required
              />
            </div>
          );
        })}
      </fieldset>
    ));
  };

  return (
    <form className="max-w-full m-0 p-0 bg-transparent rounded-none" onSubmit={handleSubmit}>
      {renderFormFields()}
      <button type="submit" className="block mx-auto mt-6 p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-none rounded-lg text-lg font-semibold cursor-pointer w-full max-w-[300px] transition-all duration-300 shadow-lg hover:transform hover:-translate-y-0.5 hover:shadow-xl active:transform active:translate-y-0">
        提交资产信息
      </button>
    </form>
  );
};

export default Form;