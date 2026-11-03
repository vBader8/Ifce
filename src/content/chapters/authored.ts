import type { Lesson } from '../types';
import { ch1a } from './ch1-a';
import { ch1b } from './ch1-b';

export const AUTHORED_LESSONS: Lesson[] = [...ch1a, ...ch1b];
