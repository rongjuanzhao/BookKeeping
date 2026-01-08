"use client";

import { useEffect, useState } from 'react';

interface UpdateRecord {
  id: string;
  date: string;
  description: {
    [key: string]: number;
  };
}

interface UpdateRecordsModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const UpdateRecordsModal = ({ isVisible, onClose }: UpdateRecordsModalProps) => {
  const [updateRecords, setUpdateRecords] = useState<UpdateRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      fetchUpdateRecords();
    }
  }, [isVisible]);

  const fetchUpdateRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/bills');
      if (response.ok) {
        const data = await response.json();
        setUpdateRecords(data);
      } else {
        setError('获取更新记录失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  const formatChineseDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    return `${year}年${month}月${day}日 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const getAssetName = (key: string): string => {
    const assetNames: { [key: string]: string } = {
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
    return assetNames[key] || key;
  };

  const groupRecordsByDate = () => {
    const grouped: { [key: string]: UpdateRecord[] } = {};

    updateRecords.forEach(record => {
      const date = new Date(record.date);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(record);
    });

    return grouped;
  };

  const renderRecordDetails = (record: UpdateRecord) => {
    const description = record.description || {};

    return (
      <div key={record.id} className="bg-gray-50 rounded-lg p-4 mb-3">
        <div className="text-sm text-gray-500 mb-2">
          更新时间: {formatChineseDate(record.date)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {Object.entries(description).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center text-sm">
              <span className="text-gray-700">{getAssetName(key)}:</span>
              <span className={`font-medium ${value < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                ¥{value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const groupedRecords = groupRecordsByDate();
  const sortedDates = Object.keys(groupedRecords).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800 m-0">更新记录</h3>
          <button
            className="bg-none border-none text-3xl cursor-pointer text-gray-500 p-0 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 hover:bg-gray-200 hover:text-gray-800"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading && (
            <div className="text-center py-8 text-gray-500">
              加载中...
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-500">
              {error}
            </div>
          )}

          {!loading && !error && updateRecords.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              暂无更新记录
            </div>
          )}

          {!loading && !error && updateRecords.length > 0 && (
            <div>
              {sortedDates.map(dateKey => (
                <div key={dateKey} className="mb-6">
                  <div className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                    {dateKey}
                  </div>
                  {groupedRecords[dateKey].map(record => renderRecordDetails(record))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateRecordsModal;