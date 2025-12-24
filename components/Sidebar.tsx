'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, Settings, PieChart } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'ダッシュボード', href: '/dashboard', icon: PieChart },
    { name: '案件管理', href: '/', icon: LayoutDashboard },
    { name: '顧客リスト', href: '/customers', icon: Users },
    { name: '契約管理', href: '/contracts', icon: FileText },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col fixed left-0 top-0 border-r border-slate-800 overflow-y-auto">
      <div className="p-6 border-b border-slate-800 shrink-0">
        <h1 className="text-xl font-bold tracking-wider flex items-center gap-2">
          <span className="text-blue-500 text-2xl">●</span> My CRM
        </h1>
      </div>
      
      <nav className="flex-1 py-6 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg font-bold' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 shrink-0">
        <button className="flex items-center gap-3 text-slate-400 hover:text-white px-4 py-2 w-full transition-colors">
          <Settings size={20} />
          <span>設定</span>
        </button>
      </div>
    </div>
  );
}