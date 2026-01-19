
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Calculator, 
  BarChart3, 
  Settings as SettingsIcon, 
  Trash2, 
  BrainCircuit,
  Delete,
  CheckCircle2,
  History,
  Download,
  AlertCircle,
  UserCheck,
  Plus,
  Minus
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { calculateStats, exportToCSV } from './services/gradeAnalytics';
import { getAIAnalysis } from './services/geminiService';
import { GradeStats, Thresholds } from './types';

type Tab = 'input' | 'stats' | 'settings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('input');
  const [scores, setScores] = useState<number[]>([]);
  const [currentValue, setCurrentValue] = useState<string>('');
  const [thresholds, setThresholds] = useState<Thresholds>({
    passing: 60,
    excellent: 85,
    maxScore: 100
  });
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(true);
  
  const historyRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => calculateStats(scores, thresholds), [scores, thresholds]);

  useEffect(() => {
    if (historyRef.current && activeTab === 'input') {
      historyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [scores, activeTab]);

  const handleKeyPress = (val: string) => {
    setShowError(false);
    
    if (val !== '+') {
      const parts = currentValue.split('+');
      const lastPart = parts[parts.length - 1];
      const nextPart = lastPart === '' && val !== '.' ? val : lastPart + val;
      const numericNextPart = parseFloat(nextPart);
      
      if (!isNaN(numericNextPart) && (numericNextPart > thresholds.maxScore || numericNextPart < 0)) {
        setShowError(true);
        setTimeout(() => setShowError(false), 800);
        return;
      }
    }
    
    setCurrentValue(currentValue + val);
    if (!isKeyboardVisible) setIsKeyboardVisible(true);
  };

  const handleAddScore = () => {
    if (!currentValue) return;

    const parts = currentValue.split('+')
      .map(p => parseFloat(p))
      .filter(p => !isNaN(p) && p >= 0);

    if (parts.length > 0) {
      const hasInvalid = parts.some(p => p > thresholds.maxScore);
      if (hasInvalid) {
        setShowError(true);
        setTimeout(() => setShowError(false), 800);
        return;
      }

      setScores([...parts, ...scores]);
      setCurrentValue('');
      setAiInsight(null);
    }
  };

  const removeScore = (index: number) => {
    const newScores = [...scores];
    newScores.splice(index, 1);
    setScores(newScores);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* 极简头部 */}
      <header className="bg-white border-b border-slate-200 px-6 pt-10 pb-4 flex items-center justify-between z-30 shadow-sm shrink-0 w-full">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">
            {activeTab === 'input' && '成绩录入'}
            {activeTab === 'stats' && '统计报表'}
            {activeTab === 'settings' && '参数配置'}
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            已录入 {scores.length} 个样本
          </p>
        </div>
        {activeTab === 'stats' && scores.length > 0 && (
          <button 
            onClick={() => exportToCSV(stats, thresholds)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl active:scale-95 transition-all shadow-md shadow-indigo-100"
          >
            <Download size={16} />
            <span className="text-xs font-bold">导出 CSV</span>
          </button>
        )}
      </header>

      {/* 主视图区域 */}
      <main className="flex-1 overflow-hidden relative flex flex-col w-full">
        {activeTab === 'input' && (
          <div className="flex flex-col h-full overflow-hidden w-full">
            {/* 核心成绩显示区 */}
            <div 
              onClick={() => setIsKeyboardVisible(true)}
              className="bg-white px-6 py-4 border-b border-slate-100 flex flex-col items-center justify-center relative shrink-0 cursor-pointer active:bg-slate-50 transition-colors w-full"
            >
               <div className="flex items-center justify-center w-full">
                <div className={`w-full max-w-4xl px-10 py-5 rounded-[2rem] transition-all border-2 flex items-center justify-center gap-6 shadow-sm ${showError ? 'border-red-500 bg-red-50 animate-shake shadow-red-100' : 'border-slate-100 bg-slate-50 shadow-slate-100'}`}>
                  <span className={`text-5xl font-black tracking-tighter transition-all duration-200 break-all text-center ${currentValue === '' ? 'text-slate-200' : 'text-slate-900'}`}>
                    {currentValue === '' ? '0' : currentValue}
                  </span>
                  <div className="w-1.5 h-10 bg-indigo-500 rounded-full animate-pulse shrink-0" />
                </div>
              </div>
            </div>

            {/* 录入流水栈 - 宽度优化调整为更窄的 max-w-lg */}
            <div className="px-6 py-4 flex-1 flex flex-col overflow-hidden w-full items-center">
              <div className="flex items-center justify-between mb-4 px-1 w-full max-w-lg shrink-0">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <History size={14} className="text-indigo-400" /> 
                  <span>最近记录</span>
                </div>
                {scores.length > 0 && (
                  <button onClick={() => setScores([])} className="text-[11px] font-black text-red-500 px-4 py-1.5 bg-red-50 rounded-full active:scale-95 transition-all border border-red-100">
                    清空
                  </button>
                )}
              </div>
              
              <div 
                ref={historyRef}
                className="bg-white border border-slate-200 rounded-[2.5rem] flex-1 overflow-y-auto no-scrollbar p-6 shadow-lg shadow-slate-100 w-full max-w-lg"
              >
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
                  {scores.map((score, i) => (
                    <div 
                      key={`${i}-${score}-${Math.random()}`} 
                      onClick={() => removeScore(i)}
                      className="bg-slate-50 border border-slate-100 aspect-square rounded-3xl flex flex-col items-center justify-center shadow-sm hover:shadow-md active:scale-90 active:bg-red-50 transition-all animate-in zoom-in-95 group relative"
                    >
                      <span className="text-[9px] font-mono font-black text-slate-300 absolute top-2.5 left-2.5">#{scores.length - i}</span>
                      <span className="font-black text-lg text-slate-800">{score}</span>
                      <div className="absolute inset-0 bg-red-500/0 group-active:bg-red-500/10 rounded-3xl transition-colors flex items-center justify-center">
                        <Trash2 size={16} className="text-red-500 opacity-0 group-active:opacity-100" />
                      </div>
                    </div>
                  ))}
                  {scores.length === 0 && (
                    <div className="col-span-full h-full min-h-[200px] flex flex-col items-center justify-center text-slate-300">
                      <UserCheck size={48} strokeWidth={1} className="opacity-10 mb-2" />
                      <p className="text-sm font-black italic text-slate-400">待录入数据</p>
                    </div>
                  )}
                  <div className="col-span-full h-[120px]" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 统计报表 */}
        {activeTab === 'stats' && (
          <div className="px-6 py-6 w-full h-full overflow-y-auto no-scrollbar" style={{ paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }}>
            {scores.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-slate-300">
                <BarChart3 size={64} strokeWidth={1} className="mb-4 opacity-10" />
                <p className="text-lg font-black tracking-tight text-center">暂无成绩数据<br/><span className="text-sm font-medium opacity-60">请先在录入页输入成绩</span></p>
              </div>
            ) : (
              <div className="w-full max-w-[1400px] mx-auto space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <SummaryCard label="平均分" value={stats.mean.toFixed(1)} color="text-indigo-600" />
                  <SummaryCard label="及格率" value={`${stats.passRate.toFixed(1)}%`} color="text-emerald-600" />
                  <SummaryCard label="优秀率" value={`${stats.excellenceRate.toFixed(1)}%`} color="text-amber-500" />
                  <SummaryCard label="最高分" value={stats.max} color="text-slate-900" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-100/50">
                    <div className="flex items-center justify-between mb-8">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">分数分布</h4>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400"/> <span className="text-[10px] font-bold text-slate-400">高分</span></div>
                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-400"/> <span className="text-[10px] font-bold text-slate-400">中等</span></div>
                      </div>
                    </div>
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.distribution}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                          <XAxis dataKey="range" tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                          <YAxis hide />
                          <Tooltip 
                            cursor={{fill: '#f1f5f9'}}
                            contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold'}}
                          />
                          <Bar dataKey="count" radius={[12, 12, 0, 0]} barSize={40}>
                            {stats.distribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index < 2 ? '#10b981' : index < 5 ? '#6366f1' : '#cbd5e1'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col gap-6">
                     <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">数值摘要</p>
                        <h5 className="text-xl font-black text-slate-900">核心指标</h5>
                     </div>
                     <div className="space-y-4">
                        <StatRow label="标准差" value={stats.stdDev.toFixed(2)} />
                        <StatRow label="全班最低" value={stats.min} />
                        <StatRow label="及格人数" value={scores.filter(s => s >= thresholds.passing).length + " 人"} />
                        <StatRow label="优秀人数" value={scores.filter(s => s >= thresholds.excellent).length + " 人"} />
                        <StatRow label="不及格" value={scores.filter(s => s < thresholds.passing).length + " 人"} />
                     </div>
                  </div>
                </div>

                <button 
                  onClick={async () => {
                    setIsAnalyzing(true);
                    const res = await getAIAnalysis(stats, thresholds);
                    setAiInsight(res);
                    setIsAnalyzing(false);
                  }}
                  disabled={isAnalyzing}
                  className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-lg flex items-center justify-center gap-4 active:scale-[0.99] transition-all disabled:opacity-50 shadow-2xl shadow-indigo-200"
                >
                  <BrainCircuit size={24} className={isAnalyzing ? "animate-spin" : ""} />
                  {isAnalyzing ? "AI 生成建议中..." : "生成 AI 教学诊断"}
                </button>

                {aiInsight && (
                  <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl animate-in slide-in-from-bottom-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-indigo-500 rounded-xl">
                        <BrainCircuit size={20} className="text-white" />
                      </div>
                      <h3 className="font-black text-xl tracking-tight">AI 诊断结果</h3>
                    </div>
                    <MarkdownContent content={aiInsight} isDark />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 参数配置 */}
        {activeTab === 'settings' && (
          <div className="px-6 py-6 w-full h-full overflow-y-auto no-scrollbar" style={{ paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }}>
            <div className="w-full max-w-[1400px] mx-auto space-y-6">
              <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 p-8 md:p-12 space-y-12">
                <div className="flex flex-col gap-1 text-center">
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight">规则设定</h2>
                   <p className="text-sm text-slate-400 font-medium tracking-wide">调整分数值来即时更新所有统计逻辑</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <SettingInput label="满分标准" value={thresholds.maxScore} onChange={(v) => setThresholds({...thresholds, maxScore: v})} />
                  <SettingInput label="及格线" value={thresholds.passing} onChange={(v) => setThresholds({...thresholds, passing: v})} />
                  <SettingInput label="优秀线" value={thresholds.excellent} onChange={(v) => setThresholds({...thresholds, excellent: v})} />
                </div>
              </div>
              
              <div className="bg-indigo-50 rounded-[2.5rem] p-8 border border-indigo-100 flex items-start gap-4">
                <AlertCircle size={24} className="text-indigo-500 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-700 font-medium leading-relaxed">
                  <h6 className="font-black text-indigo-900 text-sm mb-1 uppercase tracking-wider">设置说明</h6>
                  <p>修改这些阈值将直接决定统计报表中的“及格率”、“优秀率”以及“AI 教学分析”的评估结论。建议根据考试难度合理调整。</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- 数字键盘 --- */}
      {activeTab === 'input' && (
        <div 
          className={`fixed left-0 right-0 z-40 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) shadow-[0_-20px_60px_rgba(0,0,0,0.12)] bg-white
            ${isKeyboardVisible ? 'bottom-[64px]' : 'bottom-[64px] translate-y-[calc(100%-48px)]'}`}
        >
          <div 
            onClick={() => setIsKeyboardVisible(!isKeyboardVisible)}
            className="h-10 w-full flex items-center justify-center cursor-pointer hover:bg-slate-50 border-t border-slate-100 rounded-t-[2.5rem]"
          >
            <div className="w-16 h-1.5 bg-slate-200 rounded-full" />
          </div>

          <div className="w-full grid grid-cols-4 gap-px bg-slate-100">
            {['7','8','9'].map(n => <KeyBtn key={n} val={n} onClick={() => handleKeyPress(n)} />)}
            <button onClick={() => setCurrentValue(currentValue.slice(0, -1))} className="bg-white text-slate-400 flex items-center justify-center active:bg-slate-50 h-16"><Delete size={20}/></button>
            {['4','5','6'].map(n => <KeyBtn key={n} val={n} onClick={() => handleKeyPress(n)} />)}
            <button onClick={() => handleKeyPress('+')} className="bg-indigo-50 text-indigo-600 font-black text-2xl active:bg-indigo-100 h-16">+</button>
            {['1','2','3'].map(n => <KeyBtn key={n} val={n} onClick={() => handleKeyPress(n)} />)}
            <div className="row-span-2 bg-indigo-600 text-white flex flex-col items-center justify-center active:bg-indigo-700 transition-all cursor-pointer" onClick={handleAddScore}>
              <CheckCircle2 size={32} />
              <span className="text-[10px] font-black mt-2 uppercase tracking-widest text-center">录入</span>
            </div>
            <KeyBtn val="0" onClick={() => handleKeyPress('0')} />
            <KeyBtn val="." onClick={() => handleKeyPress('.')} />
            <button onClick={() => setCurrentValue('')} className="bg-white text-slate-300 font-black text-xs active:bg-slate-50 h-16">重置</button>
          </div>
        </div>
      )}

      {/* --- 底部固定导航栏 --- */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around items-center z-50 safe-area-bottom shadow-2xl h-[64px] w-full">
        <NavBtn active={activeTab === 'input'} onClick={() => setActiveTab('input')} icon={<Calculator size={22}/>} label="录入" />
        <NavBtn active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<BarChart3 size={22}/>} label="统计" />
        <NavBtn active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon size={22}/>} label="设置" />
      </nav>
    </div>
  );
};

const NavBtn: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all flex-1 h-full justify-center ${active ? 'text-indigo-600 scale-105 font-black' : 'text-slate-300 font-bold hover:text-slate-400'}`}>
    {icon}
    <span className="text-[10px] uppercase tracking-tighter">{label}</span>
  </button>
);

const KeyBtn: React.FC<{ val: string; onClick: () => void; className?: string }> = ({ val, onClick, className = '' }) => (
  <button onClick={onClick} className={`bg-white text-2xl font-black text-slate-800 active:bg-slate-100 h-16 flex items-center justify-center transition-all ${className}`}>{val}</button>
);

const SummaryCard: React.FC<{ label: string; value: any; color: string }> = ({ label, value, color }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-100/50 flex flex-col items-center justify-center flex-1">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{label}</p>
    <p className={`text-3xl font-black ${color} tracking-tighter`}>{value}</p>
  </div>
);

const StatRow: React.FC<{ label: string; value: any }> = ({ label, value }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
    <span className="text-xs font-bold text-slate-400">{label}</span>
    <span className="text-sm font-black text-slate-700">{value}</span>
  </div>
);

const SettingInput: React.FC<{ label: string; value: number; onChange: (v: number) => void }> = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-6 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:border-indigo-100 transition-all group shadow-sm hover:shadow-md">
    <div className="flex items-center justify-between px-2">
      <span className="font-black text-[11px] text-slate-400 uppercase tracking-[0.2em] group-hover:text-indigo-400 transition-colors">{label}</span>
      <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-indigo-300" />
    </div>
    
    <div className="flex items-center justify-between gap-6">
      <button 
        onClick={() => onChange(Math.max(0, parseFloat((value - 1).toFixed(1))))} 
        className="w-16 h-16 flex items-center justify-center bg-white rounded-full shadow-lg text-slate-700 active:scale-90 active:shadow-sm hover:bg-slate-50 transition-all border border-slate-100 shrink-0"
      >
        <Minus size={24} strokeWidth={3} />
      </button>
      
      <div className="flex-1 flex flex-col items-center min-w-[80px]">
        <input 
          type="number" 
          step="0.1" 
          value={value} 
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)} 
          className="w-full bg-transparent border-none text-center font-black text-4xl text-slate-900 outline-none tabular-nums" 
        />
        <div className="h-1 w-10 bg-indigo-500/20 rounded-full mt-2" />
      </div>
      
      <button 
        onClick={() => onChange(parseFloat((value + 1).toFixed(1)))} 
        className="w-16 h-16 flex items-center justify-center bg-indigo-600 rounded-full shadow-xl shadow-indigo-200 text-white active:scale-90 active:bg-indigo-700 hover:bg-indigo-500 transition-all shrink-0"
      >
        <Plus size={24} strokeWidth={3} />
      </button>
    </div>
    
    <div className="flex justify-center">
      <p className="text-[10px] font-bold text-slate-300 group-hover:text-indigo-200 transition-colors">点击或直接修改数值</p>
    </div>
  </div>
);

const MarkdownContent: React.FC<{ content: string; isDark?: boolean }> = ({ content, isDark }) => (
  <div className={`space-y-4 ${isDark ? 'text-indigo-50 text-sm' : 'text-slate-600 text-base'}`}>
    {content.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return null;
      if (line.startsWith('#')) return <h3 key={i} className={`text-lg font-black mt-6 mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{line.replace(/#/g, '').trim()}</h3>;
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) return <div key={i} className="flex gap-3 ml-2"><span className={`mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0 ${isDark ? 'bg-indigo-400' : 'bg-indigo-500'}`} /><p className="leading-relaxed font-bold">{trimmed.substring(1).trim()}</p></div>;
      return <p key={i} className="leading-relaxed opacity-90 font-bold">{line}</p>;
    })}
  </div>
);

export default App;
