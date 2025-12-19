// Variation generation utility for training sessions
// Generates random creative variations for techniques

export type VariationType = 'stance' | 'speed' | 'focus' | 'repetition';

export interface Variation {
  type: VariationType | null;
  text: string | null;
}

// Variation text pools for each type
const VARIATION_POOL: Record<VariationType, string[]> = {
  stance: [
    'in left stance',
    'in right stance',
    'on the left side',
    'on the right side',
  ],
  speed: [
    'in slow motion',
    'at double speed',
    'with deliberate pauses',
    'at a comfortable pace',
  ],
  focus: [
    'Focus on power',
    'Focus on precise hand positioning',
    'Focus on footwork',
    'Focus on breathing',
  ],
  repetition: [
    '10 times',
    '5 times on each side',
    '3 times, slowly',
    'Until muscle memory kicks in',
  ],
};

/**
 * Generate a random variation for a technique
 * 33% chance of no variation, 67% chance of random variation
 */
export function generateRandomVariation(): Variation {
  // 33% chance: no variation
  if (Math.random() < 0.33) {
    return { type: null, text: null };
  }

  // Pick random variation type
  const types: VariationType[] = ['stance', 'speed', 'focus', 'repetition'];
  const type = types[Math.floor(Math.random() * types.length)];

  // Pick random text from type pool
  const pool = VARIATION_POOL[type];
  const text = pool[Math.floor(Math.random() * pool.length)];

  return { type, text };
}
