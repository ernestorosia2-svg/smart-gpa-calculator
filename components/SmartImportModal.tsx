import React, { useState } from 'react';
import { X, FileText, Loader2, AlertCircle, HelpCircle, Check, Table2 } from 'lucide-react';
import { Course } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface SmartImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (courses: Course[]) => void;
}

// Helper to parse text locally
const parseTextLocally = (text: string): Course[] => {
  const gradeMap: Record<string, string> = {
    'A+': '98', 'A': '95', 'A-': '90',
    'B+': '88', 'B': '85', 'B-': '80',
    'C+': '78', 'C': '75', 'C-': '70',
    'D': '65', 'F': '0',
    '优秀': '95', '优': '95', 
    '良好': '85', '良': '85',
    '中等': '75', '中': '75',
    '及格': '65', '合格': '80',
    '不及格': '0', '挂科': '0',
    'Pass': '80', 'Fail': '0'
  };

  const lines = text.split('\n').filter(line => line.trim() !== '');
  const parsedCourses: Course[] = [];

  for (const line of lines) {
    let processLine = line.trim();

    // 0. Handle Markdown Table Divider Rows (e.g. |---|---|)
    // If line consists only of |, -, :, and spaces, skip it
    if (/^[|\s\-:]+$/.test(processLine)) {
        continue;
    }

    // 1. Handle Markdown/Table separators: Replace pipes | with spaces
    processLine = processLine.replace(/[|]/g, ' ');
    
    // 2. Replace letter/text grades with numbers
    Object.keys(gradeMap).forEach(key => {
        // Regex to match the grade at the end or separated boundaries
        const regex = new RegExp(`(^|[\\s\\t,，:：\-])${key.replace(/[+]/g, '\\+')}($|[\\s\\t,，])`, 'i');
        if (regex.test(processLine)) {
             processLine = processLine.replace(regex, `$1${gradeMap[key]}$2`);
        }
    });

    // 3. Normalize separators (commas, tabs) to spaces
    const cleanLine = processLine.replace(/[,，\t]/g, ' ').trim();
    
    // 4. Extract all numbers (integers or floats)
    // We look for numbers that look like credits or scores
    const matches = cleanLine.match(/(\d+(?:\.\d+)?)/g);
    
    // We need at least 2 numbers: one for credit, one for score
    if (matches && matches.length >= 2) {
      // We assume the *last two* numbers found in the line are the relevant ones
      const val1 = parseFloat(matches[matches.length - 2]);
      const val2 = parseFloat(matches[matches.length - 1]);
      
      let credit = 0;
      let score = 0;

      // Heuristic: Credit is usually small (<= 20), Score is usually larger (> 20)
      if (val1 <= 20 && val2 > 20) {
        credit = val1;
        score = val2;
      } else if (val2 <= 20 && val1 > 20) {
        credit = val2;
        score = val1;
      } else {
        // Fallback: Name Credit Score order
        credit = val1;
        score = val2;
      }
      
      // 5. Extract Name
      // Remove the matched numbers from the end of the string to get the name
      const matchString1 = matches[matches.length - 2];
      const matchString2 = matches[matches.length - 1];
      
      let namePart = cleanLine;
      
      // Remove last number
      const lastIndex2 = namePart.lastIndexOf(matchString2);
      if (lastIndex2 !== -1) {
        namePart = namePart.substring(0, lastIndex2) + namePart.substring(lastIndex2 + matchString2.length);
      }
      
      // Remove second to last number
      const lastIndex1 = namePart.lastIndexOf(matchString1);
      if (lastIndex1 !== -1) {
        namePart = namePart.substring(0, lastIndex1) + namePart.substring(lastIndex1 + matchString1.length);
      }
      
      let name = namePart.replace(/\s+/g, ' ').trim();
      name = name.replace(/[-–—:：]+$/, '').trim();

      // If the line was a header like "Course Credit Score", 'Course' might remain if no numbers were found, 
      // but we only enter this block if numbers ARE found.
      // However, sometimes headers have numbers like "Term 1". 
      // We accept it, users can delete bad rows. 

      if (name && name.length < 50) { // Simple sanity check on name length
         parsedCourses.push({
            id: uuidv4(),
            name: name || "未命名课程",
            credit,
            score,
            isPlanned: false
         });
      }
    }
  }
  return parsedCourses;
};

export const SmartImportModal: React.FC<SmartImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  if (!isOpen) return null;

  const handleImport = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    
    setTimeout(() => {
        const newCourses = parseTextLocally(inputText);
        if (newCourses.length > 0) {
            onImport(newCourses);
            setInputText('');
            onClose();
        } else {
            alert("未能识别出有效课程。\n请检查格式是否包含：课程名、学分、成绩。\n支持粘贴 Markdown 表格或 Word 文本。");
        }
        setIsLoading(false);
    }, 400);
  };

  const previewCount = inputText.trim() ? parseTextLocally(inputText).length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2 text-indigo-600">
            <Table2 className="w-5 h-5" />
            <h2 className="font-semibold text-lg">批量导入 (Markdown / Word)</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex items-start space-x-2 text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
             <HelpCircle className="w-5 h-5 text-indigo-500 shrink-0" />
             <div className="space-y-1">
               <p className="font-medium text-slate-800">支持多种粘贴格式：</p>
               <ul className="list-disc pl-4 space-y-0.5 text-xs text-slate-600">
                 <li><span className="font-semibold">普通文本：</span>课程名 5.0 95</li>
                 <li><span className="font-semibold">Markdown 表格：</span>| 课程 | 学分 | 成绩 |</li>
                 <li><span className="font-semibold">Word/Excel：</span>直接复制表格内容粘贴即可</li>
               </ul>
             </div>
          </div>
          
          <textarea
            className="w-full h-48 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-sm text-slate-700 placeholder:text-slate-400 font-mono leading-relaxed"
            placeholder={`支持如下格式粘贴：

| 高等数学 | 5.0 | 92 |
| 大学物理 | 4.0 | 85 |

或者：
程序设计 3.5 优秀
大学英语 3.0 Pass`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />

          <div className="mt-2 text-right">
             {inputText.trim() && (
                 <span className={`text-xs font-medium ${previewCount > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {previewCount > 0 ? `已识别 ${previewCount} 门课程` : '等待输入...'}
                 </span>
             )}
          </div>
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
            disabled={isLoading || !inputText.trim() || previewCount === 0}
            className="flex items-center space-x-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>处理中...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>确认导入</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};