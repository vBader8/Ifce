import { act, fireEvent, render, screen } from '@testing-library/react';
import { QuizRunner, type QuizResult } from '../src/components/quiz/QuizRunner';
import { questionsFor } from '../src/content';

describe('QuizRunner timer', () => {
  afterEach(() => vi.useRealTimers());

  it('auto-submits at time-out using the answers given so far', () => {
    vi.useFakeTimers();
    const qs = questionsFor('c1-l1', 'mcq').slice(0, 3);
    let result: QuizResult | null = null;
    render(<QuizRunner title="t" questions={qs} mode="assess" seed={1} durationSec={5} onFinish={(r) => (result = r)} onExit={() => {}} />);
    // answer the first question correctly
    const shown = screen.getByText((_, el) => el?.id === 'qstem').textContent!;
    const q = qs.find((x) => x.stem === shown)!;
    fireEvent.click(screen.getByRole('radio', { name: new RegExp(q.options[q.answer].slice(0, 12)) }));
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(result).not.toBeNull();
    expect(result!.records.find((r) => r.qid === q.id)!.correct).toBe(true);
    expect(result!.correct).toBe(1);
  });

  it('asks for confirmation before exiting with answers', () => {
    const exit = vi.fn();
    const qs = questionsFor('c1-l1', 'mcq').slice(0, 2);
    render(<QuizRunner title="t" questions={qs} mode="assess" seed={1} onFinish={() => {}} onExit={exit} />);
    fireEvent.click(screen.getAllByRole('radio').filter((r) => r.classList.contains('opt'))[0]);
    fireEvent.click(screen.getByRole('button', { name: 'خروج' }));
    expect(exit).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'الخروج من الاختبار' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'خروج دون حفظ' }));
    expect(exit).toHaveBeenCalled();
  });
});
