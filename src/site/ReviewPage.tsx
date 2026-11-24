import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Check, RotateCcw, Brain } from 'lucide-react';
import { SiteFooter, SiteHeader } from './SiteHeader';
import { recordReview, addReviewCard } from '@/lib/progress';
import './review.css';

const DEFAULT_REVIEW_PROMPTS = [
  {
    id: 'rev-closures',
    lessonId: 'closures',
    prompt: 'What is a closure in JavaScript, and what determines which variables it retains in memory?',
    answer: 'A closure is a function combined with references to its lexical environment. It keeps alive any variable from its enclosing scope that it references, even after that outer function finishes running.',
  },
  {
    id: 'rev-event-loop',
    lessonId: 'event-loop',
    prompt: 'In what order do synchronous code, Promise microtasks, and setTimeout timers execute?',
    answer: '1. All synchronous code on the call stack runs to completion.\n2. All microtasks (Promise.then callbacks) drain immediately.\n3. The next single macrotask (setTimeout, I/O) executes.',
  },
  {
    id: 'rev-values-refs',
    lessonId: 'values-references',
    prompt: 'Why does mutating an object directly inside a React component prevent a re-render?',
    answer: 'React uses Object.is shallow equality on state. If you mutate properties of an existing object, the reference address remains unchanged, so React concludes no update is necessary and skips re-rendering.',
  },
  {
    id: 'rev-cors',
    lessonId: 'cors',
    prompt: 'Why does the browser send an OPTIONS preflight request before a POST with application/json?',
    answer: 'application/json is not a "simple" content type (like text/plain or multipart/form-data). The browser sends an OPTIONS preflight to verify that the target server explicitly permits cross-origin JSON posts via CORS headers.',
  },
  {
    id: 'rev-indexes',
    lessonId: 'indexes',
    prompt: 'Why is an IXSCAN logarithmic while a COLLSCAN is linear in MongoDB?',
    answer: 'A COLLSCAN must inspect all N documents in a collection (O(N)). An IXSCAN walks a balanced B-tree index in O(log N) operations to reach only the matching document IDs.',
  },
];

export function ReviewPage() {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  useEffect(() => {
    document.title = 'Spaced Review — Unpacked';
    // Seed default cards if empty
    DEFAULT_REVIEW_PROMPTS.forEach((p) => {
      addReviewCard({
        id: p.id,
        lessonId: p.lessonId,
        courseId: 'mern',
        prompt: p.prompt,
        dueAt: Date.now() - 1000,
        interval: 1,
      });
    });
  }, []);

  const currentCard = DEFAULT_REVIEW_PROMPTS[index % DEFAULT_REVIEW_PROMPTS.length];
  const totalCards = DEFAULT_REVIEW_PROMPTS.length;

  function handleGrade(pass: boolean) {
    if (currentCard) {
      recordReview(currentCard.id, pass ? 'pass' : 'fail');
      setReviewedCount((n) => n + 1);
      setRevealed(false);
      setIndex((n) => n + 1);
    }
  }

  const finished = index >= totalCards;

  return (
    <>
      <SiteHeader />
      <main className="review-page wrap">
        <div className="review-head">
          <span className="eyebrow">Retention & Recall</span>
          <h1 className="display">5-Minute Spaced Review</h1>
          <p className="muted review-lede">
            Spaced repetition locks concepts into long-term memory. Review cards resurface after 1, 3, 7, and 21 days based on your answers.
          </p>
        </div>

        {!finished ? (
          <div className="review-card-container">
            <div className="review-progress">
              <span className="eyebrow">Card {index + 1} of {totalCards}</span>
              <div className="review-progress-bar">
                <div className="review-progress-fill" style={{ width: `${((index) / totalCards) * 100}%` }} />
              </div>
            </div>

            <article className="review-flashcard">
              <div className="review-card-top">
                <Brain size={20} className="review-brain-icon" />
                <span className="pill">Part concept recall</span>
              </div>

              <h2 className="review-question">{currentCard.prompt}</h2>

              {revealed ? (
                <div className="review-answer-box">
                  <span className="eyebrow">Answer</span>
                  <pre className="review-answer-text">{currentCard.answer}</pre>
                </div>
              ) : (
                <button className="btn btn--lg btn--ghost review-reveal-btn" onClick={() => setRevealed(true)}>
                  Show answer
                </button>
              )}

              {revealed && (
                <div className="review-actions">
                  <button className="btn btn--lg" onClick={() => handleGrade(false)}>
                    <RotateCcw size={16} /> Need review (1 day)
                  </button>
                  <button className="btn btn--primary btn--lg" onClick={() => handleGrade(true)}>
                    <Check size={16} /> Got it (+interval)
                  </button>
                </div>
              )}
            </article>
          </div>
        ) : (
          <div className="review-finished">
            <div className="review-finish-badge">
              <Check size={28} />
            </div>
            <h2 className="display">Daily Review Complete!</h2>
            <p className="muted">
              You reviewed {reviewedCount || totalCards} concepts today. Your cards have been scheduled according to spaced repetition intervals.
            </p>
            <div style={{ display: 'flex', gap: '.75rem', marginTop: '1rem' }}>
              <Link to="/me" className="btn btn--primary">
                Return to Dashboard
              </Link>
              <button className="btn" onClick={() => { setIndex(0); setRevealed(false); }}>
                Review again
              </button>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
