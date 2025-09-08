"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { name: '总览', path: '/' },
  { name: '分类管理', path: '/category-management' }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-60 bg-gray-800 text-white p-4 fixed h-full">
      <div className="text-xl font-semibold p-4 mb-8 border-b border-gray-700">个人财务管理</div>
      {menuItems.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          className={`p-4 my-2 rounded-lg transition-all duration-300 text-white no-underline ${
            pathname === item.path ? 'bg-gray-700' : 'hover:bg-gray-700'
          }`}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
}