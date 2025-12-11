import React, { useState } from 'react';
import { X, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { parseCourseText } from '../services/geminiService';
import { Course } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface SmartImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (courses: Course[]) => void;
}

export const SmartImportModal: React.FC<SmartImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await parseCourseText(inputText);
      const newCourses: Course[] = result.courses.map(c => ({
        ...c,
        id: uuidv4()
      }));
      onImport(newCourses);
      onClose();
      setInputText('');
    } catch (err: any) {
      setError(err.message || "无法解析文本，请重试或检查输入格式。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2 text-indigo-600">
            <Sparkles className="w-5 h-5" />
            <h2 className="font-semibold text-lg">AI 智能导入</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-4">
            直接粘贴你的课程表文本、成绩单截图文字或混乱的课程列表。Gemini AI 会自动提取课程名、学分和成绩。
          </p>
          
          <textarea
            className="w-full h-40 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-sm text-slate-700 placeholder:text-slate-400"
            placeholder={`例如：\n高等数学 5.0 92\n大学英语 3.0 85\n计算机基础 (2学分) - 优秀`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />

          {error && (
            <div className="mt-3 flex items-start space-x-2 text-red-500 text-sm bg-red-50 p-2 rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleImport}
            disabled={isLoading || !inputText.trim()}
            className="flex items-center space-x-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>分析中...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>开始识别</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};