import { useState, useEffect, useCallback } from 'react';
import { scenes, chapters, recommendations, type GameScene, type Choice } from './gameData';
import { miniGames, type MiniGame } from './miniGames';
import { MiniGameComponent } from './MiniGameComponent';
import { TeacherPanel } from './TeacherPanel';

type GameState = 'start' | 'name-entry' | 'chapter-intro' | 'playing' | 'feedback' | 'minigame' | 'results' | 'teacher';

interface Scores {
  economy: number;
  trust: number;
  political: number;
}

interface StudentResult {
  id: string;
  studentName: string;
  className: string;
  timestamp: number;
  scores: Scores;
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

function App() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [scores, setScores] = useState<Scores>({ economy: 40, trust: 40, political: 40 });
  const [lastChoice, setLastChoice] = useState<Choice | null>(null);
  const [lastChoiceIndex, setLastChoiceIndex] = useState<number>(0);
  const [fadeIn, setFadeIn] = useState(false);
  const [textRevealed, setTextRevealed] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [totalScenesCompleted, setTotalScenesCompleted] = useState(0);
  const [currentMiniGame, setCurrentMiniGame] = useState<MiniGame | null>(null);
  const [completedMiniGames, setCompletedMiniGames] = useState<string[]>([]);
  const [miniGameResults, setMiniGameResults] = useState<Record<string, { score: number; max: number }>>({});
  const [studentName, setStudentName] = useState('');
  const [className, setClassName] = useState('');
  const [choiceHistory, setChoiceHistory] = useState<StudentResult['choices']>([]);

  const currentScene: GameScene | undefined = scenes[currentSceneIndex];

  // Typewriter effect
  useEffect(() => {
    if (gameState === 'playing' && currentScene) {
      setTextRevealed(false);
      setDisplayedText('');
      let i = 0;
      const text = currentScene.narrative;
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayedText(text.substring(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
          setTextRevealed(true);
        }
      }, 18);
      return () => clearInterval(interval);
    }
  }, [gameState, currentSceneIndex]);

  useEffect(() => {
    setFadeIn(true);
  }, [gameState, currentSceneIndex]);

  const skipText = useCallback(() => {
    if (currentScene && !textRevealed) {
      setDisplayedText(currentScene.narrative);
      setTextRevealed(true);
    }
  }, [currentScene, textRevealed]);

  const startGame = () => {
    setGameState('name-entry');
    setFadeIn(false);
    setTimeout(() => setFadeIn(true), 50);
  };

  const submitName = () => {
    if (studentName.trim() && className.trim()) {
      setGameState('chapter-intro');
      setCurrentChapter(1);
      setFadeIn(false);
      setTimeout(() => setFadeIn(true), 50);
    }
  };

  const startChapter = () => {
    setGameState('playing');
    setFadeIn(false);
    setTimeout(() => setFadeIn(true), 50);
  };

  const handleChoice = (choice: Choice, choiceIndex: number) => {
    setLastChoice(choice);
    setLastChoiceIndex(choiceIndex);
    
    // Apply effects with STRICT scaling
    const scaleEffect = (value: number, currentScore: number) => {
      // Чем выше текущий балл, тем сложнее его повысить
      if (value > 0) {
        // Множитель уменьшается: при 40 = 1.0, при 100 = 0.2
        const multiplier = 1 - (currentScore - 40) / 100;
        return Math.round(value * Math.max(0.25, multiplier));
      } else {
        // Штрафы усиливаются при высоком балле
        const multiplier = 1 + (currentScore - 40) / 120;
        return Math.round(value * Math.min(2.0, multiplier));
      }
    };

    setScores(prev => ({
      economy: Math.max(0, Math.min(100, prev.economy + scaleEffect(choice.effects.economy, prev.economy))),
      trust: Math.max(0, Math.min(100, prev.trust + scaleEffect(choice.effects.trust, prev.trust))),
      political: Math.max(0, Math.min(100, prev.political + scaleEffect(choice.effects.political, prev.political))),
    }));

    // Save choice to history
    if (currentScene) {
      setChoiceHistory(prev => [...prev, {
        sceneId: currentScene.id,
        sceneTitle: currentScene.title,
        choiceIndex: choiceIndex,
        choiceText: choice.text,
        correctness: choice.correctness,
        bestChoiceIndex: currentScene.bestChoiceIndex,
      }]);
    }

    setTotalScenesCompleted(prev => prev + 1);
    setGameState('feedback');
    setFadeIn(false);
    setTimeout(() => setFadeIn(true), 50);
  };

  const getMiniGameForChapter = (chapterNum: number): MiniGame | null => {
    const mg = miniGames.find(m => m.afterChapter === chapterNum && !completedMiniGames.includes(m.id));
    return mg || null;
  };

  const nextScene = () => {
    const nextIndex = currentSceneIndex + 1;
    
    if (nextIndex >= scenes.length) {
      saveResult();
      setGameState('results');
      setFadeIn(false);
      setTimeout(() => setFadeIn(true), 50);
      return;
    }

    const nextSceneData = scenes[nextIndex];
    
    if (nextSceneData.chapter !== currentChapter) {
      const mg = getMiniGameForChapter(currentChapter);
      if (mg) {
        setCurrentMiniGame(mg);
        setGameState('minigame');
        setFadeIn(false);
        setTimeout(() => setFadeIn(true), 50);
        return;
      }
      
      setCurrentChapter(nextSceneData.chapter);
      setGameState('chapter-intro');
      setFadeIn(false);
      setTimeout(() => setFadeIn(true), 50);
    } else {
      setCurrentSceneIndex(nextIndex);
      setGameState('playing');
      setFadeIn(false);
      setTimeout(() => setFadeIn(true), 50);
    }
  };

  const handleMiniGameComplete = (score: number, maxScore: number) => {
    if (currentMiniGame) {
      setCompletedMiniGames(prev => [...prev, currentMiniGame.id]);
      setMiniGameResults(prev => ({ ...prev, [currentMiniGame.id]: { score, max: maxScore } }));
      
      // Mini-game effects — строгие
      const ratio = score / maxScore;
      let bonus: number;
      if (ratio >= 0.95) bonus = 3;
      else if (ratio >= 0.8) bonus = 2;
      else if (ratio >= 0.6) bonus = 1;
      else if (ratio >= 0.4) bonus = 0;
      else bonus = -2;

      setScores(prev => ({
        economy: Math.max(0, Math.min(100, prev.economy + bonus)),
        trust: Math.max(0, Math.min(100, prev.trust + bonus)),
        political: Math.max(0, Math.min(100, prev.political + bonus)),
      }));
    }
    
    const nextIndex = currentSceneIndex + 1;
    if (nextIndex < scenes.length) {
      const nextSceneData = scenes[nextIndex];
      setCurrentChapter(nextSceneData.chapter);
      setCurrentSceneIndex(nextIndex);
      setGameState('chapter-intro');
    } else {
      saveResult();
      setGameState('results');
    }
    setFadeIn(false);
    setTimeout(() => setFadeIn(true), 50);
  };

  // Save result to localStorage
  const saveResult = () => {
    const { grade, label } = getOverallGrade();
    const result: StudentResult = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      studentName: studentName,
      className: className,
      timestamp: Date.now(),
      scores: { ...scores },
      totalScore: scores.economy + scores.trust + scores.political,
      grade: grade,
      gradeLabel: label,
      scenesCompleted: totalScenesCompleted,
      miniGameResults: { ...miniGameResults },
      choices: [...choiceHistory],
    };

    const stored = localStorage.getItem('game_student_results');
    const results: StudentResult[] = stored ? JSON.parse(stored) : [];
    results.push(result);
    localStorage.setItem('game_student_results', JSON.stringify(results));
  };

  // === STRICT GRADING SYSTEM ===
  // Строгая система оценивания
  // Старт: 40/40/40 = 120 баллов
  // Максимум: 100/100/100 = 300 баллов
  const getOverallGrade = () => {
    const totalScore = scores.economy + scores.trust + scores.political;
    const percent = (totalScore / 300) * 100;
    
    if (percent >= 87) return { grade: '5', label: 'Отлично' };      // 261+
    if (percent >= 77) return { grade: '4', label: 'Хорошо' };       // 231+
    if (percent >= 65) return { grade: '3', label: 'Удовлетворительно' }; // 195+
    return { grade: '2', label: 'Нужно повторить' };                 // <195
  };

  const getRecommendation = () => {
    const totalScore = scores.economy + scores.trust + scores.political;
    const percent = (totalScore / 300) * 100;
    
    if (percent >= 87) return recommendations.excellent;
    if (percent >= 77) return recommendations.good;
    if (percent >= 65) return recommendations.average;
    return recommendations.needsWork;
  };

  const getProgressPercent = () => {
    return Math.round((totalScenesCompleted / scenes.length) * 100);
  };

  const restartGame = () => {
    setGameState('start');
    setCurrentSceneIndex(0);
    setCurrentChapter(1);
    setScores({ economy: 40, trust: 40, political: 40 });
    setLastChoice(null);
    setLastChoiceIndex(0);
    setTotalScenesCompleted(0);
    setCurrentMiniGame(null);
    setCompletedMiniGames([]);
    setMiniGameResults({});
    setStudentName('');
    setClassName('');
    setChoiceHistory([]);
  };

  const renderScoresBar = () => (
    <div className="bg-gray-800/80 border-b border-gray-700 p-3 sticky top-0 z-10 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-2">
          <span className="text-amber-400 text-sm font-semibold">
            Глава {currentScene?.chapter || currentChapter}: {chapters.find(c => c.number === (currentScene?.chapter || currentChapter))?.title}
          </span>
          <span className="text-gray-400 text-xs">
            {getProgressPercent()}% пройдено
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <ScoreBar label="💰 Экономика" value={scores.economy} color="bg-green-500" />
          <ScoreBar label="🤝 Доверие" value={scores.trust} color="bg-blue-500" />
          <ScoreBar label="🏛️ Политика" value={scores.political} color="bg-purple-500" />
        </div>
        <div className="mt-2">
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div 
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${getProgressPercent()}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );

  // === START SCREEN ===
  if (gameState === 'start') {
    return (
      <div className={`min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 transition-opacity duration-700 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-3xl w-full text-center">
          <div className="mb-8">
            <div className="text-6xl mb-4">🏛️</div>
            <h1 className="text-4xl md:text-5xl font-bold text-amber-400 mb-4 font-serif">
              Великая Депрессия
            </h1>
            <h2 className="text-xl md:text-2xl text-gray-300 mb-2">
              Советник Президента
            </h2>
            <p className="text-gray-400 text-sm italic">
              Интерактивная историческая игра для 10 класса
            </p>
          </div>
          
          <div className="bg-gray-800/50 rounded-xl p-6 mb-8 border border-gray-700 text-left">
            <p className="text-gray-300 leading-relaxed mb-4">
              <span className="text-amber-400 font-semibold">1929 год.</span> Америка на пороге величайшего экономического кризиса в своей истории. 
              Миллионы людей теряют работу, дома и сбережения. Страна ждёт лидера, который выведет её из тьмы.
            </p>
            <p className="text-gray-300 leading-relaxed mb-4">
              <span className="text-amber-400 font-semibold">Ваша роль:</span> молодой советник президента Франклина Д. Рузвельта. 
              Вы будете принимать решения, определяющие судьбу нации, проходить мини-игры на знание истории 
              и влиять на три ключевых показателя.
            </p>
            <div className="border-t border-gray-700 pt-4 mt-4">
              <p className="text-gray-400 text-sm mb-2">
                📊 Три шкалы прогресса будут отслеживать ваши решения:
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-green-900/20 border border-green-700/30 rounded p-2">
                  <span className="text-green-400">💰 Экономика</span>
                </div>
                <div className="bg-blue-900/20 border border-blue-700/30 rounded p-2">
                  <span className="text-blue-400">🤝 Доверие народа</span>
                </div>
                <div className="bg-purple-900/20 border border-purple-700/30 rounded p-2">
                  <span className="text-purple-400">🏛️ Политический капитал</span>
                </div>
              </div>

            </div>
          </div>

          <button
            onClick={startGame}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 px-12 rounded-lg text-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-amber-600/20"
          >
            Начать игру
          </button>
          
          <div className="mt-6 flex flex-col items-center gap-2">
            <button
              onClick={() => setGameState('teacher')}
              className="text-gray-500 hover:text-gray-300 text-sm transition-all"
            >
              🔐 Панель учителя
            </button>
            <p className="text-gray-600 text-xs">
              ⏱ Примерное время: 30-35 минут • 5 глав • 15 сцен • 5 мини-игр
            </p>
          </div>
        </div>
      </div>
    );
  }

  // === NAME ENTRY ===
  if (gameState === 'name-entry') {
    return (
      <div className={`min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 transition-opacity duration-700 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">👤</div>
            <h2 className="text-2xl font-bold text-white mb-2">Регистрация участника</h2>
            <p className="text-gray-400 text-sm">Представьтесь для сохранения результатов</p>
          </div>
          
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 space-y-4">
            <div>
              <label className="block text-gray-300 text-sm mb-1">Фамилия и Имя ученика *</label>
              <input
                type="text"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                placeholder="Например: Иванов Иван"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-1">Класс *</label>
              <input
                type="text"
                value={className}
                onChange={e => setClassName(e.target.value)}
                placeholder="Например: 10А"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              onClick={submitName}
              disabled={!studentName.trim() || !className.trim()}
              className={`w-full font-bold py-3 rounded-lg transition-all ${
                !studentName.trim() || !className.trim()
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              Начать игру →
            </button>
            <button
              onClick={() => setGameState('start')}
              className="w-full text-gray-400 hover:text-white text-sm py-2 transition-all"
            >
              ← Назад
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === TEACHER PANEL ===
  if (gameState === 'teacher') {
    return <TeacherPanel onClose={() => setGameState('start')} />;
  }

  // === CHAPTER INTRO ===
  if (gameState === 'chapter-intro') {
    const chapter = chapters.find(c => c.number === currentChapter);
    return (
      <div className={`min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 transition-opacity duration-700 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-3xl w-full text-center">
          <div className="mb-6">
            <div className="text-sm text-amber-400 uppercase tracking-widest mb-2">
              Глава {chapter?.number}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 font-serif">
              {chapter?.title}
            </h2>
            <p className="text-gray-400 text-lg italic mb-6">
              {chapter?.subtitle}
            </p>
          </div>
          
          <div className="bg-gray-800/50 rounded-xl p-6 mb-8 border border-gray-700">
            <p className="text-gray-300 leading-relaxed text-lg">
              {chapter?.intro}
            </p>
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>Прогресс игры</span>
              <span>{getProgressPercent()}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-amber-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${getProgressPercent()}%` }}
              ></div>
            </div>
          </div>

          <div className="flex justify-center gap-2 mb-6">
            {chapters.map(ch => (
              <div key={ch.number} className={`w-3 h-3 rounded-full ${
                ch.number < currentChapter ? 'bg-amber-400' : 
                ch.number === currentChapter ? 'bg-amber-400 ring-2 ring-amber-400/50' : 
                'bg-gray-600'
              }`} />
            ))}
          </div>

          <button
            onClick={startChapter}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-10 rounded-lg text-lg transition-all duration-300 transform hover:scale-105"
          >
            Начать главу →
          </button>
        </div>
      </div>
    );
  }

  // === PLAYING ===
  if (gameState === 'playing' && currentScene) {
    return (
      <div className={`min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex flex-col transition-opacity duration-700 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        {renderScoresBar()}

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-3xl w-full">
            <h3 className="text-xl text-amber-400 font-semibold mb-4 font-serif">
              {currentScene.title}
            </h3>
            
            <div 
              className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700 cursor-pointer"
              onClick={skipText}
            >
              <p className="text-gray-200 leading-relaxed text-lg whitespace-pre-line">
                {displayedText}
                {!textRevealed && <span className="animate-pulse text-amber-400">▊</span>}
              </p>
              {!textRevealed && (
                <p className="text-gray-500 text-xs mt-3 italic">Нажмите, чтобы пропустить анимацию текста</p>
              )}
            </div>

            {currentScene.historicalNote && textRevealed && (
              <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-4 mb-6">
                <p className="text-amber-300 text-sm">
                  <span className="font-bold">📖 Историческая справка:</span> {currentScene.historicalNote}
                </p>
              </div>
            )}

            {textRevealed && (
              <div className="space-y-3">
                <p className="text-gray-400 text-sm font-semibold uppercase tracking-wide mb-3">
                  Ваш выбор:
                </p>
                {currentScene.choices.map((choice, index) => (
                  <button
                    key={index}
                    onClick={() => handleChoice(choice, index)}
                    className="w-full text-left bg-gray-700/50 hover:bg-gray-700 border border-gray-600 hover:border-amber-500 rounded-lg p-4 transition-all duration-200 group"
                  >
                    <span className="text-gray-200 group-hover:text-white">
                      {choice.text}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // === FEEDBACK ===
  if (gameState === 'feedback' && lastChoice) {
    return (
      <div className={`min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex flex-col transition-opacity duration-700 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        {renderScoresBar()}

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-3xl w-full">
            <h3 className="text-xl text-amber-400 font-semibold mb-4 font-serif">
              Последствия вашего решения
            </h3>
            
            <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700">
              <p className="text-gray-200 leading-relaxed text-lg mb-6">
                {lastChoice.feedback}
              </p>

              <div className="border-t border-gray-700 pt-4">
                <p className="text-gray-400 text-sm mb-3 font-semibold">Влияние на показатели:</p>
                <div className="grid grid-cols-3 gap-4">
                  <EffectDisplay label="💰 Экономика" value={lastChoice.effects.economy} />
                  <EffectDisplay label="🤝 Доверие" value={lastChoice.effects.trust} />
                  <EffectDisplay label="🏛️ Политика" value={lastChoice.effects.political} />
                </div>
              </div>
            </div>

            <button
              onClick={nextScene}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-[1.02]"
            >
              {currentSceneIndex + 1 >= scenes.length ? 'Завершить игру →' : 'Далее →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === MINI-GAME ===
  if (gameState === 'minigame' && currentMiniGame) {
    return (
      <div className={`min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex flex-col transition-opacity duration-700 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        {renderScoresBar()}

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-3xl w-full">
            <div className="text-center mb-6">
              <div className="inline-block bg-amber-900/30 border border-amber-600/50 rounded-full px-4 py-1 mb-3">
                <span className="text-amber-400 text-sm font-semibold">🎮 Мини-игра</span>
              </div>
              <h3 className="text-2xl text-white font-semibold font-serif">
                {currentMiniGame.title}
              </h3>
            </div>
            
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <MiniGameComponent 
                game={currentMiniGame} 
                onComplete={handleMiniGameComplete}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === RESULTS ===
  if (gameState === 'results') {
    const recommendation = getRecommendation();
    const { grade, label } = getOverallGrade();
    
    return (
      <div className={`min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 transition-opacity duration-700 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-3xl w-full">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">🎓</div>
            <h2 className="text-3xl font-bold text-white mb-2 font-serif">Игра завершена</h2>
            <p className="text-gray-400">{studentName} • {className}</p>
          </div>

          {/* Grade */}
          <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-amber-600/30 text-center">
            <div className="text-5xl font-bold text-amber-400 mb-2">{grade}</div>
            <div className="text-xl text-gray-300">{label}</div>
            <div className="text-xs text-gray-500 mt-2">
              Итого: {scores.economy + scores.trust + scores.political} из 300 баллов
            </div>
          </div>

          {/* Final Scores */}
          <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Итоговые показатели:</h3>
            <div className="space-y-4">
              <FinalScoreBar label="💰 Экономика" value={scores.economy} color="bg-green-500" description="Состояние экономики" />
              <FinalScoreBar label="🤝 Доверие народа" value={scores.trust} color="bg-blue-500" description="Поддержка населения" />
              <FinalScoreBar label="🏛️ Политический капитал" value={scores.political} color="bg-purple-500" description="Влияние в политике" />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Пройдено сцен</span>
                <span>{totalScenesCompleted} из {scenes.length}</span>
              </div>
            </div>
          </div>

          {/* Accuracy stats */}
          <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Точность ответов:</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">
                  {choiceHistory.filter(c => c.choiceIndex === c.bestChoiceIndex).length}
                </div>
                <div className="text-xs text-gray-400">Правильных</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400">
                  {choiceHistory.filter(c => c.choiceIndex !== c.bestChoiceIndex).length}
                </div>
                <div className="text-xs text-gray-400">Ошибок</div>
              </div>
            </div>
            {Object.keys(miniGameResults).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-gray-400 text-sm mb-2">Мини-игры:</p>
                <div className="space-y-1">
                  {Object.entries(miniGameResults).map(([id, result]) => {
                    const mg = miniGames.find(m => m.id === id);
                    const percent = Math.round((result.score / result.max) * 100);
                    return (
                      <div key={id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-300">{mg?.title.replace(/[📅🔍🔗✏️✅]\s?/, '').substring(0, 30)}...</span>
                        <span className={`font-bold ${percent >= 80 ? 'text-green-400' : percent >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                          {result.score}/{result.max}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Recommendation */}
          <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-amber-400 mb-3">{recommendation.title}</h3>
            <p className="text-gray-300 leading-relaxed mb-4">{recommendation.description}</p>
            
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-white font-semibold mb-3">📋 Рекомендации:</h4>
              <ul className="space-y-2">
                {recommendation.tips.map((tip, index) => (
                  <li key={index} className="text-gray-300 text-sm flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Key facts */}
          <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3">📚 Ключевые факты:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FactCard fact="Великая депрессия: 1929-1939" />
              <FactCard fact="Безработица: до 25%" />
              <FactCard fact="Новый курс (New Deal): с 1933" />
              <FactCard fact="Первые 100 дней: 15 законов" />
              <FactCard fact="CCC: 3 млн рабочих мест" />
              <FactCard fact="Social Security Act: 1935" />
              <FactCard fact="«Беседы у камина» — радиообращения" />
              <FactCard fact="Кейнсианство — теория гос. вмешательства" />
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={restartGame}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-[1.02]"
            >
              Пройти заново
            </button>
            <p className="text-center text-gray-500 text-xs">
              ✓ Результаты сохранены и доступны учителю
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// === SUB-COMPONENTS ===

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-0.5">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className={`${color} h-2 rounded-full transition-all duration-700`}
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );
}

function EffectDisplay({ label, value }: { label: string; value: number }) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const color = isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-gray-400';
  const symbol = isPositive ? '+' : '';
  
  return (
    <div className="text-center">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`text-lg font-bold ${color}`}>
        {symbol}{value}
      </div>
    </div>
  );
}

function FinalScoreBar({ label, value, color, description }: { label: string; value: number; color: string; description: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-gray-300 text-sm font-medium">{label}</span>
        <span className="text-gray-400 text-xs">{description}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-700 rounded-full h-4">
          <div 
            className={`${color} h-4 rounded-full transition-all duration-1000`}
            style={{ width: `${value}%` }}
          ></div>
        </div>
        <span className="text-white font-bold text-sm w-10 text-right">{value}%</span>
      </div>
    </div>
  );
}

function FactCard({ fact }: { fact: string }) {
  return (
    <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
      <p className="text-gray-300 text-sm">{fact}</p>
    </div>
  );
}

export default App;
