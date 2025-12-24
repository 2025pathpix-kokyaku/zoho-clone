'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Plus, Search, MapPin, Mail, Phone, User, X, Calendar, Clock } from 'lucide-react';
import Link from 'next/link'; // リンク機能を追加

// 型定義
type Customer = {
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
  image_url: string;
  status: string;
};

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // フォーム初期値
  const initialFormState = {
    customer_code: '',
    name: '',
    type: '企業',
    contact_person: '',
    department: '',
    email: '',
    phone: '',
    address: '',
    region: '関東',
    owner: '自分',
    referral_source: '',
    referral_details: '',
    rank: 'C',
    status: 'Active',
    image_url: '',
    last_contact_date: '',
    registration_date: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('id', { ascending: true });
      
    if (error) console.error(error);
    else setCustomers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeToSave = formData.customer_code || `C-${Date.now().toString().slice(-6)}`;
    const today = new Date().toISOString().split('T')[0];
    const regDate = formData.registration_date || today;

    const { error } = await supabase.from('customers').insert([{
      ...formData,
      customer_code: codeToSave,
      registration_date: regDate,
    }]);

    if (error) {
      alert('エラー: ' + error.message);
    } else {
      await fetchCustomers();
      setIsModalOpen(false);
      setFormData(initialFormState);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contact_person.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-10">読み込み中...</div>;

  return (
    <div className="p-4 h-full flex flex-col">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          顧客マスター一覧
        </h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-3 py-2 rounded text-sm flex items-center gap-2 hover:bg-blue-700 shadow-sm font-bold whitespace-nowrap"
        >
          <Plus size={16} /> 新規顧客登録
        </button>
      </div>

      {/* 検索バー */}
      <div className="bg-white p-2 rounded shadow-sm border border-slate-200 mb-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="キーワード検索 (会社名、担当者、IDなど)" 
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 一覧テーブル */}
      <div className="flex-1 overflow-auto bg-white rounded border border-slate-200 shadow-sm">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 text-xs font-bold sticky top-0 z-10">
            <tr>
              <th className="p-3 min-w-[80px]">ID</th>
              <th className="p-3 min-w-[200px]">顧客名 / タイプ</th>
              <th className="p-3 min-w-[60px]">ランク</th>
              <th className="p-3 min-w-[150px]">担当者 / 部署</th>
              <th className="p-3 min-w-[200px]">連絡先 (メール/電話)</th>
              <th className="p-3 min-w-[200px]">住所 / 地域</th>
              <th className="p-3 min-w-[100px]">自社担当</th>
              <th className="p-3 min-w-[120px]">紹介情報</th>
              <th className="p-3 min-w-[120px]">日付 (登録/接触)</th>
              <th className="p-3 min-w-[80px]">状態</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
            {filteredCustomers.map((c) => (
              <tr key={c.id} className="hover:bg-blue-50 transition-colors">
                <td className="p-3 font-mono text-xs text-slate-500">{c.customer_code}</td>
                
                {/* 顧客名をクリック可能に変更 */}
                <td className="p-3">
                  <Link href={`/customers/${c.id}`} className="font-bold text-blue-600 hover:underline cursor-pointer text-base block">
                    {c.name}
                  </Link>
                  <span className="inline-block text-[10px] px-1.5 py-0.5 bg-slate-100 border rounded text-slate-500 mt-1">
                    {c.type}
                  </span>
                </td>

                <td className="p-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold text-center w-8 ${
                    c.rank === 'S' || c.rank === 'A' ? 'bg-orange-100 text-orange-700' : 
                    c.rank === 'B' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {c.rank}
                  </span>
                </td>

                <td className="p-3">
                  <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    <User size={14} className="text-slate-400" />
                    {c.contact_person}
                  </div>
                  {c.department && <div className="text-xs text-slate-500 pl-5 mt-0.5">{c.department}</div>}
                </td>

                <td className="p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Mail size={12} className="text-slate-400" />
                    <span className="truncate max-w-[150px]" title={c.email}>{c.email || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Phone size={12} className="text-slate-400" />
                    {c.phone || '-'}
                  </div>
                </td>

                <td className="p-3">
                   <div className="text-xs text-slate-500 mb-0.5">[{c.region}]</div>
                   <div className="flex items-start gap-1 text-xs truncate max-w-[180px]" title={c.address}>
                     <MapPin size={12} className="mt-0.5 text-slate-400 shrink-0" />
                     {c.address || '-'}
                   </div>
                </td>

                <td className="p-3 text-xs">{c.owner}</td>

                <td className="p-3 text-xs">
                  <div>元: {c.referral_source || '-'}</div>
                  <div className="text-slate-400 truncate max-w-[100px]" title={c.referral_details}>
                    {c.referral_details}
                  </div>
                </td>

                <td className="p-3 space-y-1 text-xs text-slate-500">
                  <div title="登録日"><span className="text-slate-400">登:</span> {c.registration_date}</div>
                  <div title="最終接触日"><span className="text-slate-400">触:</span> {c.last_contact_date || '-'}</div>
                </td>

                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                    c.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'
                  }`}>
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 新規登録モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-lg font-bold text-slate-800">新規顧客の登録</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              <form id="customerForm" onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. 基本情報 */}
                <div>
                  <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 border-b border-blue-100 pb-1">基本情報</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">顧客ID (自動)</label>
                      <input type="text" className="w-full text-sm border border-slate-300 rounded px-2 py-1.5 bg-slate-50"
                        value={formData.customer_code} onChange={e => setFormData({...formData, customer_code: e.target.value})} placeholder="自動採番" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">顧客名 (会社名/氏名) <span className="text-red-500">*</span></label>
                      <input required type="text" className="w-full text-sm border border-slate-300 rounded px-2 py-1.5"
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">顧客タイプ</label>
                      <select className="w-full text-sm border border-slate-300 rounded px-2 py-1.5 bg-white"
                        value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                        <option>企業</option>
                        <option>学校</option>
                        <option>自治体</option>
                        <option>個人</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">ランク</label>
                      <select className="w-full text-sm border border-slate-300 rounded px-2 py-1.5 bg-white"
                        value={formData.rank} onChange={e => setFormData({...formData, rank: e.target.value})}>
                        <option>S</option>
                        <option>A</option>
                        <option>B</option>
                        <option>C</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">ステータス</label>
                      <select className="w-full text-sm border border-slate-300 rounded px-2 py-1.5 bg-white"
                        value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                        <option value="Active">Active (有効)</option>
                        <option value="Inactive">Inactive (無効)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. 担当者・連絡先 */}
                <div>
                  <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 border-b border-blue-100 pb-1">担当者・連絡先</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">先方担当者名 <span className="text-red-500">*</span></label>
                      <input required type="text" className="w-full text-sm border border-slate-300 rounded px-2 py-1.5"
                        value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">部署</label>
                      <input type="text" className="w-full text-sm border border-slate-300 rounded px-2 py-1.5"
                        value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">メールアドレス</label>
                      <input type="email" className="w-full text-sm border border-slate-300 rounded px-2 py-1.5"
                        value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">電話番号</label>
                      <input type="tel" className="w-full text-sm border border-slate-300 rounded px-2 py-1.5"
                        value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* 3. 住所情報 */}
                <div>
                  <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 border-b border-blue-100 pb-1">住所情報</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">地域</label>
                      <select className="w-full text-sm border border-slate-300 rounded px-2 py-1.5 bg-white"
                        value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})}>
                        <option>関東</option>
                        <option>関西</option>
                        <option>中部</option>
                        <option>九州</option>
                        <option>その他</option>
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">詳細住所</label>
                      <input type="text" className="w-full text-sm border border-slate-300 rounded px-2 py-1.5"
                        value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* 4. 管理情報 */}
                <div>
                  <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 border-b border-blue-100 pb-1">管理情報</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">自社担当 (Owner)</label>
                      <input type="text" className="w-full text-sm border border-slate-300 rounded px-2 py-1.5"
                        value={formData.owner} onChange={e => setFormData({...formData, owner: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">紹介元</label>
                      <input type="text" className="w-full text-sm border border-slate-300 rounded px-2 py-1.5"
                        value={formData.referral_source} onChange={e => setFormData({...formData, referral_source: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">登録日</label>
                      <input type="date" className="w-full text-sm border border-slate-300 rounded px-2 py-1.5"
                        value={formData.registration_date} onChange={e => setFormData({...formData, registration_date: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">最終接触日</label>
                      <input type="date" className="w-full text-sm border border-slate-300 rounded px-2 py-1.5"
                        value={formData.last_contact_date} onChange={e => setFormData({...formData, last_contact_date: e.target.value})} />
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-xs font-bold text-slate-700 mb-1">紹介経緯・メモ</label>
                      <textarea className="w-full text-sm border border-slate-300 rounded px-2 py-1.5 h-16"
                        value={formData.referral_details} onChange={e => setFormData({...formData, referral_details: e.target.value})} />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded font-bold transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                form="customerForm"
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-bold shadow-md"
              >
                保存する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}