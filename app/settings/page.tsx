'use client';

export default function SettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">システム設定</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-700 mb-2">アカウント情報</h2>
          <p className="text-slate-500">現在、デモモードで動作しています。</p>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h2 className="text-lg font-bold text-slate-700 mb-2">表示設定</h2>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="darkMode" className="w-4 h-4" disabled />
            <label htmlFor="darkMode" className="text-slate-600">ダークモード (準備中)</label>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h2 className="text-lg font-bold text-slate-700 mb-2">アプリケーション情報</h2>
          <p className="text-sm text-slate-500">Version: 1.0.0</p>
        </div>
      </div>
    </div>
  );
}