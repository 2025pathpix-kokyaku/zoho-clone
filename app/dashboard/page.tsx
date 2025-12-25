'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

// グラフ用の色 (Pathpixカラー #92d050 をメインに設定)
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

        // グラフ用データ作成
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
         【ここを修正しました】
         iPad（横画面）でも2列表示（md:grid-cols-2）を維持するように変更。
         xl:grid-cols-4 とすることで、かなり大きなPC画面のときだけ4列になります。
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        
        {/* カード1: 売上総額 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-[#92d050]/20 text-[#659038] rounded-lg shrink-0">
            <DollarSign size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-500 font-bold whitespace-nowrap">予想売上総額</p>
            {/* 文字サイズを調整し、省略(...)させずに全て表示する設定に変更 */}
            <p className="text-xl md:text-2xl font-bold text-slate-800 break-words">
              ¥{stats.totalAmount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* カード2: 成約数 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-[#92d050]/20 text-[#659038] rounded-lg shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-bold">成約数 (契約)</p>
            <p className="text-2xl font-bold text-slate-800">{stats.wonDeals} <span className="text-sm text-slate-400 font-normal">件</span></p>
          </div>
        </div>

        {/* カード3: 平均確度 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-[#92d050]/20 text-[#659038] rounded-lg shrink-0">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-bold">平均確度</p>
            <p className="text-2xl font-bold text-slate-800">{stats.avgProbability}%</p>
          </div>
        </div>

        {/* カード4: 全案件数 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-[#92d050]/20 text-[#659038] rounded-lg shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-bold">全案件数</p>
            <p className="text-2xl font-bold text-slate-800">{stats.totalDeals} <span className="text-sm text-slate-400 font-normal">件</span></p>
          </div>
        </div>
      </div>

      {/* グラフエリア */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* 左: フェーズ別案件数 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-l-4 border-[#92d050] pl-3">フェーズ別 案件数</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={phaseData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis allowDecimals={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="count" name="件数" fill="#92d050" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 右: 顧客ランク分布 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-l-4 border-[#92d050] pl-3">顧客ランク割合</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rankData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {rankData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}