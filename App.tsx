import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Calculator, 
  BookOpen, 
  GraduationCap, 
  BarChart3, 
  FileText, // Changed Sparkles to FileText
  Save,
  RotateCcw,
  Edit2,
  Target,
  CheckCircle2,
  CircleDashed,
  TrendingUp
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

import { Course } from './types';
import { StatsCard } from './components/StatsCard';
import { SmartImportModal } from './components/SmartImportModal';

// Mock Data for Demo
const DEMO_COURSES: Course[] = [
  { id: '1', name: '高等数学 I', credit: 5.0, score: 92, isPlanned: false },
  { id: '2', name: '大学物理', credit: 4.0, score: 85, isPlanned: false },
  { id: '3', name: '程序设计基础', credit: 3.5, score: 95, isPlanned: false },
  { id: '4', name: '高级机器学习', credit: 3.0, score: 90, isPlanned: true },
  { id: '5', name: '毕业设计', credit: 8.0, score: 85, isPlanned: true },
];

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981'];

function App() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPlanningMode, setIsPlanningMode] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Course, 'id'>>({ name: '', credit: 0, score: 0, isPlanned: false });

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('gpa-courses');
    if (saved) {
      try {
        setCourses(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved courses");
      }
    } else {
      setCourses(DEMO_COURSES);
    }
  }, []);

  // Save to local storage whenever courses change
  useEffect(() => {
    localStorage.setItem('gpa-courses', JSON.stringify(courses));
  }, [courses]);

  // Statistics Calculation
  const calculateStats = (courseList: Course[]) => {
    const totalCredits = courseList.reduce((sum, c) => sum + c.credit, 0);
    const weightedSum = courseList.reduce((sum, c) => sum + (c.score * c.credit), 0);
    const weightedAvg = totalCredits > 0 ? (weightedSum / totalCredits).toFixed(2) : '0.00';
    
    // Simple 4.0 GPA Estimate (Standard Algorithm)
    let totalGPAPoints = 0;
    courseList.forEach(c => {
      let gp = 0;
      if (c.score >= 90) gp = 4.0;
      else if (c.score >= 85) gp = 3.7;
      else if (c.score >= 82) gp = 3.3;
      else if (c.score >= 78) gp = 3.0;
      else if (c.score >= 75) gp = 2.7;
      else if (c.score >= 72) gp = 2.3;
      else if (c.score >= 68) gp = 2.0;
      else if (c.score >= 64) gp = 1.5;
      else if (c.score >= 60) gp = 1.0;
      else gp = 0;
      totalGPAPoints += gp * c.credit;
    });
    const gpa = totalCredits > 0 ? (totalGPAPoints / totalCredits).toFixed(2) : '0.00';

    return { totalCredits, weightedAvg, gpa, count: courseList.length };
  };

  const currentStats = useMemo(() => calculateStats(courses.filter(c => !c.isPlanned)), [courses]);
  const projectedStats = useMemo(() => calculateStats(courses), [courses]);
  
  const activeStats = isPlanningMode ? projectedStats : currentStats;

  // Chart Data
  const chartData = useMemo(() => {
    const targetCourses = isPlanningMode ? courses : courses.filter(c => !c.isPlanned);
    const distribution = [
      { name: '90-100 (优)', value: 0 },
      { name: '80-89 (良)', value: 0 },
      { name: '70-79 (中)', value: 0 },
      { name: '60-69 (及格)', value: 0 },
      { name: '< 60 (不及格)', value: 0 },
    ];
    targetCourses.forEach(c => {
      if (c.score >= 90) distribution[0].value += c.credit;
      else if (c.score >= 80) distribution[1].value += c.credit;
      else if (c.score >= 70) distribution[2].value += c.credit;
      else if (c.score >= 60) distribution[3].value += c.credit;
      else distribution[4].value += c.credit;
    });
    return distribution.filter(d => d.value > 0);
  }, [courses, isPlanningMode]);

  // Handlers
  const handleAddOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.credit <= 0 || formData.score < 0) return;

    if (editingId) {
      setCourses(prev => prev.map(c => c.id === editingId ? { ...formData, id: editingId } : c));
      setEditingId(null);
    } else {
      setCourses(prev => [{ ...formData, id: uuidv4() }, ...prev]);
    }
    // Reset form but keep isPlanned state if we are in planning mode for convenience
    setFormData({ name: '', credit: 0, score: 0, isPlanned: isPlanningMode });
  };

  const handleEdit = (course: Course) => {
    setEditingId(course.id);
    setFormData({ 
      name: course.name, 
      credit: course.credit, 
      score: course.score,
      isPlanned: course.isPlanned 
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这门课程吗？')) {
      setCourses(prev => prev.filter(c => c.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setFormData({ name: '', credit: 0, score: 0, isPlanned: false });
      }
    }
  };

  const handleReset = () => {
    if (confirm('确定要清空所有数据吗？')) {
      setCourses([]);
      localStorage.removeItem('gpa-courses');
    }
  };

  const handleScoreChange = (id: string, newScore: number) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, score: newScore } : c));
  };

  return (
    <div className={`min-h-screen pb-12 transition-colors duration-500 ${isPlanningMode ? 'bg-slate-100' : 'bg-slate-50'}`}>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg text-white transition-colors ${isPlanningMode ? 'bg-purple-600' : 'bg-indigo-600'}`}>
              <Calculator className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">智能学分绩计算器</h1>
          </div>
          <div className="flex items-center space-x-2">
            
            <button
              onClick={() => setIsPlanningMode(!isPlanningMode)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                isPlanningMode 
                  ? 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>{isPlanningMode ? '规划模式: 开启' : '规划模式: 关闭'}</span>
            </button>

            <div className="h-6 w-px bg-slate-200 mx-2"></div>

            <button 
              onClick={handleReset}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="清空数据"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className={`flex items-center space-x-2 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg ${
                isPlanningMode 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">批量导入</span>
              <span className="sm:hidden">导入</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Banner for Planning Mode */}
        {isPlanningMode && (
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-start space-x-3 animate-in fade-in slide-in-from-top-4">
            <TrendingUp className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-purple-800">您正在使用规划模拟模式</h3>
              <p className="text-sm text-purple-600 mt-1">
                在此模式下，您可以添加未来的课程，并动态调整分数滑块来查看对 GPA 的影响。统计数据将包含所有（已修+计划）课程。
              </p>
            </div>
          </div>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            title={isPlanningMode ? "预期加权平均分" : "当前加权平均分"}
            value={activeStats.weightedAvg} 
            icon={BarChart3} 
            colorClass={isPlanningMode ? "bg-purple-500" : "bg-indigo-500"}
            subtext={isPlanningMode ? "基于所有课程（包含计划）" : "仅基于已修课程"}
          />
          <StatsCard 
            title={isPlanningMode ? "预期绩点 (GPA)" : "当前绩点 (GPA)"}
            value={activeStats.gpa} 
            icon={GraduationCap} 
            colorClass="bg-emerald-500"
            subtext="基于标准 4.0 算法"
          />
          <StatsCard 
            title={isPlanningMode ? "预期总学分" : "已修总学分"}
            value={activeStats.totalCredits} 
            icon={BookOpen} 
            colorClass="bg-blue-500" 
          />
          <StatsCard 
            title="课程数量" 
            value={activeStats.count} 
            icon={Calculator} 
            colorClass="bg-orange-500" 
            subtext={isPlanningMode ? `${courses.filter(c => c.isPlanned).length} 门计划中` : "仅统计已修"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Form & List */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Input Form */}
            <div className={`rounded-xl shadow-sm border p-6 transition-all ${
              isPlanningMode ? 'bg-white border-purple-100 shadow-md' : 'bg-white border-slate-100'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-bold flex items-center ${isPlanningMode ? 'text-purple-800' : 'text-slate-800'}`}>
                  {editingId ? <Edit2 className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                  {editingId ? '编辑课程' : '添加课程'}
                </h2>
                {editingId && (
                  <button 
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ name: '', credit: 0, score: 0, isPlanned: isPlanningMode });
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    取消编辑
                  </button>
                )}
              </div>
              <form onSubmit={handleAddOrUpdate} className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-5">
                  <label className="block text-xs font-medium text-slate-500 mb-1">课程名称</label>
                  <input
                    type="text"
                    required
                    placeholder="例如: 毕业设计"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm transition-all"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-slate-500 mb-1">学分</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.1"
                    placeholder="3.0"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm transition-all"
                    value={formData.credit || ''}
                    onChange={e => setFormData({ ...formData, credit: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">预期成绩</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    placeholder="85"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm transition-all"
                    value={formData.score || ''}
                    onChange={e => setFormData({ ...formData, score: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="sm:col-span-2 flex items-center pt-5">
                   <label className="flex items-center space-x-2 cursor-pointer select-none">
                     <div className="relative">
                       <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={formData.isPlanned || false}
                          onChange={e => setFormData({...formData, isPlanned: e.target.checked})}
                       />
                       <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                     </div>
                     <span className="text-xs font-medium text-slate-600">计划中</span>
                   </label>
                </div>
                <div className="sm:col-span-12">
                  <button
                    type="submit"
                    className={`w-full py-2 flex items-center justify-center rounded-lg text-white font-medium transition-colors shadow-sm ${
                      editingId 
                        ? 'bg-indigo-600 hover:bg-indigo-700' 
                        : isPlanningMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    {editingId ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {editingId ? '保存修改' : '添加到列表'}
                  </button>
                </div>
              </form>
            </div>

            {/* Course List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-700">课程列表</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span>已修</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                    <span>计划中</span>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                      <th className="px-4 py-3 font-medium w-16 text-center">状态</th>
                      <th className="px-4 py-3 font-medium">课程名称</th>
                      <th className="px-4 py-3 font-medium w-20 text-center">学分</th>
                      <th className={`px-4 py-3 font-medium text-center ${isPlanningMode ? 'w-48' : 'w-24'}`}>
                        {isPlanningMode ? '成绩 (拖动调整)' : '成绩'}
                      </th>
                      <th className="px-4 py-3 font-medium w-20 text-center">绩点</th>
                      <th className="px-4 py-3 font-medium w-24 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {courses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          暂无课程数据，请手动添加或使用 AI 导入
                        </td>
                      </tr>
                    ) : (
                      courses.map((course) => {
                        let gp = 0;
                        if (course.score >= 90) gp = 4.0;
                        else if (course.score >= 85) gp = 3.7;
                        else if (course.score >= 82) gp = 3.3;
                        else if (course.score >= 78) gp = 3.0;
                        else if (course.score >= 75) gp = 2.7;
                        else if (course.score >= 72) gp = 2.3;
                        else if (course.score >= 68) gp = 2.0;
                        else if (course.score >= 64) gp = 1.5;
                        else if (course.score >= 60) gp = 1.0;
                        
                        return (
                          <tr 
                            key={course.id} 
                            className={`transition-colors group ${
                              course.isPlanned 
                                ? 'bg-purple-50/30 hover:bg-purple-50/60' 
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="px-4 py-4 text-center">
                              {course.isPlanned ? (
                                <CircleDashed className="w-4 h-4 text-purple-400 mx-auto" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                              )}
                            </td>
                            <td className="px-4 py-4 font-medium text-slate-800">
                              {course.name}
                              {course.isPlanned && <span className="ml-2 text-[10px] text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full">计划</span>}
                            </td>
                            <td className="px-4 py-4 text-center text-slate-600">{course.credit}</td>
                            <td className="px-4 py-4 text-center">
                              {isPlanningMode ? (
                                <div className="flex items-center space-x-2">
                                  <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={course.score} 
                                    onChange={(e) => handleScoreChange(course.id, parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                  />
                                  <span className="w-8 text-right font-mono font-medium text-purple-700">{course.score}</span>
                                </div>
                              ) : (
                                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                                  course.score >= 90 ? 'bg-green-100 text-green-700' :
                                  course.score >= 80 ? 'bg-blue-100 text-blue-700' :
                                  course.score >= 60 ? 'bg-slate-100 text-slate-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {course.score}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-center text-slate-500">{gp.toFixed(1)}</td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleEdit(course)}
                                  className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(course.id)}
                                  className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Chart */}
          <div className="lg:col-span-1">
            <div className={`rounded-xl shadow-sm border p-6 sticky top-24 transition-colors ${
              isPlanningMode ? 'bg-white border-purple-100 shadow-md' : 'bg-white border-slate-100'
            }`}>
              <h3 className={`font-bold mb-6 flex items-center ${isPlanningMode ? 'text-purple-800' : 'text-slate-800'}`}>
                <BarChart3 className={`w-5 h-5 mr-2 ${isPlanningMode ? 'text-purple-500' : 'text-indigo-500'}`} />
                {isPlanningMode ? '预期成绩分布' : '当前成绩分布'}
              </h3>
              <div className="h-64 w-full">
                 {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                 ) : (
                   <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
                     <PieChart className="w-12 h-12 mb-2 opacity-50" />
                     <span className="text-sm">暂无数据</span>
                   </div>
                 )}
              </div>
              <div className="mt-6 space-y-3">
                <p className="text-sm text-slate-500 leading-relaxed">
                  <span className="font-semibold text-slate-700">说明:</span> 
                  {isPlanningMode 
                    ? " 当前图表显示的是包括已修和计划课程在内的所有课程分布。调整左侧滑块可实时查看分布变化。"
                    : " 当前图表仅显示已修课程的成绩分布。"
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SmartImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onImport={(newCourses) => setCourses(prev => [...newCourses, ...prev])} 
      />
    </div>
  );
}

export default App;