import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { AppProvider } from '../src/app/store';
import { App } from '../src/app/App';
import { initialState, STORAGE_KEY, loadState } from '../src/engine/progress';
import { AverageLab } from '../src/labs/PrincipleLabs';
import { PoolingLab } from '../src/labs/RiskLabs';
import { questionsFor } from '../src/content';
import { LABS } from '../src/labs/registry';

function reducedState() {
  const s = initialState();
  s.settings.motion = 'reduced'; // instant page turns in tests
  return s;
}

function renderApp(hash: string, state = reducedState()) {
  window.location.hash = hash;
  return render(
    <AppProvider initial={state}>
      <App />
    </AppProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.dataset.motion = 'reduced'; // instant page turns in tests
});

describe('navigation', () => {
  it('renders the home page and main navigation', () => {
    renderApp('#/');
    expect(screen.getByRole('heading', { name: 'أكاديمية أساسيات التأمين التفاعلية' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'التنقل الرئيسي' })).toBeInTheDocument();
  });

  it('opens the book and turns pages with buttons and the keyboard (RTL arrows)', () => {
    renderApp('#/book/c1-l1');
    expect(screen.getByRole('heading', { level: 2, name: 'دور الخطر في التأمين' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'الصفحة التالية' }));
    expect(screen.getByRole('heading', { name: 'الشرح' })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByRole('heading', { name: 'أمثلة عملية متدرجة' })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByRole('heading', { name: 'الشرح' })).toBeInTheDocument();
  });

  it('records reading progress as pages are viewed', () => {
    renderApp('#/book/c1-l1');
    fireEvent.click(screen.getByRole('button', { name: 'الصفحة التالية' }));
    const saved = loadState();
    expect(saved.lessons['c1-l1'].viewed).toEqual(expect.arrayContaining(['intro', 'explain']));
  });

  it('keeps the second lesson locked until mastery is confirmed', () => {
    renderApp('#/book/c1-l2');
    expect(screen.getByText('🔒 هذا الدرس مقفل')).toBeInTheDocument();
  });

  it('shows planned lessons as not ready', () => {
    renderApp('#/book/c11-l3');
    expect(screen.getByText(/قيد الإعداد/)).toBeInTheDocument();
  });

  it('"اشرح لي ببساطة" and "تعمّق أكثر" reveal extra layers', () => {
    renderApp('#/book/c1-l1?s=1');
    fireEvent.click(screen.getByRole('button', { name: /اشرح لي ببساطة/ }));
    expect(screen.getByRole('complementary', { name: 'شرح مبسط' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /تعمّق أكثر/ }));
    expect(screen.getByRole('complementary', { name: 'تعمق' })).toBeInTheDocument();
  });
});

describe('labs', () => {
  it('average lab recalculates live and resets', () => {
    render(<AverageLab />);
    const payout = () => screen.getByText('التعويض المستحق').nextElementSibling!.textContent;
    expect(payout()).toContain('120,000');
    fireEvent.click(screen.getByRole('radio', { name: 'لا' }));
    expect(payout()).toContain('200,000');
    fireEvent.click(screen.getByRole('button', { name: /إعادة التجربة/ }));
    expect(payout()).toContain('120,000');
  });

  it('predict-then-reveal calls onComplete', () => {
    const done = vi.fn();
    render(<PoolingLab onComplete={done} />);
    const group = screen.getByRole('radiogroup', { name: 'توقعك' });
    fireEvent.click(within(group).getByRole('radio', { name: 'ينخفض بوضوح' }));
    fireEvent.click(screen.getByRole('button', { name: 'اكشف الإجابة' }));
    expect(done).toHaveBeenCalled();
    expect(screen.getAllByRole('status').some((s) => s.textContent?.includes('توقع صحيح'))).toBe(true);
  });

  it('number inputs clamp to their range', () => {
    render(<AverageLab />);
    const input = screen.getAllByRole('spinbutton')[0] as HTMLInputElement;
    fireEvent.change(input, { target: { value: '99999999' } });
    expect(Number(input.value)).toBeLessThanOrEqual(3000000);
  });
});

describe('quiz flow and persistence', () => {
  it('learn mode gives feedback per question and saves the attempt', async () => {
    renderApp('#/quiz/c1-l1/mcq?mode=learn');
    fireEvent.click(screen.getByRole('button', { name: 'ابدأ' }));
    const total = questionsFor('c1-l1', 'mcq').length;
    for (let i = 0; i < total; i++) {
      const opts = screen.getAllByRole('radio').filter((r) => r.classList.contains('opt'));
      fireEvent.click(opts[0]);
      expect(screen.getByRole('status')).toBeInTheDocument();
      if (i < total - 1) fireEvent.click(screen.getByRole('button', { name: /التالي/ }));
    }
    fireEvent.click(screen.getByRole('button', { name: 'إنهاء وتسليم' }));
    await act(async () => {});
    expect(screen.getByText(/نتيجة:/)).toBeInTheDocument();
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(saved.lessons['c1-l1'].attempts).toHaveLength(1);
    expect(saved.lessons['c1-l1'].attempts[0].full).toBe(true);
  });

  it('assess mode hides answers and warns about unanswered questions before submitting', () => {
    renderApp('#/quiz/c1-l1/scenario?mode=assess');
    fireEvent.click(screen.getByRole('button', { name: 'ابدأ' }));
    const opts = screen.getAllByRole('radio').filter((r) => r.classList.contains('opt'));
    fireEvent.click(opts[1]);
    expect(screen.queryByRole('status')).toBeNull(); // no feedback in assessment mode
    fireEvent.click(screen.getByRole('button', { name: 'إنهاء وتسليم' }));
    const dialog = screen.getByRole('dialog', { name: 'تأكيد التسليم' });
    expect(within(dialog).getByText(/دون إجابة/)).toBeInTheDocument();
  });
});

describe('every lab resets to its defaults', () => {
  it.each(Object.keys(LABS))('%s', (id) => {
    const C = LABS[id].Component;
    const { container, unmount } = render(<C />);
    const results = () => container.querySelector('.lab-results')!.textContent;
    const controls = () => [...container.querySelectorAll<HTMLInputElement>('.lab-controls input')].map((i) => (i.type === 'checkbox' ? String(i.checked) : i.value)).join('|');
    const initialResults = results();
    const initialControls = controls();
    // change something: a number field if any, otherwise click the first choice chip / checkbox
    const num = container.querySelector<HTMLInputElement>('.lab-controls input[type=number]');
    if (num) fireEvent.change(num, { target: { value: String(Number(num.min) + Number(num.step || 1)) } });
    else {
      const chip = container.querySelector<HTMLElement>('.lab-controls .sort-choices button, .lab-controls input[type=checkbox], .lab-controls .regnode:not(.on), .lab-controls .pc-event');
      chip?.click();
    }
    fireEvent.click(screen.getByRole('button', { name: /إعادة التجربة/ }));
    expect(controls()).toBe(initialControls);
    expect(results()).toBe(initialResults);
    expect(screen.getAllByRole('status').some((s) => s.textContent?.includes('أُعيدت القيم الافتراضية'))).toBe(true);
    unmount();
  });
});

describe('mastery gate', () => {
  it('unlocks the next lesson only after mastery AND confirmation', async () => {
    const s = reducedState();
    s.lessons['c1-l1'] = { viewed: [], labsDone: [], best: { mcq: 90, scenario: 100 }, attempts: [] };
    renderApp('#/book/c1-l1?s=4', s);
    fireEvent.click(screen.getByRole('button', { name: /أتقنت الدرس/ }));
    const dialog = screen.getByRole('dialog', { name: 'تأكيد الانتقال' });
    fireEvent.click(within(dialog).getByRole('button', { name: /افتح الدرس 1.2/ }));
    expect(await screen.findByRole('heading', { level: 2, name: 'فئات الخطر' })).toBeInTheDocument();
    expect(screen.queryByText('🔒 هذا الدرس مقفل')).toBeNull();
    expect(loadState().lessons['c1-l1'].advanceConfirmed).toBe(true);
  });

  it('does not offer advancing below the threshold', () => {
    const s = reducedState();
    s.lessons['c1-l1'] = { viewed: [], labsDone: [], best: { mcq: 100, scenario: 80 }, attempts: [] };
    renderApp('#/book/c1-l1?s=4', s);
    expect(screen.queryByRole('button', { name: /أتقنت الدرس/ })).toBeNull();
    expect(screen.getByText('لم يتحقق شرط الإتقان بعد.')).toBeInTheDocument();
  });
});
