import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Calculator, 
  BookOpen, 
  GraduationCap, 
  BarChart3, 
  Sparkles,
  Save,
  RotateCcw,
  Edit2
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

import { Course, ScoreDistribution } from './types';
import { StatsCard } from './components/StatsCard';
import { SmartImportModal } from './components/SmartImportModal';

// Mock Data for Demo
const DEMO_COURSES: Course[] = [
  { id: '1', name: '高等数学 I', credit: 5.0, score: 92 },
  { id: '2', name: '大学物理', credit: 4.0, score: 85 },
  { id: '3', name: '程序设计基础', credit: 3.5, score: 95 },
  { id: '4', name: '线性代数', credit: 3.0, score: 88 },
  { id: '5', name: '英语读写', credit: 2.0, score: 78 },
];

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981'];

function App() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Course, 'id'>>({ name: '', credit: 0, score: 0 });

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
  const stats = useMemo(() => {
    const totalCredits = courses.reduce((sum, c) => sum + c.credit, 0);
    const weightedSum = courses.reduce((sum, c) => sum + (c.score * c.credit), 0);
    const weightedAvg = totalCredits > 0 ? (weightedSum / totalCredits).toFixed(2) : '0.00';
    
    // Simple 4.0 GPA Estimate (Standard Algorithm)
    // 90-100: 4.0, 85-89: 3.7, 82-84: 3.3, 78-81: 3.0, 75-77: 2.7, 72-74: 2.3, 68-71: 2.0, 64-67: 1.5, 60-63: 1.0, <60: 0
    let totalGPAPoints = 0;
    courses.forEach(c => {
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

    return { totalCredits, weightedAvg, gpa, count: courses.length };
  }, [courses]);

  // Chart Data
  const chartData = useMemo(() => {
    const distribution = [
      { name: '90-100 (优)', value: 0 },
      { name: '80-89 (良)', value: 0 },
      { name: '70-79 (中)', value: 0 },
      { name: '60-69 (及格)', value: 0 },
      { name: '< 60 (不及格)', value: 0 },
    ];
    courses.forEach(c => {
      if (c.score >= 90) distribution[0].value += c.credit;
      else if (c.score >= 80) distribution[1].value += c.credit;
      else if (c.score >= 70) distribution[2].value += c.credit;
      else if (c.score >= 60) distribution[3].value += c.credit;
      else distribution[4].value += c.credit;
    });
    return distribution.filter(d => d.value > 0);
  }, [courses]);

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
    setFormData({ name: '', credit: 0, score: 0 });
  };

  const handleEdit = (course: Course) => {
    setEditingId(course.id);
    setFormData({ name: course.name, credit: course.credit, score: course.score });
    // Scroll to top or form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这门课程吗？')) {
      setCourses(prev => prev.filter(c => c.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setFormData({ name: '', credit: 0, score: 0 });
      }
    }
  };

  const handleReset = () => {
    if (confirm('确定要清空所有数据吗？')) {
      setCourses([]);
      localStorage.removeItem('gpa-courses');
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Calculator className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">智能学分绩计算器</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleReset}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="清空数据"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI 智能导入</span>
              <span className="sm:hidden">导入</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            title="加权平均分" 
            value={stats.weightedAvg} 
            icon={BarChart3} 
            colorClass="bg-indigo-500" 
            subtext="Score × Credit / Total Credits"
          />
          <StatsCard 
            title="估计绩点 (GPA)" 
            value={stats.gpa} 
            icon={GraduationCap} 
            colorClass="bg-purple-500" 
            subtext="基于标准 4.0 算法"
          />
          <StatsCard 
            title="总学分" 
            value={stats.totalCredits} 
            icon={BookOpen} 
            colorClass="bg-blue-500" 
          />
          <StatsCard 
            title="课程数量" 
            value={stats.count} 
            icon={Calculator} 
            colorClass="bg-emerald-500" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Form & List */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Input Form */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center">
                  {editingId ? <Edit2 className="w-5 h-5 mr-2 text-indigo-500" /> : <Plus className="w-5 h-5 mr-2 text-indigo-500" />}
                  {editingId ? '编辑课程' : '添加课程'}
                </h2>
                {editingId && (
                  <button 
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ name: '', credit: 0, score: 0 });
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
                    placeholder="例如: 高等数学"
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
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-slate-500 mb-1">成绩 (0-100)</label>
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
                <div className="sm:col-span-1 flex items-end">
                  <button
                    type="submit"
                    className={`w-full h-[38px] flex items-center justify-center rounded-lg text-white transition-colors ${editingId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                  >
                    {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-5 h-5" />}
                  </button>
                </div>
              </form>
            </div>

            {/* Course List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-700">课程列表</h3>
                <span className="text-xs text-slate-400">共 {courses.length} 门</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                      <th className="px-6 py-3 font-medium">课程名称</th>
                      <th className="px-6 py-3 font-medium w-24 text-center">学分</th>
                      <th className="px-6 py-3 font-medium w-24 text-center">成绩</th>
                      <th className="px-6 py-3 font-medium w-24 text-center">绩点</th>
                      <th className="px-6 py-3 font-medium w-24 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {courses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                          暂无课程数据，请手动添加或使用 AI 导入
                        </td>
                      </tr>
                    ) : (
                      courses.map((course) => {
                        // Simple row GPA calc for display
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
                          <tr key={course.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4 font-medium text-slate-800">{course.name}</td>
                            <td className="px-6 py-4 text-center text-slate-600">{course.credit}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                                course.score >= 90 ? 'bg-green-100 text-green-700' :
                                course.score >= 80 ? 'bg-blue-100 text-blue-700' :
                                course.score >= 60 ? 'bg-slate-100 text-slate-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {course.score}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center text-slate-500">{gp.toFixed(1)}</td>
                            <td className="px-6 py-4 text-right">
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
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 sticky top-24">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-indigo-500" />
                学分分布
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
                  <span className="font-semibold text-slate-700">小贴士:</span> 本工具采用标准加权算法。
                  加权平均分反映了课程成绩与学分的综合表现，是评估学业水平的重要指标。
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