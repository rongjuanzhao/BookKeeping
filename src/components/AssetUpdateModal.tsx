"use client";

import { useState } from 'react';
import Form from './Form';

// 定义类型
interface FormData {
  [key: string]: number;
}

interface AssetUpdateModalProps {
  isVisible: boolean;
  onClose: () => void;
  initialData?: FormData;
  onSubmit?: (formData: FormData) => void;
}

const AssetUpdateModal = ({ isVisible, onClose, initialData, onSubmit }: AssetUpdateModalProps) => {
  // 如果不可见，不渲染任何内容
  if (!isVisible) return null;

  const handleSubmit = (formData: FormData) => {
    // 调用父组件传递的onSubmit函数
    if (typeof onSubmit === 'function') {
      onSubmit(formData);
    }
    // 关闭模态框
    onClose();
  };

  return (
    <div 
      className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-1000" 
      onClick={(e) => {
        // 点击遮罩层关闭模态框
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-5xl max-h-[90vh] overflow-y-auto w-full relative">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="m-0 text-gray-800 text-2xl">更新资产信息</h3>
          <button
            className="bg-none border-none text-3xl cursor-pointer text-gray-500 p-0 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 hover:bg-gray-200 hover:text-gray-800"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="p-6">
          <Form
            initialData={initialData}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default AssetUpdateModal;