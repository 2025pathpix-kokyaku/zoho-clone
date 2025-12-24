'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Plus, Building, X, Calendar, User, LayoutGrid, List, Percent } from 'lucide-react';

type Customer = {
  id: number;
  name: string;
  contact_person: string;
};

type Deal = {
  id: number;
  title: string;
  amount: number;
  phase: string;
  expected_close_date: string;
  customer_id: number;
  probability: number;
  customers: {
    name: string;
    contact_person: string;
  } | null;
  created_at: string;
};

// 10段階のフェーズ定義と色分け
const PHASE_MAP: { [key: string]: string } = {
  'リード':      'bg-slate-50 border-slate-200 border-t-4 border-t-slate-400',
  '接触済':      'bg-slate-50 border-slate-200 border-t-4 border-t-blue-300',
  '情報提供':    'bg-blue-50 border-blue-200 border-t-4 border-t-blue-400',
  'ヒアリング':  'bg-blue-50 border-blue-200 border-t-4 border-t-blue-500',
  '提案準備':    'bg-indigo-50 border-indigo-200 border-t-4 border-t-indigo-400',
  '提案済':      'bg-purple-50 border-purple-200 border-t-4 border-t-purple-500',
  '検討中':      'bg-yellow-50 border-yellow-200 border-t-4 border-t-yellow-400',
  '保留':        'bg-orange-50 border-orange-200 border-t-4 border-t-orange-300',
  '契約':        'bg-green-50 border-green-200 border-t-4 border-t-green-500',
  '見送り':      'bg-gray-100 border-gray-300 border-t-4 border-t-gray-500'
};
const PHASES = Object.keys(PHASE_MAP);

export default function CRMDashboard() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [draggedDealId, setDraggedDealId] = useState<number | null>(null);

  const initialForm = {
    title: '',
    customer_id: '',
    amount: '',
    expected_close_date: '',
    phase: 'リード',
    probability: '10'
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    if(deals.length === 0) setLoading(true);
    const { data: dealsData } = await supabase
      .from('deals')
      .select('*, customers(name, contact_person)')
      .order('created_at', { ascending: false });

    const { data: custData } = await supabase
      .from('customers')
      .select('id, name, contact_person')
      .order('id');
    
    // @ts-ignore
    setDeals(dealsData || []);
    setCustomers(custData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ドラッグ＆ドロップ処理
  const handleDragStart = (e: React.DragEvent, dealId: number) => {
    setDraggedDealId(dealId);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('opacity-50');
  };
  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedDealId(null);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const handleDrop = async (e: React.DragEvent, targetPhase: string) => {
    e.preventDefault();
    if (draggedDealId === null) return;
    setDeals(prev => prev.map(deal => deal.id === draggedDealId ? { ...deal, phase: targetPhase } : deal));
    const { error } = await supabase.from('deals').update({ phase: targetPhase }).eq('id', draggedDealId);
    if (error) { alert('更新失敗'); fetchData(); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id) return alert('顧客を選択してください');
    const { error } = await supabase.from('deals').insert([{
      title: formData.title,
      customer_id: Number(formData.customer_id),
      amount: Number(formData.amount),
      expected_close_date: formData.expected_close_date,
      phase: formData.phase,
      probability: Number(formData.probability),
    }]);
    if (!error) {
      await fetchData();
      setIsModalOpen(false);
      setFormData(initialForm);
    } else {
      alert(error.message);
    }
  };

  if (loading) return <div className="p-10">読み込み中...</div>;

  return (
    <div className="flex flex-col h-full p-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-end mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">営業案件マスター</h1>
          <p className="text-sm text-slate-500 mt-1">
            進行中: {deals.length}件 / 合計: ¥{deals.reduce((sum, d) => sum + (d.amount || 0), 0).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white border border-slate-300 rounded-lg p-1 flex">
            <button onClick={() => setViewMode('kanban')} className={`p-2 rounded flex items-center gap-2 text-sm font-bold transition-all ${viewMode === 'kanban' ? 'bg-slate-100 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              <LayoutGrid size={18} /> カンバン
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded flex items-center gap-2 text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-slate-100 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              <List size={18} /> リスト
            </button>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-sm transition-all whitespace-nowrap">
            <Plus size={18} /> 案件登録
          </button>
        </div>
      </div>

      {/* --- カンバン表示モード (横スクロール対応) --- */}
      {viewMode === 'kanban' && (
        // ここを grid ではなく flex + overflow-x-auto に変更
        <div className="flex gap-4 h-full overflow-x-auto overflow-y-hidden pb-4 items-start">
          {PHASES.map((phase) => (
            <div 
              key={phase}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, phase)}
              // 幅を固定(min-w)にして横に並べる
              className={`min-w-[280px] w-[280px] p-3 rounded-lg flex flex-col h-full border shadow-sm transition-colors ${PHASE_MAP[phase]}`}
            >
              <h2 className="font-bold text-slate-700 mb-3 px-1 flex justify-between items-center text-sm">
                {phase}
                <span className="bg-white text-slate-500 px-2 py-0.5 rounded-full text-xs border shadow-sm font-mono">
                  {deals.filter((d) => d.phase === phase).length}
                </span>
              </h2>

              <div className="flex-1 overflow-y-auto space-y-3 px-1 pb-2">
                {deals
                  .filter((deal) => deal.phase === phase)
                  .map((deal) => (
                    <div
                      key={deal.id}
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                      onDragEnd={handleDragEnd}
                      className="bg-white p-3 rounded shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-400 transition-all cursor-grab active:cursor-grabbing group relative"
                    >
                      <span className="absolute top-2 right-2 text-[10px] text-slate-300 font-mono">#{deal.id}</span>
                      <h3 className="font-bold text-slate-800 mb-1 leading-snug group-hover:text-blue-600 pr-6 text-sm">
                        {deal.title}
                      </h3>
                      
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2 bg-slate-50 p-1.5 rounded">
                        <Building size={12} className="shrink-0" />
                        <span className="truncate">{deal.customers?.name}</span>
                      </div>
                      
                      <div className="space-y-1.5 pt-1 border-t border-slate-50">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                           <div className="flex items-center gap-1"><Calendar size={10}/> {deal.expected_close_date ? deal.expected_close_date.slice(5) : '-'}</div>
                           <div className="font-bold text-slate-500">{deal.probability}%</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">予定</span>
                          <span className="text-slate-800 font-bold text-sm font-mono">
                            ¥{deal.amount?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- リスト表示モード --- */}
      {viewMode === 'list' && (
        <div className="flex-1 bg-white rounded-lg shadow border border-slate-200 overflow-hidden flex flex-col">
          <div className="overflow-auto w-full h-full">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-4 font-semibold min-w-[80px]">ID</th>
                  <th className="p-4 font-semibold min-w-[250px]">案件名</th>
                  <th className="p-4 font-semibold min-w-[200px]">顧客名</th>
                  <th className="p-4 font-semibold min-w-[120px]">フェーズ</th>
                  <th className="p-4 font-semibold min-w-[100px]">確度</th>
                  <th className="p-4 font-semibold min-w-[150px]">予定金額</th>
                  <th className="p-4 font-semibold min-w-[150px]">受注予定日</th>
                  <th className="p-4 font-semibold min-w-[150px]">登録日</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                {deals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="p-4 font-mono text-xs text-slate-500">#{deal.id}</td>
                    <td className="p-4 font-bold text-slate-800">{deal.title}</td>
                    <td className="p-4">
                      <div className="font-medium text-slate-700">{deal.customers?.name}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded text-xs bg-slate-100 border border-slate-200">
                        {deal.phase}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${deal.probability}%` }}></div>
                        </div>
                        <span className="text-xs font-mono">{deal.probability}%</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold font-mono">¥{deal.amount?.toLocaleString()}</td>
                    <td className="p-4 text-slate-500">{deal.expected_close_date || '-'}</td>
                    <td className="p-4 text-slate-500 text-xs">{new Date(deal.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 新規登録モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">新規案件の登録</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">顧客を選択 <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select required className="w-full border border-slate-300 rounded-lg px-3 py-2.5 bg-white"
                      value={formData.customer_id} onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}>
                      <option value="">選択してください</option>
                      {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.contact_person})</option>)}
                    </select>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">案件名 <span className="text-red-500">*</span></label>
                  <input type="text" required className="w-full border border-slate-300 rounded-lg px-3 py-2.5"
                    placeholder="例：基幹システム刷新" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">予定金額 (円) <span className="text-red-500">*</span></label>
                  <input type="number" required className="w-full border border-slate-300 rounded-lg px-3 py-2.5"
                    value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">受注予定日</label>
                  <input type="date" required className="w-full border border-slate-300 rounded-lg px-3 py-2.5"
                    value={formData.expected_close_date} onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">現在のフェーズ</label>
                  <select className="w-full border border-slate-300 rounded-lg px-3 py-2.5 bg-white"
                    value={formData.phase} onChange={(e) => setFormData({ ...formData, phase: e.target.value })}>
                    {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">確度 (%)</label>
                  <div className="flex items-center gap-3">
                    <input type="range" min="0" max="100" step="10" className="flex-1"
                      value={formData.probability} onChange={(e) => setFormData({ ...formData, probability: e.target.value })} />
                    <span className="w-12 text-right font-mono font-bold">{formData.probability}%</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-50 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">キャンセル</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md">登録する</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}