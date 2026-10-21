import { useState, useEffect, useCallback } from 'react';
import { scenes, chapters, recommendations, type GameScene, type Choice } from './gameData';

type GameState = 'start' | 'chapter-intro' | 'playing' | 'feedback' | 'chapter-end' | 'results';

interface Scores {
  economy: number;
  trust: number;
  political: number;
}

function App() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [scores, setScores] = useState<Scores>({ economy: 50, trust: 50, political: 50 });
  const [lastChoice, setLastChoice] = useState<Choice | null>(null);
  const [fadeIn, setFadeIn] = useState(false);
  const [textRevealed, setTextRevealed] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [totalScenesCompleted, setTotalScenesCompleted] = useState(0);

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
      }, 20);
      return () => clearInterval(interval);
    }
  }, [gameState, currentSceneIndex]);

  // Fade in effect
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
    setGameState('chapter-intro');
    setCurrentChapter(1);
    setFadeIn(false);
    setTimeout(() => setFadeIn(true), 50);
  };

  const startChapter = () => {
    setGameState('playing');
    setFadeIn(false);
    setTimeout(() => setFadeIn(true), 50);
  };

  const handleChoice = (choice: Choice) => {
    setLastChoice(choice);
    setScores(prev => ({
      economy: Math.max(0, Math.min(100, prev.economy + choice.effects.economy)),
      trust: Math.max(0, Math.min(100, prev.trust + choice.effects.trust)),
      political: Math.max(0, Math.min(100, prev.political + choice.effects.political)),
    }));
    setTotalScenesCompleted(prev => prev + 1);
    setGameState('feedback');
    setFadeIn(false);
    setTimeout(() => setFadeIn(true), 50);
  };

  const nextScene = () => {
    const nextIndex = currentSceneIndex + 1;
    
    if (nextIndex >= scenes.length) {
      setGameState('results');
      setFadeIn(false);
      setTimeout(() => setFadeIn(true), 50);
      return;
    }

    const nextScene = scenes[nextIndex];
    
    // Check if we need to show chapter intro
    if (nextScene.chapter !== currentChapter) {
      setCurrentChapter(nextScene.chapter);
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

  const getRecommendation = () => {
    const totalScore = scores.economy + scores.trust + scores.political;
    if (totalScore >= 210) return recommendations.excellent;
    if (totalScore >= 170) return recommendations.good;
    if (totalScore >= 130) return recommendations.average;
    return recommendations.needsWork;
  };

  const getOverallGrade = () => {
    const totalScore = scores.economy + scores.trust + scores.political;
    if (totalScore >= 210) return { grade: '5', label: 'Отлично' };
    if (totalScore >= 170) return { grade: '4', label: 'Хорошо' };
    if (totalScore >= 130) return { grade: '3', label: 'Удовлетворительно' };
    return { grade: '2', label: 'Нужно повторить' };
  };

  const getProgressPercent = () => {
    return Math.round((totalScenesCompleted / scenes.length) * 100);
  };

  const restartGame = () => {
    setGameState('start');
    setCurrentSceneIndex(0);
    setCurrentChapter(1);
    setScores({ economy: 50, trust: 50, political: 50 });
    setLastChoice(null);
    setTotalScenesCompleted(0);
  };

  // === RENDER SCREENS ===

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
              Вы будете принимать решения, определяющие судьбу нации. Ваши действия повлияют на экономику, 
              доверие народа и политический капитал президента.
            </p>
            <div className="border-t border-gray-700 pt-4 mt-4">
              <p className="text-gray-400 text-sm">
                📊 Три шкалы прогресса будут отслеживать ваши решения:<br/>
                💰 Экономика • 🤝 Доверие народа • 🏛️ Политический капитал
              </p>
            </div>
          </div>

          <button
            onClick={startGame}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 px-12 rounded-lg text-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-amber-600/20"
          >
            Начать игру
          </button>
          
          <p className="text-gray-500 text-xs mt-4">
            ⏱ Примерное время прохождения: 30-35 минут
          </p>
        </div>
      </div>
    );
  }

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

          {/* Progress bar */}
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

          <button
            onClick={startChapter}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-10 rounded-lg text-lg transition-all duration-300 transform hover:scale-105"
          >
            Продолжить →
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'playing' && currentScene) {
    return (
      <div className={`min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex flex-col transition-opacity duration-700 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        {/* Top bar with scores */}
        <div className="bg-gray-800/80 border-b border-gray-700 p-3 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-amber-400 text-sm font-semibold">
                Глава {currentScene.chapter}: {chapters.find(c => c.number === currentScene.chapter)?.title}
              </span>
              <span className="text-gray-400 text-xs">
                Сцена {currentSceneIndex + 1} из {scenes.length}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <ScoreBar label="💰 Экономика" value={scores.economy} color="bg-green-500" />
              <ScoreBar label="🤝 Доверие" value={scores.trust} color="bg-blue-500" />
              <ScoreBar label="🏛️ Политика" value={scores.political} color="bg-purple-500" />
            </div>
            {/* Overall progress */}
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

        {/* Main content */}
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
                    onClick={() => handleChoice(choice)}
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

  if (gameState === 'feedback' && lastChoice) {
    return (
      <div className={`min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex flex-col transition-opacity duration-700 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        {/* Top bar with scores */}
        <div className="bg-gray-800/80 border-b border-gray-700 p-3 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-amber-400 text-sm font-semibold">
                Глава {currentScene?.chapter}: {chapters.find(c => c.number === currentScene?.chapter)?.title}
              </span>
              <span className="text-gray-400 text-xs">
                Сцена {currentSceneIndex + 1} из {scenes.length}
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

        {/* Feedback content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-3xl w-full">
            <h3 className="text-xl text-amber-400 font-semibold mb-4 font-serif">
              Последствия вашего решения
            </h3>
            
            <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700">
              <p className="text-gray-200 leading-relaxed text-lg mb-6">
                {lastChoice.feedback}
              </p>

              {/* Effects display */}
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

  if (gameState === 'results') {
    const recommendation = getRecommendation();
    const grade = getOverallGrade();
    
    return (
      <div className={`min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 transition-opacity duration-700 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-3xl w-full">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🎓</div>
            <h2 className="text-3xl font-bold text-white mb-2 font-serif">Игра завершена</h2>
            <p className="text-gray-400">Ваши результаты и рекомендации</p>
          </div>

          {/* Grade */}
          <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-amber-600/30 text-center">
            <div className="text-5xl font-bold text-amber-400 mb-2">{grade.grade}</div>
            <div className="text-xl text-gray-300">{grade.label}</div>
          </div>

          {/* Final Scores */}
          <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Итоговые показатели:</h3>
            <div className="space-y-4">
              <FinalScoreBar label="💰 Экономика" value={scores.economy} color="bg-green-500" description="Состояние экономики страны" />
              <FinalScoreBar label="🤝 Доверие народа" value={scores.trust} color="bg-blue-500" description="Поддержка населения" />
              <FinalScoreBar label="🏛️ Политический капитал" value={scores.political} color="bg-purple-500" description="Влияние в политике" />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Общий прогресс игры</span>
                <span>{getProgressPercent()}% ({totalScenesCompleted} из {scenes.length} сцен)</span>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-amber-400 mb-3">{recommendation.title}</h3>
            <p className="text-gray-300 leading-relaxed mb-4">{recommendation.description}</p>
            
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-white font-semibold mb-3">📋 Рекомендации по изучению:</h4>
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

          {/* Key facts summary */}
          <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3">📚 Ключевые факты для запоминания:</h3>
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

          <button
            onClick={restartGame}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-[1.02]"
          >
            Пройти заново
          </button>
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
