'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Plus, FileText, Calendar, Search, X, ExternalLink, AlertCircle } from 'lucide-react';

// 型定義
type Contract = {
  id: number;
  deal_id: number;
  start_date: string;
  end_date: string;
  status: string;
  pdf_url: string;
  deals: {
    title: string;
    customers: {
      name: string;
    };
  } | null;
};

type DealSelect = {
  id: number;
  title: string;
  customers: {
    name: string;
  } | null;
};

export default function ContractList() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [dealOptions, setDealOptions] = useState<DealSelect[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const initialForm = {
    deal_id: '',
    start_date: '',
    end_date: '',
    status: '有効',
    pdf_url: ''
  };
  const [formData, setFormData] = useState(initialForm);

  // データ取得
  const fetchData = async () => {
    setLoading(true);

    // 1. 契約一覧（案件と顧客名を結合）
    const { data: contractData, error: conError } = await supabase
      .from('contracts')
      .select(`
        *,
        deals (
          title,
          customers ( name )
        )
      `)
      .order('id', { ascending: false });

    // 2. 登録用の案件リスト（受注済み案件のみ）
    // phase='契約' (旧:受注) のものを取得
    const { data: dealData, error: dealError } = await supabase
      .from('deals')
      .select('id, title, customers(name)')
      .eq('phase', '契約');

    if (conError) console.error(conError);
    if (dealError) console.error(dealError);

    // @ts-ignore
    setContracts(contractData || []);
    // @ts-ignore
    setDealOptions(dealData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('contracts').insert([{
      deal_id: Number(formData.deal_id),
      start_date: formData.start_date,
      end_date: formData.end_date,
      status: formData.status,
      pdf_url: formData.pdf_url
    }]);

    if (error) {
      alert('エラー: ' + error.message);
    } else {
      await fetchData();
      setIsModalOpen(false);
      setFormData(initialForm);
    }
  };

  // 検索フィルタリング
  const filteredContracts = contracts.filter(c => 
    c.deals?.customers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.deals?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(c.id).includes(searchTerm)
  );

  if (loading) return <div className="p-10 text-slate-500">データを読み込んでいます...</div>;

  return (
    <div className="p-6 h-full flex flex-col">
      {/* ヘッダー */}
      <div className="flex justify-between items-end mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">契約管理マスター</h1>
          <p className="text-sm text-slate-500 mt-1">
            有効な契約: {contracts.filter(c => c.status === '有効').length}件
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-sm transition-all"
        >
          <Plus size={18} /> 契約を登録
        </button>
      </div>

      {/* 検索バー */}
      <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 mb-4 flex gap-4 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="契約ID、会社名、案件名で検索..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 契約リストテーブル */}
      <div className="flex-1 bg-white rounded-lg shadow border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-auto w-full h-full">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4 font-semibold min-w-[100px]">契約ID</th>
                <th className="p-4 font-semibold min-w-[120px]">ステータス</th>
                <th className="p-4 font-semibold min-w-[250px]">顧客名 / 案件名</th>
                <th className="p-4 font-semibold min-w-[250px]">契約期間</th>
                <th className="p-4 font-semibold min-w-[150px]">契約書</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
              {filteredContracts.map((contract) => {
                // 期限切れチェック（簡易）
                const isExpired = new Date(contract.end_date) < new Date() && contract.status === '有効';
                
                return (
                  <tr key={contract.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="p-4 font-mono text-xs text-slate-500">#{contract.id}</td>
                    
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold border ${
                          contract.status === '有効' ? 'bg-green-50 text-green-700 border-green-200' : 
                          contract.status === '終了' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {contract.status}
                        </span>
                        {isExpired && (
                          <span className="text-xs text-red-500 flex items-center gap-1 font-bold">
                            <AlertCircle size={12} /> 期限切れ
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-slate-800">{contract.deals?.customers?.name}</div>
                      <div className="text-xs text-slate-500 mt-1">{contract.deals?.title}</div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-700 font-mono">
                        <Calendar size={14} className="text-slate-400" />
                        {contract.start_date} <span className="text-slate-300">➜</span> {contract.end_date}
                      </div>
                    </td>

                    <td className="p-4">
                      {contract.pdf_url ? (
                        <a 
                          href={contract.pdf_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline border border-blue-100 bg-blue-50 px-2 py-1.5 rounded transition-colors"
                        >
                          <FileText size={14} /> PDFを確認 <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-300">未登録</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredContracts.length === 0 && (
            <div className="p-10 text-center text-slate-400">
              該当する契約が見つかりません
            </div>
          )}
        </div>
      </div>

      {/* 登録モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">契約情報の登録</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">対象案件 (契約フェーズのみ) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select 
                    required 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-500"
                    value={formData.deal_id}
                    onChange={(e) => setFormData({...formData, deal_id: e.target.value})}
                  >
                    <option value="">選択してください</option>
                    {dealOptions.map(deal => (
                      <option key={deal.id} value={deal.id}>
                        {deal.customers?.name} - {deal.title}
                      </option>
                    ))}
                  </select>
                </div>
                {dealOptions.length === 0 && (
                  <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> ステータスが「契約」の案件のみ選択可能です
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">契約開始日</label>
                  <input required type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500"
                    value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">契約終了日</label>
                  <input required type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500"
                    value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">ステータス</label>
                <select className="w-full border border-slate-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-500"
                  value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="有効">有効</option>
                  <option value="終了">終了</option>
                  <option value="解約">解約</option>
                  <option value="契約準備中">契約準備中</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">契約書PDFのリンク (URL)</label>
                <div className="relative">
                  <FileText size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input type="text" className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/contract.pdf"
                    value={formData.pdf_url} onChange={(e) => setFormData({...formData, pdf_url: e.target.value})} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-50 mt-4">
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