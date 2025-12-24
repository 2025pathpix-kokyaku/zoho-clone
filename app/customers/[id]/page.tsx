'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/utils/supabase';
import { User, Phone, Mail, MapPin, Calendar, Plus, FileText, LayoutDashboard, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// 型定義
type CustomerDetail = {
  id: number;
  customer_code: string;
  name: string;
  type: string;
  contact_person: string;
  department: string;
  email: string;
  phone: string;
  address: string;
  region: string;
  last_contact_date: string;
  registration_date: string;
  owner: string;
  referral_source: string;
  referral_details: string;
  rank: string;
  status: string;
};

type RelatedDeal = {
  id: number;
  title: string;
  phase: string;
  amount: number;
  expected_close_date: string;
};

type RelatedContract = {
  id: number;
  start_date: string;
  end_date: string;
  status: string;
  deals: { title: string };
};

type ContactLog = {
  id: number;
  contact_date: string;
  method: string;
  note: string;
  created_by: string;
};

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState<string>('');
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [deals, setDeals] = useState<RelatedDeal[]>([]);
  const [contracts, setContracts] = useState<RelatedContract[]>([]);
  const [logs, setLogs] = useState<ContactLog[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // コンタクト履歴用の入力フォーム
  const [logForm, setLogForm] = useState({
    contact_date: new Date().toISOString().split('T')[0],
    method: '電話',
    note: '',
    created_by: '自分'
  });

  // paramsをアンラップしてIDを取得
  useEffect(() => {
    params.then(unwrappedParams => {
      setId(unwrappedParams.id);
    });
  }, [params]);

  // IDが取得できたらデータを読み込む
  useEffect(() => {
    if (id) fetchAllData();
  }, [id]);

  const fetchAllData = async () => {
    if (!id) return;

    // 1. 顧客基本情報
    const { data: cust } = await supabase.from('customers').select('*').eq('id', id).single();
    setCustomer(cust);

    // 2. 関連案件 (Sales Master)
    const { data: dealData } = await supabase.from('deals').select('*').eq('customer_id', id).order('created_at', { ascending: false });
    setDeals(dealData || []);

    // 3. 関連契約 (Contracts) - 案件を経由して取得するのは複雑なため、今回は契約テーブルの設計次第だが、
    // ここでは簡易的に「案件ID」経由で取得するロジックが必要。
    // ※今回は表示デモのため、契約テーブルに直接customer_idがない場合はdeal経由で取る必要がありますが、
    //  SQL簡易化のため「全ての契約」から「この顧客の案件」に紐づくものをフィルタリングします。
    if (dealData && dealData.length > 0) {
      const dealIds = dealData.map(d => d.id);
      const { data: conData } = await supabase
        .from('contracts')
        .select('*, deals(title)')
        .in('deal_id', dealIds);
      // @ts-ignore
      setContracts(conData || []);
    }

    // 4. コンタクト履歴
    const { data: logData } = await supabase.from('contact_logs').select('*').eq('customer_id', id).order('contact_date', { ascending: false });
    setLogs(logData || []);
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('contact_logs').insert([{
      customer_id: Number(id),
      ...logForm
    }]);

    if (!error) {
      // 顧客の最終接触日も更新する
      await supabase.from('customers').update({ last_contact_date: logForm.contact_date }).eq('id', id);
      
      await fetchAllData();
      setIsLogModalOpen(false);
      setLogForm({ ...logForm, note: '' });
    }
  };

  if (!customer) return <div className="p-10">読み込み中...</div>;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* トップヘッダーエリア */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm shrink-0">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            {customer.name}
            <span className="text-sm font-normal text-slate-500 border px-2 py-0.5 rounded bg-slate-50">
              {customer.customer_code}
            </span>
          </h1>
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
            customer.rank === 'A' || customer.rank === 'S' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
          }`}>
            ランク: {customer.rank}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs ${
            customer.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {customer.status}
          </span>
        </div>

        {/* タブメニュー */}
        <div className="flex gap-6 mt-4 text-sm font-medium text-slate-500">
          {['overview', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 border-b-2 transition-colors ${
                activeTab === tab 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent hover:text-slate-700'
              }`}
            >
              {tab === 'overview' ? '基本情報・案件・契約' : 'コンタクト履歴'}
            </button>
          ))}
        </div>
      </div>

      {/* コンテンツエリア (スクロール) */}
      <div className="flex-1 overflow-y-auto p-6">
        
        {/* --- タブ: 基本情報・案件・契約 --- */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-3 gap-6">
            
            {/* 左カラム: 顧客情報カード */}
            <div className="col-span-1 space-y-6">
              <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <User size={18} className="text-blue-600" /> 担当者情報
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-slate-400 text-xs">氏名 / 部署</div>
                    <div className="font-medium">{customer.contact_person} <span className="text-slate-500 text-xs ml-1">{customer.department}</span></div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs">メールアドレス</div>
                    <div className="flex items-center gap-2">{customer.email || '-'}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs">電話番号</div>
                    <div className="flex items-center gap-2">{customer.phone || '-'}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <MapPin size={18} className="text-blue-600" /> 住所情報
                </h3>
                <div className="text-sm">
                  <div className="text-slate-400 text-xs mb-1">地域: {customer.region}</div>
                  <div>{customer.address}</div>
                </div>
              </div>
            </div>

            {/* 右カラム: 関連データ */}
            <div className="col-span-2 space-y-6">
              
              {/* 営業案件 (Sales Master) */}
              <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <LayoutDashboard size={18} className="text-blue-600" /> 営業案件 ({deals.length})
                  </h3>
                  <Link href="/" className="text-xs text-blue-600 hover:underline">全案件を見る</Link>
                </div>
                {deals.length > 0 ? (
                  <div className="space-y-3">
                    {deals.map(deal => (
                      <div key={deal.id} className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-100">
                        <div>
                          <div className="font-bold text-slate-800">{deal.title}</div>
                          <div className="text-xs text-slate-500">完了予定: {deal.expected_close_date}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-800">¥{deal.amount.toLocaleString()}</div>
                          <span className="text-xs px-2 py-0.5 bg-white border rounded text-slate-500">{deal.phase}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-400 text-sm">案件履歴はありません</div>
                )}
              </div>

              {/* 契約情報 (Contracts) */}
              <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <FileText size={18} className="text-blue-600" /> 契約履歴 ({contracts.length})
                  </h3>
                  <Link href="/contracts" className="text-xs text-blue-600 hover:underline">全契約を見る</Link>
                </div>
                {contracts.length > 0 ? (
                  <div className="space-y-3">
                    {contracts.map(con => (
                      <div key={con.id} className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-100">
                        <div>
                          <div className="font-bold text-slate-800">{con.deals?.title} の契約</div>
                          <div className="text-xs text-slate-500">{con.start_date} 〜 {con.end_date}</div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${con.status === '有効' ? 'bg-green-100 text-green-700' : 'bg-slate-200'}`}>
                          {con.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-400 text-sm">契約履歴はありません</div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* --- タブ: コンタクト履歴 --- */}
        {activeTab === 'history' && (
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">活動タイムライン</h2>
              <button 
                onClick={() => setIsLogModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm text-sm font-bold"
              >
                <Plus size={16} /> ログを追加
              </button>
            </div>

            <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 pb-8">
              {logs.map((log) => (
                <div key={log.id} className="relative pl-8">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700">{log.method}</span>
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">記録: {log.created_by}</span>
                      </div>
                      <span className="text-sm text-slate-500 flex items-center gap-1">
                        <Clock size={14} /> {log.contact_date.split('T')[0]}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm whitespace-pre-wrap">{log.note}</p>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="pl-8 text-slate-400 text-sm">まだ活動履歴がありません</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* コンタクトログ追加モーダル */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">活動履歴を追加</h3>
            <form onSubmit={handleAddLog} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">日付</label>
                <input type="date" className="w-full border p-2 rounded"
                  value={logForm.contact_date} onChange={e => setLogForm({...logForm, contact_date: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">方法</label>
                <select className="w-full border p-2 rounded bg-white"
                  value={logForm.method} onChange={e => setLogForm({...logForm, method: e.target.value})}>
                  <option>電話</option>
                  <option>メール</option>
                  <option>オンライン会議</option>
                  <option>訪問</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">内容メモ</label>
                <textarea className="w-full border p-2 rounded h-24" placeholder="会話の内容などを記録..."
                  value={logForm.note} onChange={e => setLogForm({...logForm, note: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsLogModalOpen(false)} className="px-4 py-2 text-slate-600 bg-slate-100 rounded">キャンセル</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-bold">追加</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}