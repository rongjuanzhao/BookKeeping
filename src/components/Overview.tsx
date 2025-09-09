"use client";

import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import AssetUpdateModal from './AssetUpdateModal';
import SankeyDiagram from './SankeyDiagram';

// 定义资产数据类型
interface AssetsData {
  currentDeposit: number; // 银行活期
  alipay: number;        // 支付宝
  wechat: number;        // 微信
  car: number;           // 车辆价值
  house: number;         // 房产价值
  fixedDeposit: number;  // 定期存款
  stocks: number;        // 股票基金
  receivable: number;    // 他人借款
  carLoan: number;       // 车贷
  mortgage: number;      // 房贷
  borrowing: number;     // 借贷
  [key: string]: number; // 索引签名，允许通过字符串键访问
}

const Overview = () => {
  const chartRef = useRef(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [Liabilities, setLiabilities] = useState(233)
  const [assetsData, setAssetsData] = useState<AssetsData>({
    currentDeposit: 0, // 银行活期
    alipay: 0,        // 支付宝
    wechat: 0,        // 微信
    car: 0,           // 车辆价值
    house: 0,         // 房产价值
    fixedDeposit: 0,  // 定期存款
    stocks: 0,        // 股票基金
    receivable: 0,    // 他人借款
    carLoan: 0,       // 车贷
    mortgage: 0,      // 房贷
    borrowing: 0      // 借贷
  });

  // 在组件挂载时从后端获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/bills');
        console.log('API响应状态:', response.status);

        if (response.ok) {
          const text = await response.text();
          console.log('API原始响应:', text);

          if (text && text !== 'bills' && text.length > 5) {
            try {
              const data = JSON.parse(text);
              console.log('解析后的数据:', data);

              if (data && data.length > 0 && data[0].description) {
                setAssetsData(data[0].description);
              } else {
                console.log('使用默认数据');
                setAssetsData({
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
                } as AssetsData);
              }
            } catch (parseError) {
              console.error('JSON解析错误:', parseError);
              setAssetsData({
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
              } as AssetsData);
            }
          } else {
            console.log('使用默认数据');
            setAssetsData({
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
            } as AssetsData);
          }
        } else {
          console.error('API响应错误:', response.status);
          setAssetsData({
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
          } as AssetsData);
        }
      } catch (error) {
        console.error('获取数据失败:', error);
        setAssetsData({
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
        } as AssetsData);
      }
    };

    // 只在API调用失败时使用默认数据
    // 移除直接设置默认数据的代码

    // 实际调用fetchData函数获取数据
    fetchData();
  }, []);

  // 更新资产数据的方法
  const handleUpdateData = (name: string, value: number) => {
    setAssetsData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (formData: any) => {
    try {
      console.log('提交表单数据:', formData);
      // 发送数据到后端API
      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        console.log('数据保存成功');
        // 更新本地状态
        setAssetsData(formData);
        // 重新获取数据以确保显示最新数据
        const fetchResponse = await fetch('/api/bills');
        if (fetchResponse.ok) {
          const data = await fetchResponse.json();
          if (data && data.length > 0 && data[0].description) {
            setAssetsData(data[0].description);
          }
        }
      } else {
        console.error('数据保存失败');
      }
    } catch (error) {
      console.error('保存数据时出错:', error);
    }

    console.log('关闭模态框');
    setModalVisible(false); // 关闭模态框
  };

  // 计算总资产
  // const totalAssets = Object.values(assetsData).reduce((sum, value) => sum + value, 0);

  const totalAssets = Object.entries(assetsData).reduce((sum, [key, value]) => {
    const liabilities = ['carLoan', 'mortgage', 'borrowing'];
    return liabilities.includes(key) ? sum - value : sum + value;
  }, 0);


  // 计算净资产（总资产减去固定资产和他人借款）
  const netWorth = totalAssets - (assetsData.car + assetsData.house + assetsData.receivable);
  //计算负债数据
  const liabilitiesData = assetsData.carLoan + assetsData.mortgage + assetsData.borrowing;

  return (
    <div className="flex min-h-screen bg-white w-full">
      {/* <Sidebar /> */}
      <main className="flex-1  bg-white min-h-screen w-full box-border">
        <header className="p-4 md:p-6 lg:p-8 bg-white shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className='text-2xl md:text-3xl font-bold text-red-500'>资产总览</h2>
          <Button
            variant="outline"
            size="default"
            onClick={() => {
              console.log('按钮被点击，准备显示弹窗');
              setModalVisible(true);
            }}
          >
            更新资产
          </Button>
        </header>

        <AssetUpdateModal
          isVisible={modalVisible}
          onClose={() => setModalVisible(false)}
          initialData={assetsData as any}
          onSubmit={handleSubmit}
        />

        <div className="p-4 md:p-6 flex flex-col gap-6 md:gap-8">
          {/* 资产总览 - 上半部分 */}
          <div className="bg-white rounded-xl p-4 md:p-6 lg:p-8 shadow-sm">
            <h3 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">资产总览</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8 my-4 md:my-6">
              <div className="text-center p-4 md:p-6 bg-gray-100 rounded-lg border border-gray-200">
                <label className="block text-gray-500 text-xs md:text-sm font-medium mb-2 md:mb-3 uppercase tracking-wider">总资产</label>
                <div className="text-xl md:text-3xl font-bold text-gray-800">¥{totalAssets.toLocaleString()}</div>
              </div>
              <div className="text-center p-4 md:p-6 bg-gray-100 rounded-lg border border-gray-200">
                <label className="block text-gray-500 text-xs md:text-sm font-medium mb-2 md:mb-3 uppercase tracking-wider">净资产</label>
                <div className="text-xl md:text-3xl font-bold text-gray-800">¥{netWorth.toLocaleString()}</div>
              </div>
              <div className="text-center p-4 md:p-6 bg-gray-100 rounded-lg border border-gray-200">
                <label className="block text-gray-500 text-xs md:text-sm font-medium mb-2 md:mb-3 uppercase tracking-wider">负债</label>
                <div className="text-xl md:text-3xl font-bold text-red-600">¥{liabilitiesData.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* 资产构成 - 下半部分 */}
          <div className="bg-white rounded-xl p-4 md:p-6 lg:p-8 shadow-sm">
            <h3 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">资产构成</h3>
            <div
              ref={chartRef}
              className="w-full min-h-[300px] md:min-h-[400px] lg:min-h-[500px] bg-white rounded-lg p-3 md:p-5 mt-3 md:mt-5"
            >
              <SankeyDiagram
                data={assetsData}
              />
            </div>
          </div>
        </div>
      </main>

    </div>
  );
};

export default Overview;


