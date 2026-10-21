import { useState, useEffect } from 'react';
import type { MiniGame, ChronologyGame, MatchingGame, OddOneOutGame, FillBlanksGame, TrueFalseGame } from './miniGames';

interface MiniGameProps {
  game: MiniGame;
  onComplete: (score: number, maxScore: number) => void;
}

export function MiniGameComponent({ game, onComplete }: MiniGameProps) {
  switch (game.type) {
    case 'chronology':
      return <ChronologyMiniGame game={game} onComplete={onComplete} />;
    case 'matching':
      return <MatchingMiniGame game={game} onComplete={onComplete} />;
    case 'odd-one-out':
      return <OddOneOutMiniGame game={game} onComplete={onComplete} />;
    case 'fill-blanks':
      return <FillBlanksMiniGame game={game} onComplete={onComplete} />;
    case 'true-false':
      return <TrueFalseMiniGame game={game} onComplete={onComplete} />;
  }
}

// === ХРОНОЛОГИЯ ===
function ChronologyMiniGame({ game, onComplete }: { game: ChronologyGame; onComplete: (s: number, m: number) => void }) {
  const [items, setItems] = useState(() => {
    const shuffled = [...game.items].sort(() => Math.random() - 0.5);
    return shuffled;
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleClick = (id: string) => {
    if (checked) return;
    if (!selected) {
      setSelected(id);
    } else if (selected !== id) {
      // Swap items
      setItems(prev => {
        const newItems = [...prev];
        const idx1 = newItems.findIndex(i => i.id === selected);
        const idx2 = newItems.findIndex(i => i.id === id);
        [newItems[idx1], newItems[idx2]] = [newItems[idx2], newItems[idx1]];
        return newItems;
      });
      setSelected(null);
    } else {
      setSelected(null);
    }
  };

  const checkOrder = () => {
    const correctOrder = [...game.items].sort((a, b) => a.year - b.year);
    const isOrderCorrect = items.every((item, idx) => item.id === correctOrder[idx].id);
    setIsCorrect(isOrderCorrect);
    setChecked(true);
  };

  const handleContinue = () => {
    onComplete(isCorrect ? game.items.length : Math.floor(game.items.length / 2), game.items.length);
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-300 text-sm">{game.description}</p>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            className={`w-full text-left p-3 rounded-lg border transition-all ${
              selected === item.id 
                ? 'border-amber-400 bg-amber-900/30' 
                : checked 
                  ? isCorrect 
                    ? 'border-green-500 bg-green-900/20'
                    : 'border-red-500 bg-red-900/20'
                  : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
            }`}
          >
            <span className="text-amber-400 font-bold mr-2">{idx + 1}.</span>
            <span className="text-gray-200">{item.text}</span>
            {checked && (
              <span className="float-right text-sm text-gray-400">
                ({item.year})
              </span>
            )}
          </button>
        ))}
      </div>
      {!checked ? (
        <button
          onClick={checkOrder}
          className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-6 rounded-lg transition-all"
        >
          ✓ Проверить порядок
        </button>
      ) : (
        <div className="space-y-3">
          <p className={`text-sm ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
            {isCorrect ? game.successFeedback : game.failFeedback}
          </p>
          <button
            onClick={handleContinue}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-6 rounded-lg transition-all"
          >
            Продолжить →
          </button>
        </div>
      )}
    </div>
  );
}

// === СООТВЕТСТВИЕ ===
function MatchingMiniGame({ game, onComplete }: { game: MatchingGame; onComplete: (s: number, m: number) => void }) {
  const [shuffledDefs, setShuffledDefs] = useState(() => 
    [...game.pairs].sort(() => Math.random() - 0.5)
  );
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const handleTermClick = (id: string) => {
    if (checked || matches[id]) return;
    setSelectedTerm(id);
  };

  const handleDefClick = (defId: string) => {
    if (checked || !selectedTerm) return;
    // Check if this definition is already matched
    if (Object.values(matches).includes(defId)) return;
    
    setMatches(prev => ({ ...prev, [selectedTerm]: defId }));
    setSelectedTerm(null);
  };

  const checkMatches = () => {
    let correct = 0;
    game.pairs.forEach(pair => {
      if (matches[pair.id] === pair.id) correct++;
    });
    setCorrectCount(correct);
    setChecked(true);
  };

  const handleContinue = () => {
    onComplete(correctCount, game.pairs.length);
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-300 text-sm">{game.description}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Terms column */}
        <div className="space-y-2">
          <p className="text-amber-400 text-xs font-semibold uppercase">Программы:</p>
          {game.pairs.map(pair => (
            <button
              key={pair.id}
              onClick={() => handleTermClick(pair.id)}
              className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                matches[pair.id] 
                  ? 'border-green-500 bg-green-900/20 opacity-70'
                  : selectedTerm === pair.id 
                    ? 'border-amber-400 bg-amber-900/30' 
                    : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
              }`}
            >
              <span className="text-gray-200 font-medium">{pair.term}</span>
              {matches[pair.id] && (
                <span className="block text-xs text-green-400 mt-1">
                  ✓ Соединено
                </span>
              )}
            </button>
          ))}
        </div>
        {/* Definitions column */}
        <div className="space-y-2">
          <p className="text-amber-400 text-xs font-semibold uppercase">Описания:</p>
          {shuffledDefs.map(pair => {
            const isMatched = Object.values(matches).includes(pair.id);
            const matchedTerm = Object.entries(matches).find(([, v]) => v === pair.id);
            const isCorrectMatch = checked && matchedTerm && matchedTerm[0] === pair.id;
            const isWrongMatch = checked && matchedTerm && matchedTerm[0] !== pair.id;
            
            return (
              <button
                key={pair.id}
                onClick={() => handleDefClick(pair.id)}
                className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                  isMatched && !checked
                    ? 'border-green-500 bg-green-900/20 opacity-70'
                    : isCorrectMatch
                      ? 'border-green-500 bg-green-900/20'
                      : isWrongMatch
                        ? 'border-red-500 bg-red-900/20'
                        : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                }`}
              >
                <span className="text-gray-300">{pair.definition}</span>
              </button>
            );
          })}
        </div>
      </div>
      {!checked ? (
        <button
          onClick={checkMatches}
          disabled={Object.keys(matches).length < game.pairs.length}
          className={`w-full font-bold py-3 px-6 rounded-lg transition-all ${
            Object.keys(matches).length < game.pairs.length
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-amber-600 hover:bg-amber-500 text-white'
          }`}
        >
          ✓ Проверить ({Object.keys(matches).length}/{game.pairs.length})
        </button>
      ) : (
        <div className="space-y-3">
          <p className={`text-sm ${correctCount === game.pairs.length ? 'text-green-400' : 'text-amber-400'}`}>
            Правильных: {correctCount} из {game.pairs.length}
          </p>
          <p className="text-gray-300 text-sm">
            {correctCount === game.pairs.length ? game.successFeedback : game.failFeedback}
          </p>
          <button
            onClick={handleContinue}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-6 rounded-lg transition-all"
          >
            Продолжить →
          </button>
        </div>
      )}
    </div>
  );
}

// === ЧТО ЛИШНЕЕ ===
function OddOneOutMiniGame({ game, onComplete }: { game: OddOneOutGame; onComplete: (s: number, m: number) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSelect = (id: string) => {
    if (checked) return;
    setSelected(id);
  };

  const check = () => {
    if (!selected) return;
    const option = game.options.find(o => o.id === selected);
    const correct = option?.isOdd || false;
    setIsCorrect(correct);
    setChecked(true);
  };

  const handleContinue = () => {
    onComplete(isCorrect ? 1 : 0, 1);
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-300 text-sm">{game.description}</p>
      <p className="text-white font-medium">{game.question}</p>
      <div className="space-y-2">
        {game.options.map(option => (
          <button
            key={option.id}
            onClick={() => handleSelect(option.id)}
            className={`w-full text-left p-4 rounded-lg border transition-all ${
              checked && option.isOdd
                ? 'border-green-500 bg-green-900/20'
                : checked && selected === option.id && !option.isOdd
                  ? 'border-red-500 bg-red-900/20'
                  : selected === option.id
                    ? 'border-amber-400 bg-amber-900/30'
                    : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
            }`}
          >
            <span className="text-gray-200">{option.text}</span>
            {checked && (
              <span className="block text-xs mt-2 text-gray-400">
                {option.explanation}
              </span>
            )}
          </button>
        ))}
      </div>
      {!checked ? (
        <button
          onClick={check}
          disabled={!selected}
          className={`w-full font-bold py-3 px-6 rounded-lg transition-all ${
            !selected
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-amber-600 hover:bg-amber-500 text-white'
          }`}
        >
          ✓ Проверить
        </button>
      ) : (
        <div className="space-y-3">
          <p className={`text-sm ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
            {isCorrect ? game.successFeedback : game.failFeedback}
          </p>
          <button
            onClick={handleContinue}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-6 rounded-lg transition-all"
          >
            Продолжить →
          </button>
        </div>
      )}
    </div>
  );
}

// === ЗАПОЛНЕНИЕ ПРОПУСКОВ ===
function FillBlanksMiniGame({ game, onComplete }: { game: FillBlanksGame; onComplete: (s: number, m: number) => void }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const currentItem = game.items[currentIdx];

  const handleAnswer = (answer: string) => {
    if (checked) return;
    setAnswers(prev => ({ ...prev, [currentItem.id]: answer }));
  };

  const handleNext = () => {
    if (currentIdx < game.items.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      // Check all answers
      let correct = 0;
      game.items.forEach(item => {
        if (answers[item.id] === item.answer) correct++;
      });
      setCorrectCount(correct);
      setChecked(true);
    }
  };

  const handleContinue = () => {
    onComplete(correctCount, game.items.length);
  };

  if (checked) {
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          {game.items.map(item => (
            <div key={item.id} className={`p-3 rounded-lg border ${
              answers[item.id] === item.answer 
                ? 'border-green-500 bg-green-900/20' 
                : 'border-red-500 bg-red-900/20'
            }`}>
              <p className="text-gray-200 text-sm">{item.sentence.replace('___', `<strong>${item.answer}</strong>`)}</p>
              {answers[item.id] !== item.answer && (
                <p className="text-xs text-red-400 mt-1">Ваш ответ: {answers[item.id] || '—'}</p>
              )}
            </div>
          ))}
        </div>
        <p className={`text-sm ${correctCount === game.items.length ? 'text-green-400' : 'text-amber-400'}`}>
          Правильных: {correctCount} из {game.items.length}
        </p>
        <p className="text-gray-300 text-sm">
          {correctCount === game.items.length ? game.successFeedback : game.failFeedback}
        </p>
        <button
          onClick={handleContinue}
          className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-6 rounded-lg transition-all"
        >
          Продолжить →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-300 text-sm">{game.description}</p>
      <div className="flex justify-between text-xs text-gray-400">
        <span>Вопрос {currentIdx + 1} из {game.items.length}</span>
        <div className="flex gap-1">
          {game.items.map((_, idx) => (
            <div key={idx} className={`w-2 h-2 rounded-full ${idx <= currentIdx ? 'bg-amber-400' : 'bg-gray-600'}`} />
          ))}
        </div>
      </div>
      <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
        <p className="text-white text-lg mb-4">{currentItem.sentence}</p>
        <p className="text-gray-400 text-xs italic mb-3">💡 Подсказка: {currentItem.hint}</p>
        <div className="grid grid-cols-1 gap-2">
          {currentItem.options.map(option => (
            <button
              key={option}
              onClick={() => handleAnswer(option)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                answers[currentItem.id] === option
                  ? 'border-amber-400 bg-amber-900/30'
                  : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
              }`}
            >
              <span className="text-gray-200">{option}</span>
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={handleNext}
        disabled={!answers[currentItem.id]}
        className={`w-full font-bold py-3 px-6 rounded-lg transition-all ${
          !answers[currentItem.id]
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-amber-600 hover:bg-amber-500 text-white'
        }`}
      >
        {currentIdx < game.items.length - 1 ? 'Следующий вопрос →' : '✓ Проверить все ответы'}
      </button>
    </div>
  );
}

// === ВЕРНО/НЕВЕРНО ===
function TrueFalseMiniGame({ game, onComplete }: { game: TrueFalseGame; onComplete: (s: number, m: number) => void }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const currentItem = game.items[currentIdx];

  const handleAnswer = (answer: boolean) => {
    if (showExplanation) return;
    setAnswers(prev => ({ ...prev, [currentItem.id]: answer }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentIdx < game.items.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setShowExplanation(false);
    } else {
      let correct = 0;
      game.items.forEach(item => {
        if (answers[item.id] === item.isTrue) correct++;
      });
      setCorrectCount(correct);
      setChecked(true);
    }
  };

  const handleContinue = () => {
    onComplete(correctCount, game.items.length);
  };

  if (checked) {
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          {game.items.map(item => {
            const userAnswer = answers[item.id];
            const isCorrect = userAnswer === item.isTrue;
            return (
              <div key={item.id} className={`p-3 rounded-lg border ${
                isCorrect ? 'border-green-500 bg-green-900/20' : 'border-red-500 bg-red-900/20'
              }`}>
                <p className="text-gray-200 text-sm">{item.statement}</p>
                <p className={`text-xs mt-1 font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                  {isCorrect ? '✓ Верно' : '✗ Неверно'} — правильный ответ: {item.isTrue ? 'Верно' : 'Неверно'}
                </p>
              </div>
            );
          })}
        </div>
        <p className={`text-sm ${correctCount === game.items.length ? 'text-green-400' : 'text-amber-400'}`}>
          Правильных: {correctCount} из {game.items.length}
        </p>
        <p className="text-gray-300 text-sm">
          {correctCount === game.items.length ? game.successFeedback : game.failFeedback}
        </p>
        <button
          onClick={handleContinue}
          className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-6 rounded-lg transition-all"
        >
          Продолжить →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-300 text-sm">{game.description}</p>
      <div className="flex justify-between text-xs text-gray-400">
        <span>Утверждение {currentIdx + 1} из {game.items.length}</span>
        <div className="flex gap-1">
          {game.items.map((_, idx) => (
            <div key={idx} className={`w-2 h-2 rounded-full ${idx <= currentIdx ? 'bg-amber-400' : 'bg-gray-600'}`} />
          ))}
        </div>
      </div>
      <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
        <p className="text-white text-lg mb-4">{currentItem.statement}</p>
        {showExplanation && (
          <div className={`p-3 rounded-lg mb-4 ${
            answers[currentItem.id] === currentItem.isTrue 
              ? 'bg-green-900/30 border border-green-700' 
              : 'bg-red-900/30 border border-red-700'
          }`}>
            <p className="text-sm text-gray-200">{currentItem.explanation}</p>
          </div>
        )}
        {!showExplanation && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleAnswer(true)}
              className="p-4 rounded-lg border border-gray-600 bg-gray-700/50 hover:border-green-500 hover:bg-green-900/20 transition-all"
            >
              <span className="text-2xl">✅</span>
              <p className="text-gray-200 mt-1 font-medium">Верно</p>
            </button>
            <button
              onClick={() => handleAnswer(false)}
              className="p-4 rounded-lg border border-gray-600 bg-gray-700/50 hover:border-red-500 hover:bg-red-900/20 transition-all"
            >
              <span className="text-2xl">❌</span>
              <p className="text-gray-200 mt-1 font-medium">Неверно</p>
            </button>
          </div>
        )}
        {showExplanation && (
          <button
            onClick={handleNext}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-6 rounded-lg transition-all mt-3"
          >
            {currentIdx < game.items.length - 1 ? 'Следующее утверждение →' : '✓ Завершить'}
          </button>
        )}
      </div>
    </div>
  );
}
