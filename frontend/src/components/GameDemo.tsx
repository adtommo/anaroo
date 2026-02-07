import { useState, useEffect, useCallback } from 'react';

interface DemoState {
  scrambled: string;
  target: string;
  currentGuess: string;
  phase:
    | 'typing'
    | 'backspace'
    | 'shake'
    | 'clear'
    | 'success'
    | 'pause';
  usedIndexes: number[];
}

interface DemoStep {
  guess: string;
  delay: number;
  phase?: DemoState['phase'];
  clear?: boolean;
  success?: boolean;
  pause?: boolean;
}

const WORD = 'anaroo';
const SCRAMBLED = 'oraona';
const WORD_LENGTH = SCRAMBLED.length;

/* ---------------- utils ---------------- */
const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const shuffle = <T,>(arr: T[]): T[] =>
  [...arr].sort(() => Math.random() - 0.5);

/* --------- demo run generator ---------- */
function generateDemoRun(forceSuccess: boolean): DemoStep[] {
  const steps: DemoStep[] = [];
  let guess = '';

  const letters = shuffle(SCRAMBLED.split(''));
  const willReachFull = forceSuccess || Math.random() < 0.9;
  const targetLength = willReachFull ? WORD_LENGTH : rand(2, WORD_LENGTH - 1);

  // Build partial or full-length guess
  for (let i = 0; i < targetLength; i++) {
    guess += letters[i];
    steps.push({
      guess,
      delay: rand(200, 400),
      phase: 'typing',
    });

    // Backspace hesitation ≤5 letters
    if (guess.length >= 2 && guess.length <= 5 && Math.random() < 0.15) {
      const backspaces = Math.random() < 0.5 ? 1 : 2;
      for (let j = 0; j < backspaces && guess.length > 1; j++) {
        guess = guess.slice(0, -1);
        steps.push({
          guess,
          delay: rand(200, 300),
          phase: 'backspace',
        });
      }
    }
  }

  const isFullLength = guess.length === WORD_LENGTH;
  const isCorrect = guess === WORD;

  // Full length wrong guess - always shake
  if (isFullLength && !isCorrect) {
    steps.push({
      guess,
      delay: 400,
      phase: 'shake',
    });
    steps.push({
      guess: '',
      delay: 600,
      clear: true,
    });

    // If this was meant to be a success run, now type the correct word
    if (forceSuccess) {
      steps.push({
        guess: '',
        delay: 400,
        pause: true,
      });
      let successGuess = '';
      for (const char of WORD) {
        successGuess += char;
        steps.push({
          guess: successGuess,
          delay: rand(200, 380),
          phase: 'typing',
        });
      }
      steps.push({
        guess: WORD,
        delay: 400,
        success: true,
      });
      steps.push({
        guess: '',
        delay: 400,
        clear: true,
      });
    }

    steps.push({
      guess: '',
      delay: 400,
      pause: true,
    });
    return steps;
  }

  // Full length correct guess (lucky!)
  if (isFullLength && isCorrect) {
    steps.push({
      guess: WORD,
      delay: 400,
      success: true,
    });
    steps.push({
      guess: '',
      delay: 400,
      clear: true,
    });
    steps.push({
      guess: '',
      delay: 400,
      pause: true,
    });
    return steps;
  }

  // Partial run (<6 letters) → end by emptying row
  if (!isFullLength) {
    steps.push({
      guess: '',
      delay: 400,
      clear: true,
    });
    steps.push({
      guess: '',
      delay: 400,
      pause: true,
    });
    return steps;
  }

  return steps;
}

/* ---------------- component ---------------- */
export function GameDemo() {
  const [state, setState] = useState<DemoState>({
    scrambled: SCRAMBLED,
    target: WORD,
    currentGuess: '',
    phase: 'pause',
    usedIndexes: [],
  });

  const [sequence, setSequence] = useState<DemoStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [runsUntilSuccess, setRunsUntilSuccess] = useState(() => rand(1, 2));

  const getUsedIndexes = useCallback((guess: string): number[] => {
    const indexes: number[] = [];
    const scrambledArr = SCRAMBLED.split('');
    for (const char of guess) {
      const idx = scrambledArr.findIndex((c, i) => c === char && !indexes.includes(i));
      if (idx !== -1) indexes.push(idx);
    }
    return indexes;
  }, []);

  // Generate a new run
  useEffect(() => {
    if (sequence.length === 0) {
      setSequence(generateDemoRun(runsUntilSuccess === 1));
    }
  }, [sequence, runsUntilSuccess]);

  useEffect(() => {
    const step = sequence[stepIndex];
    if (!step) {
      // End-of-run reset: only reset sequence, stepIndex, and runsUntilSuccess
      const timeout = setTimeout(() => {
        setStepIndex(0);
        setSequence([]);
        setRunsUntilSuccess(prev => (prev === 1 ? 5 : prev - 1));
      }, 800);
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(() => {
      if (step.clear) {
        setState(prev => ({
          ...prev,
          currentGuess: '',
          phase: 'clear',
          usedIndexes: [],
        }));
        setStepIndex(i => i + 1);
        return;
      }

      if (step.success) {
        setState(prev => ({
          ...prev,
          currentGuess: step.guess,
          phase: 'success',
          usedIndexes: getUsedIndexes(step.guess),
        }));
        setTimeout(() => setStepIndex(i => i + 1), 1500);
        return;
      }

      if (step.pause) {
        setState(prev => ({
          ...prev,
          phase: 'pause',
        }));
        setStepIndex(i => i + 1);
        return;
      }

      setState(prev => ({
        ...prev,
        currentGuess: step.guess,
        phase: step.phase ?? 'typing',
        usedIndexes: getUsedIndexes(step.guess),
      }));

      if (step.phase === 'shake') {
        setTimeout(() => setStepIndex(i => i + 1), 500);
      } else {
        setStepIndex(i => i + 1);
      }
    }, step.delay);

    return () => clearTimeout(timeout);
  }, [sequence, stepIndex, getUsedIndexes]);

  const scrambledLetters = state.scrambled.split('');
  const guessLetters = state.currentGuess.split('');

  return (
    <div className="game-demo">
      {/* Guess row */}
      <div
        className={`demo-guess-row ${
          state.phase === 'shake' ? 'shake' : ''
        } ${state.phase === 'success' ? 'success' : ''}`}
      >
        {scrambledLetters.map((_, i) => (
          <div
            key={i}
            className={`demo-guess-slot ${guessLetters[i] ? 'filled' : ''}`}
          >
            {guessLetters[i] || ''}
          </div>
        ))}
      </div>

      {/* Scrambled letters */}
      <div className="demo-scrambled-row">
        {scrambledLetters.map((letter, i) => (
          <div
            key={i}
            className={`demo-letter ${
              state.usedIndexes.includes(i) ? 'used' : ''
            }`}
          >
            {letter}
          </div>
        ))}
      </div>
    </div>
  );
}
