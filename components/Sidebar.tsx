'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, Users, FileText, Settings, PieChart, Menu, X } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: 'ダッシュボード', href: '/dashboard', icon: PieChart },
    { name: '案件管理', href: '/', icon: LayoutDashboard },
    { name: '顧客リスト', href: '/customers', icon: Users },
    { name: '契約管理', href: '/contracts', icon: FileText },
  ];

  const handleMenuClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* スマホ用トップバー */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white z-50 flex items-center px-4 shadow-md justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsOpen(true)} className="p-1 hover:bg-slate-800 rounded">
            <Menu size={24} />
          </button>
          <span className="font-bold text-lg tracking-wider">Pathpix CRM</span>
        </div>
      </div>

      {/* 背景オーバーレイ */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* サイドバー本体 */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-slate-900 text-white z-50 border-r border-slate-800
        transition-transform duration-300 ease-in-out overflow-y-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static flex flex-col
      `}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
          <h1 className="text-xl font-bold tracking-wider flex items-center gap-2">
            {/* コーポレートカラーのアクセント */}
            <span className="text-[#92d050] text-2xl">●</span> Pathpix CRM
          </h1>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleMenuClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-[#92d050] text-slate-900 shadow-lg font-bold' // アクティブ時はコーポレートカラー背景に黒文字
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-slate-900' : ''} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 mt-auto shrink-0">
          <Link 
            href="/settings"
            onClick={handleMenuClick} 
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              pathname === '/settings'
                ? 'bg-[#92d050] text-slate-900 shadow-lg font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings size={20} />
            <span>設定</span>
          </Link>
        </div>
      </div>
    </>
  );
}