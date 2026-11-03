import type { Question } from '../types';
import { ch1aQuestions } from './ch1-a';
import { ch1bQuestions } from './ch1-b';
import { ch1cQuestions } from './ch1-c';
import { ch2Questions } from './ch2';
import { ch46Questions } from './ch4-6';
import { ch7Questions } from './ch7';
import { ch8Questions } from './ch8';

export const ALL_QUESTIONS: Question[] = [...ch1aQuestions, ...ch1bQuestions, ...ch1cQuestions, ...ch2Questions, ...ch46Questions, ...ch7Questions, ...ch8Questions];
