import { GameMode } from './types';
import { getModeConfig } from './modes';

/**
 * Calculate cumulative wait time for N reveals
 * Uses triangular progression: 5s, 5+7=12s, 12+9=21s, 21+11=32s, etc.
 * Each subsequent hint requires waiting longer than the previous gap.
 */
function getCumulativeRevealDelay(revealsUsed: number, baseDelay: number): number {
  let total = 0;
  for (let i = 0; i < revealsUsed; i++) {
    // Gap increases by 2s each time: 5, 7, 9, 11, ...
    total += baseDelay + (i * 2);
  }
  return total;
}

/**
 * Calculate when the next reveal becomes available
 * Hints are staggered with increasing gaps to prevent spam.
 */
export function getNextRevealTime(
  revealsUsed: number,
  gameStartTime: number,
  mode: GameMode
): number {
  const config = getModeConfig(mode);
  const baseDelay = config.revealDelaySeconds;

  // Calculate cumulative time for (revealsUsed + 1) reveals
  const nextRevealSeconds = getCumulativeRevealDelay(revealsUsed + 1, baseDelay);
  return gameStartTime + (nextRevealSeconds * 1000);
}

/**
 * Check if a reveal is currently available
 */
export function canRevealNext(
  revealsUsed: number,
  currentTime: number,
  gameStartTime: number,
  mode: GameMode
): boolean {
  const nextRevealTime = getNextRevealTime(revealsUsed, gameStartTime, mode);
  return currentTime >= nextRevealTime;
}

/**
 * Get seconds remaining until next reveal is available
 */
export function getSecondsUntilNextReveal(
  revealsUsed: number,
  currentTime: number,
  gameStartTime: number,
  mode: GameMode
): number {
  const nextRevealTime = getNextRevealTime(revealsUsed, gameStartTime, mode);
  const msRemaining = Math.max(0, nextRevealTime - currentTime);
  return Math.ceil(msRemaining / 1000);
}

/**
 * Get the time penalty for using reveals
 * Escalating penalty: 5s, 5+7=12s, 12+10=22s, 22+13=35s, etc.
 * Each additional hint costs more than the previous one.
 */
export function getRevealPenalty(revealsUsed: number, mode: GameMode): number {
  const config = getModeConfig(mode);
  const basePenalty = config.revealPenaltySeconds;

  let total = 0;
  for (let i = 0; i < revealsUsed; i++) {
    // Penalty increases by 3s each time: 6, 9, 12, 15, ...
    total += basePenalty + (i * 3);
  }
  return total;
}

/**
 * Reveal the next letter in the answer
 * Returns the index of the revealed letter
 */
export function revealNextLetter(
  answer: string,
  revealedIndices: number[]
): number {
  // Find the first unrevealed letter from left to right
  for (let i = 0; i < answer.length; i++) {
    if (!revealedIndices.includes(i)) {
      return i;
    }
  }
  return -1; // All letters revealed
}

/**
 * Build display string with revealed letters locked in place
 */
export function buildDisplayWithReveals(
  answer: string,
  revealedIndices: number[],
  userInput: string
): string {
  const result: string[] = [];
  let inputIndex = 0;
  
  for (let i = 0; i < answer.length; i++) {
    if (revealedIndices.includes(i)) {
      // Locked revealed letter
      result.push(answer[i]);
    } else {
      // User-typed letter or placeholder
      if (inputIndex < userInput.length) {
        result.push(userInput[inputIndex]);
        inputIndex++;
      } else {
        result.push('_');
      }
    }
  }
  
  return result.join('');
}

/**
 * Validate user input with revealed letters
 * Returns true if input matches non-revealed positions
 */
export function validateInputWithReveals(
  answer: string,
  revealedIndices: number[],
  userInput: string
): boolean {
  let inputIndex = 0;
  
  for (let i = 0; i < answer.length; i++) {
    if (revealedIndices.includes(i)) {
      // Skip revealed positions
      continue;
    }
    
    if (inputIndex >= userInput.length) {
      // Not enough input yet
      return false;
    }
    
    if (userInput[inputIndex].toLowerCase() !== answer[i].toLowerCase()) {
      // Wrong letter
      return false;
    }
    
    inputIndex++;
  }
  
  // Check if we used all input (no extra characters)
  return inputIndex === userInput.length;
}

/**
 * Check if the word is completely solved
 */
export function isWordSolved(
  answer: string,
  revealedIndices: number[],
  userInput: string
): boolean {
  const requiredLength = answer.length - revealedIndices.length;
  
  if (userInput.length !== requiredLength) {
    return false;
  }
  
  return validateInputWithReveals(answer, revealedIndices, userInput);
}

/**
 * Calculate effective solve time including penalties
 */
export function calculateEffectiveTime(
  actualTime: number,
  revealsUsed: number,
  mode: GameMode
): number {
  const penalty = getRevealPenalty(revealsUsed, mode);
  return actualTime + penalty;
}