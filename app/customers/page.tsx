'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Plus, Search, MapPin, Mail, Phone, User, X, Edit, Trash2, Building, Layers, ExternalLink } from 'lucide-react';
import Link from 'next/link';

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
  last_contact_date: string | null;
  registration_date: string | null;
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
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

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`「${name}」を削除してもよろしいですか？`)) return;
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
      await fetchCustomers();
    } catch (error: any) {
      alert('削除エラー: ' + (error.message || '不明なエラー'));
    }
  };

  const openEditModal = (customer: Customer) => {
    setIsEditMode(true);
    setEditingId(customer.id);
    setFormData({
      customer_code: customer.customer_code || '',
      name: customer.name || '',
      type: customer.type || '企業',
      contact_person: customer.contact_person || '',
      department: customer.department || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      region: customer.region || '関東',
      owner: customer.owner || '',
      referral_source: customer.referral_source || '',
      referral_details: customer.referral_details || '',
      rank: customer.rank || 'C',
      status: customer.status || 'Active',
      image_url: customer.image_url || '',
      last_contact_date: customer.last_contact_date || '',
      registration_date: customer.registration_date || ''
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  // --- ID自動生成ロジック (R712251 形式) ---
  const generateNewId = async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const reiwa = year - 2018;
    const prefix = `R${reiwa}${month}${day}`;

    const { count } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .ilike('customer_code', `${prefix}%`);
    
    const nextNum = (count || 0) + 1;
    return `${prefix}${nextNum}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let codeToSave = formData.customer_code;
    if (!isEditMode && !codeToSave) {
      codeToSave = await generateNewId();
    }

    const cleanData = {
      ...formData,
      customer_code: codeToSave,
      registration_date: formData.registration_date || new Date().toISOString().split('T')[0],
      last_contact_date: formData.last_contact_date === '' ? null : formData.last_contact_date,
    };

    let error;
    try {
      if (isEditMode && editingId) {
        const { error: updateError } = await supabase.from('customers').update(cleanData).eq('id', editingId);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('customers').insert([cleanData]);
        error = insertError;
      }
      if (error) throw error;
      await fetchCustomers();
      setIsModalOpen(false);
      setFormData(initialFormState);
    } catch (error: any) {
      alert('保存エラー: ' + (error.message || '不明なエラー'));
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contact_person.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-10 text-slate-500">データを読み込み中...</div>;

  return (
    <div className="p-4 h-full flex flex-col max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4 shrink-0">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Building size={24} className="text-[#92d050]"/> 顧客マスター一覧
        </h1>
        <button onClick={openCreateModal} className="w-full sm:w-auto bg-[#92d050] text-slate-900 px-4 py-2.5 rounded text-sm flex justify-center items-center gap-2 hover:bg-[#82c040] shadow-sm font-bold whitespace-nowrap transition-colors">
          <Plus size={18} /> 新規顧客登録
        </button>
      </div>

      <div className="bg-white p-2 rounded shadow-sm border border-slate-200 mb-4 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="キーワード検索（会社名、担当者名など）..." 
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#92d050] focus:border-[#92d050] transition-all" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {/* --- PC用テーブル --- */}
      <div className="hidden md:block flex-1 overflow-auto bg-white rounded border border-slate-200 shadow-sm">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 text-xs font-bold sticky top-0 z-10">
            <tr>
              <th className="p-3 min-w-[80px]">ID</th>
              <th className="p-3 min-w-[200px]">顧客名 / タイプ</th>
              <th className="p-3 min-w-[60px]">ランク</th>
              <th className="p-3 min-w-[150px]">担当者 / 部署</th>
              <th className="p-3 min-w-[200px]">連絡先</th>
              <th className="p-3 min-w-[200px]">住所 / 地域</th>
              <th className="p-3 min-w-[100px] text-center">操作</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
            {filteredCustomers.map((c) => (
              <tr key={c.id} className="hover:bg-[#f4fce8] transition-colors">
                <td className="p-3 font-mono text-xs text-slate-500">{c.customer_code}</td>
                <td className="p-3">
                  <Link href={`/customers/${c.id}`} className="font-bold text-[#659038] hover:underline cursor-pointer text-base block">{c.name}</Link>
                  <span className="inline-block text-[10px] px-1.5 py-0.5 bg-slate-100 border rounded text-slate-500 mt-1">{c.type}</span>
                </td>
                <td className="p-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold text-center w-8 ${c.rank === 'S' || c.rank === 'A' ? 'bg-orange-100 text-orange-700' : c.rank === 'B' ? 'bg-[#92d050]/20 text-[#558028]' : 'bg-slate-100 text-slate-500'}`}>{c.rank}</span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1.5 font-medium text-slate-700"><User size={14} className="text-slate-400" />{c.contact_person}</div>
                  {c.department && <div className="text-xs text-slate-500 pl-5 mt-0.5">{c.department}</div>}
                </td>
                <td className="p-3 space-y-1.5">
                  {/* メールリンク */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <Mail size={12} className="text-slate-400 shrink-0" />
                    {c.email ? (
                      <a href={`mailto:${c.email}`} className="text-[#659038] hover:underline truncate max-w-[150px]">{c.email}</a>
                    ) : <span className="text-slate-400">-</span>}
                  </div>
                  {/* 電話リンク */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <Phone size={12} className="text-slate-400 shrink-0" />
                    {c.phone ? (
                      <a href={`tel:${c.phone}`} className="text-[#659038] hover:underline">{c.phone}</a>
                    ) : <span className="text-slate-400">-</span>}
                  </div>
                </td>
                <td className="p-3">
                   <div className="text-xs text-slate-500 mb-0.5">[{c.region}]</div>
                   <div className="flex items-start gap-1 text-xs truncate max-w-[180px]">
                     <MapPin size={12} className="mt-0.5 text-slate-400 shrink-0" />
                     {c.address ? (
                       <a 
                         href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((c.region || '') + c.address)}`} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="hover:text-[#659038] hover:underline"
                       >
                         {c.address}
                       </a>
                     ) : <span className="text-slate-400">-</span>}
                   </div>
                </td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEditModal(c)} className="p-1.5 text-slate-500 hover:text-[#659038] hover:bg-[#92d050]/20 rounded transition-colors" title="編集">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(c.id, c.name)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded transition-colors" title="削除">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- スマホ用カード --- */}
      <div className="md:hidden space-y-4">
        {filteredCustomers.map((c) => (
          <div key={c.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-2">
              <div>
                <Link href={`/customers/${c.id}`} className="text-lg font-bold text-[#659038] block mb-1">
                  {c.name}
                </Link>
                <div className="flex gap-2 items-center">
                   <span className="text-xs bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-600">{c.type}</span>
                   <span className="text-[10px] text-slate-400 font-mono">{c.customer_code}</span>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center bg-slate-50 px-2 py-1 rounded">
                 <span className="text-[10px] text-slate-500 font-bold uppercase">Rank</span>
                 <span className={`text-lg font-bold ${c.rank === 'S' || c.rank === 'A' ? 'text-orange-600' : 'text-slate-600'}`}>{c.rank}</span>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-600 mb-4">
              <div className="flex items-center gap-2">
                <User size={14} className="text-slate-400 shrink-0" />
                <span className="font-medium text-slate-800">{c.contact_person}</span>
                {c.department && <span className="text-xs text-slate-500">({c.department})</span>}
              </div>

              {/* 電話リンク */}
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-slate-400 shrink-0" />
                {c.phone ? (
                  <a href={`tel:${c.phone}`} className="text-[#659038] hover:underline font-bold tracking-wide">{c.phone}</a>
                ) : <span>-</span>}
              </div>

              {/* メールリンク */}
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-slate-400 shrink-0" />
                {c.email ? (
                  <a href={`mailto:${c.email}`} className="text-[#659038] hover:underline truncate">{c.email}</a>
                ) : <span>-</span>}
              </div>

              {/* マップリンク */}
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <span className="flex-1">
                  {c.region} {' '}
                  {c.address ? (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((c.region || '') + c.address)}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-slate-800 hover:text-[#659038] underline decoration-slate-300 underline-offset-2"
                    >
                      {c.address} <ExternalLink size={10} className="inline ml-0.5 mb-0.5 text-slate-400"/>
                    </a>
                  ) : '-'}
                </span>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <button 
                onClick={() => openEditModal(c)} 
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-50 text-slate-600 border border-slate-200 rounded hover:bg-[#92d050]/20 hover:text-[#659038] hover:border-[#92d050]/50 transition-colors"
              >
                <Edit size={14} /> 編集
              </button>
              <button 
                onClick={() => handleDelete(c.id, c.name)} 
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-50 text-slate-600 border border-slate-200 rounded hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
              >
                <Trash2 size={14} /> 削除
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-lg font-bold text-slate-800">
                {isEditMode ? '顧客情報の編集' : '新規顧客の登録'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
              <form id="customerForm" onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-[#659038] uppercase tracking-wider mb-3 border-b border-[#92d050]/30 pb-1 flex items-center gap-1"><Layers size={14}/> 基本情報</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">顧客ID (自動)</label>
                      <input type="text" className="w-full text-sm border border-slate-300 rounded px-2 py-1.5 bg-slate-100 text-slate-500"
                        value={formData.customer_code} readOnly placeholder="登録時に自動採番" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">顧客名 (会社名/氏名) <span className="text-red-500">*</span></label>
                      <input required type="text" className="w-full text-sm border border-slate-300 rounded px-2 py-1.5 focus:border-[#92d050] focus:ring-1 focus:ring-[#92d050] outline-none"
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

                <div>
                  <h3 className="text-xs font-bold text-[#659038] uppercase tracking-wider mb-3 border-b border-[#92d050]/30 pb-1 flex items-center gap-1"><User size={14}/> 担当者・連絡先</h3>
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

                <div>
                  <h3 className="text-xs font-bold text-[#659038] uppercase tracking-wider mb-3 border-b border-[#92d050]/30 pb-1 flex items-center gap-1"><MapPin size={14}/> 住所情報</h3>
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

                <div>
                  <h3 className="text-xs font-bold text-[#659038] uppercase tracking-wider mb-3 border-b border-[#92d050]/30 pb-1 flex items-center gap-1"><Building size={14}/> 管理情報</h3>
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
                        value={formData.registration_date || ''} onChange={e => setFormData({...formData, registration_date: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">最終接触日</label>
                      <input type="date" className="w-full text-sm border border-slate-300 rounded px-2 py-1.5"
                        value={formData.last_contact_date || ''} onChange={e => setFormData({...formData, last_contact_date: e.target.value})} />
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
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded font-bold transition-colors">キャンセル</button>
              <button type="submit" form="customerForm" className="px-4 py-2 text-sm bg-[#92d050] text-slate-900 rounded hover:bg-[#82c040] font-bold shadow-md">
                {isEditMode ? '変更を保存' : '新規保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}