import type { Lesson } from '../types';
import { ch1a } from './ch1-a';
import { ch1b } from './ch1-b';
import { ch2 } from './ch2';
import { ch4, ch6 } from './ch4-6';
import { ch7 } from './ch7';
import { ch8 } from './ch8';

export const AUTHORED_LESSONS: Lesson[] = [...ch1a, ...ch1b, ...ch2, ...ch4, ...ch6, ...ch7, ...ch8];
