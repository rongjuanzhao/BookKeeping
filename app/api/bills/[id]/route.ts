import prisma from '../../../../server/prisma/client';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const bill = await prisma.bill.update({
      where: { id: parseInt(id) },
      data: {
        date: new Date(),
        description: JSON.stringify(body) // 更新数据
      }
    });
    
    // 解析存储在description字段中的JSON字符串
    const parsedBill = {
      ...bill,
      description: JSON.parse(bill.description)
    };
    
    return NextResponse.json(parsedBill);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    await prisma.bill.delete({
      where: { id: parseInt(id) }
    });
    
    return NextResponse.json({ message: 'Bill deleted' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
