import type { Question } from '../types';
import { ch1aQuestions } from './ch1-a';
import { ch1bQuestions } from './ch1-b';
import { ch1cQuestions } from './ch1-c';

export const ALL_QUESTIONS: Question[] = [...ch1aQuestions, ...ch1bQuestions, ...ch1cQuestions];
