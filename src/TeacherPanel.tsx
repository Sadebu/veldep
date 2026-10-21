import { useState, useEffect } from 'react';
import { scenes, chapters } from './gameData';
import { miniGames } from './miniGames';

interface StudentResult {
  id: string;
  studentName: string;
  className: string;
  timestamp: number;
  scores: {
    economy: number;
    trust: number;
    political: number;
  };
  totalScore: number;
  grade: string;
  gradeLabel: string;
  scenesCompleted: number;
  miniGameResults: Record<string, { score: number; max: number }>;
  choices: Array<{
    sceneId: string;
    sceneTitle: string;
    choiceIndex: number;
    choiceText: string;
    correctness: string;
    bestChoiceIndex: number;
  }>;
}

const TEACHER_PASSWORD = "teacher1933";

export function TeacherPanel({ onClose }: { onClose: () => void }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'results' | 'answers' | 'stats'>('results');
  const [results, setResults] = useState<StudentResult[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadResults();
    }
  }, [isAuthenticated]);

  const loadResults = () => {
    const stored = localStorage.getItem('game_student_results');
    if (stored) {
      setResults(JSON.parse(stored));
    }
  };

  const handleLogin = () => {
    if (password === TEACHER_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Неверный пароль');
    }
  };

  const deleteResult = (id: string) => {
    if (confirm('Удалить результат этого ученика?')) {
      const updated = results.filter(r => r.id !== id);
      setResults(updated);
      localStorage.setItem('game_student_results', JSON.stringify(updated));
      if (selectedStudent?.id === id) setSelectedStudent(null);
    }
  };

  const deleteAll = () => {
    if (confirm('Удалить ВСЕ результаты? Это действие нельзя отменить.')) {
      setResults([]);
      localStorage.removeItem('game_student_results');
      setSelectedStudent(null);
    }
  };

  const exportResults = () => {
    const data = JSON.stringify(results, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game_results_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // === LOGIN SCREEN ===
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-white mb-2">Панель учителя</h2>
            <p className="text-gray-400 text-sm">Введите пароль для доступа</p>
          </div>
          
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Пароль"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-amber-500 mb-3"
            />
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <button
              onClick={handleLogin}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-lg transition-all"
            >
              Войти
            </button>
            <button
              onClick={onClose}
              className="w-full mt-3 text-gray-400 hover:text-white text-sm py-2 transition-all"
            >
              ← Вернуться к игре
            </button>
            <p className="text-gray-500 text-xs mt-4 text-center">
              Подсказка: пароль связан с годом начала Нового курса
            </p>
          </div>
        </div>
      </div>
    );
  }

  // === TEACHER DASHBOARD ===
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">📊 Панель учителя</h1>
            <p className="text-gray-400 text-sm">Великая Депрессия: Советник Президента</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportResults}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-all"
            >
              📥 Экспорт
            </button>
            <button
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-all"
            >
              ← К игре
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Всего прохождений" value={results.length.toString()} icon="👥" />
          <StatCard 
            label="Средняя оценка" 
            value={results.length > 0 
              ? (results.reduce((sum, r) => sum + parseInt(r.grade), 0) / results.length).toFixed(1)
              : '—'} 
            icon="⭐" 
          />
          <StatCard 
            label="Средний балл" 
            value={results.length > 0
              ? Math.round(results.reduce((sum, r) => sum + r.totalScore, 0) / results.length).toString()
              : '—'}
            icon="📈"
          />
          <StatCard 
            label="Пятёрок" 
            value={results.filter(r => r.grade === '5').length.toString()} 
            icon="🏆" 
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-700 pb-2">
          <TabButton active={activeTab === 'results'} onClick={() => setActiveTab('results')}>
            📋 Результаты учеников
          </TabButton>
          <TabButton active={activeTab === 'answers'} onClick={() => setActiveTab('answers')}>
            ✅ Правильные ответы
          </TabButton>
          <TabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')}>
            📊 Статистика
          </TabButton>
        </div>

        {/* Tab Content */}
        {activeTab === 'results' && (
          <ResultsTab 
            results={results} 
            selectedStudent={selectedStudent}
            onSelectStudent={setSelectedStudent}
            onDelete={deleteResult}
            onDeleteAll={deleteAll}
          />
        )}
        {activeTab === 'answers' && <AnswersTab />}
        {activeTab === 'stats' && <StatsTab results={results} />}
      </div>
    </div>
  );
}

// === SUB-COMPONENTS ===

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      {children}
    </button>
  );
}

function ResultsTab({ 
  results, 
  selectedStudent, 
  onSelectStudent, 
  onDelete, 
  onDeleteAll 
}: { 
  results: StudentResult[];
  selectedStudent: StudentResult | null;
  onSelectStudent: (s: StudentResult | null) => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
}) {
  if (results.length === 0) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 text-center">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-gray-400">Пока нет результатов. Результаты появятся после прохождения игры учениками.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-gray-400 text-sm">Найдено результатов: {results.length}</p>
        <button
          onClick={onDeleteAll}
          className="bg-red-900/50 hover:bg-red-900 text-red-300 px-3 py-1 rounded text-xs transition-all"
        >
          🗑 Удалить все
        </button>
      </div>

      {/* Results Table */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="text-left p-3 text-xs text-gray-400 font-medium">Ученик</th>
                <th className="text-left p-3 text-xs text-gray-400 font-medium">Класс</th>
                <th className="text-center p-3 text-xs text-gray-400 font-medium">💰</th>
                <th className="text-center p-3 text-xs text-gray-400 font-medium">🤝</th>
                <th className="text-center p-3 text-xs text-gray-400 font-medium">🏛️</th>
                <th className="text-center p-3 text-xs text-gray-400 font-medium">Σ</th>
                <th className="text-center p-3 text-xs text-gray-400 font-medium">Оценка</th>
                <th className="text-center p-3 text-xs text-gray-400 font-medium">Дата</th>
                <th className="text-center p-3 text-xs text-gray-400 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {results.map(result => (
                <tr key={result.id} className="border-t border-gray-700 hover:bg-gray-700/30">
                  <td className="p-3 text-white text-sm font-medium">{result.studentName}</td>
                  <td className="p-3 text-gray-300 text-sm">{result.className}</td>
                  <td className="p-3 text-center text-green-400 text-sm">{result.scores.economy}</td>
                  <td className="p-3 text-center text-blue-400 text-sm">{result.scores.trust}</td>
                  <td className="p-3 text-center text-purple-400 text-sm">{result.scores.political}</td>
                  <td className="p-3 text-center text-amber-400 text-sm font-bold">{result.totalScore}</td>
                  <td className="p-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                      result.grade === '5' ? 'bg-green-900/50 text-green-400' :
                      result.grade === '4' ? 'bg-blue-900/50 text-blue-400' :
                      result.grade === '3' ? 'bg-amber-900/50 text-amber-400' :
                      'bg-red-900/50 text-red-400'
                    }`}>
                      {result.grade}
                    </span>
                  </td>
                  <td className="p-3 text-center text-gray-400 text-xs">
                    {new Date(result.timestamp).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => onSelectStudent(result)}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs transition-all"
                      >
                        👁
                      </button>
                      <button
                        onClick={() => onDelete(result.id)}
                        className="bg-red-900/50 hover:bg-red-900 text-red-300 px-2 py-1 rounded text-xs transition-all"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Student Detail */}
      {selectedStudent && (
        <StudentDetail student={selectedStudent} onClose={() => onSelectStudent(null)} />
      )}
    </div>
  );
}

function StudentDetail({ student, onClose }: { student: StudentResult; onClose: () => void }) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-amber-600/30">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl text-white font-bold">{student.studentName}</h3>
          <p className="text-gray-400 text-sm">{student.className} • {new Date(student.timestamp).toLocaleString('ru-RU')}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-green-900/20 rounded-lg p-3 text-center border border-green-700/30">
          <div className="text-2xl font-bold text-green-400">{student.scores.economy}</div>
          <div className="text-xs text-gray-400">💰 Экономика</div>
        </div>
        <div className="bg-blue-900/20 rounded-lg p-3 text-center border border-blue-700/30">
          <div className="text-2xl font-bold text-blue-400">{student.scores.trust}</div>
          <div className="text-xs text-gray-400">🤝 Доверие</div>
        </div>
        <div className="bg-purple-900/20 rounded-lg p-3 text-center border border-purple-700/30">
          <div className="text-2xl font-bold text-purple-400">{student.scores.political}</div>
          <div className="text-xs text-gray-400">🏛️ Политика</div>
        </div>
      </div>

      {/* Choices */}
      <h4 className="text-white font-semibold mb-2">Выборы ученика по сценам:</h4>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {student.choices.map((choice, idx) => {
          const isCorrect = choice.choiceIndex === choice.bestChoiceIndex;
          return (
            <div key={idx} className={`p-3 rounded-lg border ${
              isCorrect ? 'border-green-700/50 bg-green-900/10' : 'border-red-700/50 bg-red-900/10'
            }`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-1">{choice.sceneTitle}</p>
                  <p className="text-sm text-gray-200">{choice.choiceText}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  isCorrect ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                }`}>
                  {isCorrect ? '✓ Верно' : '✗ Ошибка'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mini-games */}
      {Object.keys(student.miniGameResults).length > 0 && (
        <div className="mt-4">
          <h4 className="text-white font-semibold mb-2">Результаты мини-игр:</h4>
          <div className="space-y-1">
            {Object.entries(student.miniGameResults).map(([id, result]) => {
              const mg = miniGames.find(m => m.id === id);
              const percent = Math.round((result.score / result.max) * 100);
              return (
                <div key={id} className="flex justify-between items-center bg-gray-700/30 rounded p-2">
                  <span className="text-gray-300 text-sm">{mg?.title.replace(/[📅🔍🔗✏️✅]\s?/, '')}</span>
                  <span className={`font-bold text-sm ${percent >= 80 ? 'text-green-400' : percent >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    {result.score}/{result.max}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function AnswersTab() {
  const [expandedScene, setExpandedScene] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <p className="text-gray-300 text-sm">
          Здесь представлены правильные ответы на все сцены и мини-игры. Используйте для проверки знаний или подготовки к уроку.
        </p>
      </div>

      {/* Scenes */}
      <div className="space-y-2">
        {chapters.map(chapter => (
          <div key={chapter.number} className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-4 bg-gray-700/30">
              <h3 className="text-amber-400 font-semibold">Глава {chapter.number}: {chapter.title}</h3>
            </div>
            <div className="p-4 space-y-3">
              {scenes.filter(s => s.chapter === chapter.number).map(scene => (
                <div key={scene.id} className="border border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedScene(expandedScene === scene.id ? null : scene.id)}
                    className="w-full text-left p-3 hover:bg-gray-700/30 transition-all flex justify-between items-center"
                  >
                    <span className="text-gray-200 text-sm font-medium">{scene.title}</span>
                    <span className="text-gray-400 text-xs">{expandedScene === scene.id ? '▼' : '▶'}</span>
                  </button>
                  {expandedScene === scene.id && (
                    <div className="p-3 border-t border-gray-700 bg-gray-800/30">
                      <p className="text-xs text-gray-400 mb-2">Правильный ответ:</p>
                      <div className="bg-green-900/20 border border-green-700/30 rounded p-3 mb-3">
                        <p className="text-green-300 text-sm">{scene.choices[scene.bestChoiceIndex].text}</p>
                      </div>
                      <p className="text-xs text-gray-400 mb-2">Все варианты (оценка качества):</p>
                      <div className="space-y-1">
                        {scene.choices.map((choice, idx) => (
                          <div key={idx} className={`p-2 rounded text-xs ${
                            idx === scene.bestChoiceIndex ? 'bg-green-900/30 border border-green-700/30' : 'bg-gray-700/30'
                          }`}>
                            <span className={`font-bold ${
                              choice.correctness === 'excellent' ? 'text-green-400' :
                              choice.correctness === 'good' ? 'text-blue-400' :
                              choice.correctness === 'acceptable' ? 'text-amber-400' :
                              'text-red-400'
                            }`}>
                              [{choice.correctness === 'excellent' ? 'Отлично' :
                                choice.correctness === 'good' ? 'Хорошо' :
                                choice.correctness === 'acceptable' ? 'Приемлемо' : 'Плохо'}]
                            </span>
                            <span className="text-gray-300 ml-2">{choice.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Mini-games answers */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-4 bg-gray-700/30">
          <h3 className="text-amber-400 font-semibold">🎮 Мини-игры: правильные ответы</h3>
        </div>
        <div className="p-4 space-y-3">
          {miniGames.map(mg => (
            <div key={mg.id} className="border border-gray-700 rounded-lg p-3">
              <p className="text-white text-sm font-medium mb-2">{mg.title}</p>
              {mg.type === 'chronology' && (
                <div className="text-xs text-gray-300">
                  <p className="text-gray-400 mb-1">Правильный порядок:</p>
                  {[...mg.items].sort((a, b) => a.year - b.year).map((item, idx) => (
                    <p key={item.id}>{idx + 1}. {item.text} ({item.year})</p>
                  ))}
                </div>
              )}
              {mg.type === 'odd-one-out' && (
                <div className="text-xs text-gray-300">
                  <p className="text-gray-400 mb-1">Лишний элемент:</p>
                  <p className="text-green-400">{mg.options.find(o => o.isOdd)?.text}</p>
                </div>
              )}
              {mg.type === 'matching' && (
                <div className="text-xs text-gray-300">
                  <p className="text-gray-400 mb-1">Правильные пары:</p>
                  {mg.pairs.map(p => (
                    <p key={p.id}><span className="text-amber-400">{p.term}</span> → {p.definition}</p>
                  ))}
                </div>
              )}
              {mg.type === 'fill-blanks' && (
                <div className="text-xs text-gray-300">
                  <p className="text-gray-400 mb-1">Правильные ответы:</p>
                  {mg.items.map(item => (
                    <p key={item.id}>• <span className="text-green-400">{item.answer}</span> — {item.sentence.replace('___', '...')}</p>
                  ))}
                </div>
              )}
              {mg.type === 'true-false' && (
                <div className="text-xs text-gray-300">
                  <p className="text-gray-400 mb-1">Ответы:</p>
                  {mg.items.map(item => (
                    <p key={item.id}>
                      <span className={item.isTrue ? 'text-green-400' : 'text-red-400'}>
                        {item.isTrue ? '✓ Верно' : '✗ Неверно'}
                      </span>
                      {' — '}{item.statement}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatsTab({ results }: { results: StudentResult[] }) {
  if (results.length === 0) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 text-center">
        <p className="text-gray-400">Недостаточно данных для статистики.</p>
      </div>
    );
  }

  // Calculate stats
  const gradeDistribution = {
    '5': results.filter(r => r.grade === '5').length,
    '4': results.filter(r => r.grade === '4').length,
    '3': results.filter(r => r.grade === '3').length,
    '2': results.filter(r => r.grade === '2').length,
  };

  const avgEconomy = Math.round(results.reduce((s, r) => s + r.scores.economy, 0) / results.length);
  const avgTrust = Math.round(results.reduce((s, r) => s + r.scores.trust, 0) / results.length);
  const avgPolitical = Math.round(results.reduce((s, r) => s + r.scores.political, 0) / results.length);

  // Most common mistakes
  const mistakeCount: Record<string, number> = {};
  results.forEach(r => {
    r.choices.forEach(c => {
      if (c.choiceIndex !== c.bestChoiceIndex) {
        mistakeCount[c.sceneId] = (mistakeCount[c.sceneId] || 0) + 1;
      }
    });
  });

  const topMistakes = Object.entries(mistakeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Grade Distribution */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h3 className="text-white font-semibold mb-4">Распределение оценок</h3>
        <div className="space-y-2">
          {Object.entries(gradeDistribution).map(([grade, count]) => {
            const percent = results.length > 0 ? Math.round((count / results.length) * 100) : 0;
            const color = grade === '5' ? 'bg-green-500' : grade === '4' ? 'bg-blue-500' : grade === '3' ? 'bg-amber-500' : 'bg-red-500';
            return (
              <div key={grade} className="flex items-center gap-3">
                <span className="text-white font-bold w-8">{grade}</span>
                <div className="flex-1 bg-gray-700 rounded-full h-6 relative">
                  <div className={`${color} h-6 rounded-full transition-all`} style={{ width: `${percent}%` }}></div>
                  <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                    {count} ({percent}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Average Scores */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h3 className="text-white font-semibold mb-4">Средние показатели</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">{avgEconomy}</div>
            <div className="text-xs text-gray-400">💰 Экономика</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">{avgTrust}</div>
            <div className="text-xs text-gray-400">🤝 Доверие</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">{avgPolitical}</div>
            <div className="text-xs text-gray-400">🏛️ Политика</div>
          </div>
        </div>
      </div>

      {/* Common Mistakes */}
      {topMistakes.length > 0 && (
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h3 className="text-white font-semibold mb-4">Самые сложные сцены (больше всего ошибок)</h3>
          <div className="space-y-2">
            {topMistakes.map(([sceneId, count]) => {
              const scene = scenes.find(s => s.id === sceneId);
              return (
                <div key={sceneId} className="flex justify-between items-center bg-red-900/10 border border-red-700/30 rounded p-3">
                  <span className="text-gray-200 text-sm">{scene?.title}</span>
                  <span className="text-red-400 text-sm font-bold">{count} ошибок</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
