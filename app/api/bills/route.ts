import prisma from '../../../server/prisma/client';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

export async function GET() {
  try {
    console.log('GET /api/bills - 开始获取数据');
    const bills = await prisma.bill.findMany({
      orderBy: { date: 'desc' }
    });

    console.log('GET /api/bills - 从数据库获取到:', bills);

    // 解析存储在description字段中的JSON字符串
    const parsedBills = bills.map(bill => {
      try {
        return {
          ...bill,
          description: JSON.parse(bill.description)
        };
      } catch (parseError) {
        console.error('解析description失败:', parseError);
        return {
          ...bill,
          description: {}
        };
      }
    });

    console.log('GET /api/bills - 返回解析后的数据:', parsedBills);
    return NextResponse.json(parsedBills);
  } catch (error: any) {
    console.error('GET /api/bills - 发生错误:', error);
    return NextResponse.json({
      message: error.message || '未知错误',
      stack: error.stack
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/bills - 开始处理请求');
    const body = await request.json();
    console.log('POST /api/bills - 接收到的数据:', body);

    // 先尝试查找现有记录
    const existingBill = await prisma.bill.findFirst({
      orderBy: { date: 'desc' }
    });

    console.log('POST /api/bills - 现有记录:', existingBill);

    // 将前端发送的扁平数据结构转换为Bill模型
    const billData = {
      title: '资产数据',
      amount: 0, // 总金额需要计算
      date: new Date(),
      category: '资产',
      subCategory: '',
      description: JSON.stringify(body) // 将前端数据存储在description中
    };

    console.log('POST /api/bills - 准备保存的数据:', billData);

    let bill;
    if (existingBill) {
      // 如果存在现有记录，则更新它
      console.log('POST /api/bills - 更新现有记录');
      bill = await prisma.bill.update({
        where: { id: existingBill.id },
        data: billData
      });
    } else {
      // 如果不存在现有记录，则创建新记录
      console.log('POST /api/bills - 创建新记录');
      bill = await prisma.bill.create({
        data: billData
      });
    }

    console.log('POST /api/bills - 数据库操作完成:', bill);

    // 解析存储在description字段中的JSON字符串
    const parsedBill = {
      ...bill,
      description: JSON.parse(bill.description)
    };

    console.log('POST /api/bills - 返回的数据:', parsedBill);

    return NextResponse.json(parsedBill);
  } catch (error: any) {
    console.error('POST /api/bills - 发生错误:', error);
    return NextResponse.json({
      message: error.message || '未知错误',
      stack: error.stack
    }, { status: 500 });
  }
}
