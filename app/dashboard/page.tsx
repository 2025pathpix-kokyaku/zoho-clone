'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

// グラフ用の色 (Pathpixカラー #92d050 をメインに、相性の良い色を設定)
const COLORS = ['#92d050', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalDeals: 0,
    wonDeals: 0,
    avgProbability: 0
  });
  const [phaseData, setPhaseData] = useState<any[]>([]);
  const [rankData, setRankData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      // 1. 案件データの取得
      const { data: deals } = await supabase.from('deals').select('*');
      
      if (deals) {
        const total = deals.reduce((sum, d) => sum + (d.amount || 0), 0);
        const won = deals.filter(d => d.phase === '契約').length;
        const avgProb = deals.length > 0 
          ? deals.reduce((sum, d) => sum + (d.probability || 0), 0) / deals.length 
          : 0;

        setStats({
          totalAmount: total,
          totalDeals: deals.length,
          wonDeals: won,
          avgProbability: Math.round(avgProb)
        });

        // グラフ用データ
        const pMap: {[key:string]: number} = {};
        deals.forEach(d => {
          pMap[d.phase] = (pMap[d.phase] || 0) + 1;
        });
        const pData = Object.keys(pMap).map(key => ({
          name: key,
          count: pMap[key]
        }));
        setPhaseData(pData);
      }

      // 2. 顧客ランクデータの取得
      const { data: customers } = await supabase.from('customers').select('rank');
      if (customers) {
        const rMap: {[key:string]: number} = {};
        customers.forEach(c => {
          rMap[c.rank] = (rMap[c.rank] || 0) + 1;
        });
        const rData = Object.keys(rMap).map(key => ({
          name: `ランク ${key}`,
          value: rMap[key]
        }));
        setRankData(rData);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) return <div className="p-10 text-slate-500">データを分析中...</div>;

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <span className="text-[#92d050]">●</span> 経営ダッシュボード
      </h1>

      {/* 
         【修正点】
         grid-cols-1 md:grid-cols-2 lg:grid-cols-4 
         → iPad(md)では2列、PC(lg)では4列にすることで、数字がはみ出るのを防ぎます。
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* カード1: 売上総額 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-[#92d050]/20 text-[#659038] rounded-lg">
            <DollarSign size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-slate-500 font-bold">予想売上総額</p>
            {/* truncateで万が一長い場合も崩れないように */}
            <p className="text-xl sm:text-2xl font-bold text-slate-800 truncate">
              ¥{stats.totalAmount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* カード2: 成約数 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-[#92d050]/20 text-[#659038] rounded-lg">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-bold">成約数 (契約)</p>
            <p className="text-2xl font-bold text-sla