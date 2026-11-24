import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Check, AlertTriangle, Info } from 'lucide-react';
import { SiteFooter, SiteHeader } from './SiteHeader';
import { COURSES } from '@/content/registry';
import { usePlacement, savePlacementResult } from '@/lib/progress';
import './start.css';

/* ─── Prerequisite checklist ──────────────────────────────────────── */
const PREREQS = [
  {
    id: 'html',
    title: 'Basic HTML & CSS',
    check: 'Can you write a simple webpage with headings, links, and a styled button?',
    hint: 'If not, spend 2–3 hours on the free MDN "Learn HTML" and "Learn CSS" tracks first.',
  },
  {
    id: 'js',
    title: 'JavaScript basics',
    check: 'Can you write a function, loop over an array, and use console.log to debug?',
    hint: 'If not, work through "JavaScript Basics" on The Odin Project or javascript.info first.',
  },
  {
    id: 'terminal',
    title: 'Using the terminal',
    check: 'Can you cd into a folder, run a command, and understand what an error message is?',
    hint: 'Spend 30 minutes on "The Command Line Crash Course" by Learn Code the Hard Way.',
  },
  {
    id: 'tools',
    title: 'Node, VS Code & Git installed',
    check: 'Do you have Node 18+, VS Code, and Git on your machine?',
    hint: 'Install Node from nodejs.org, VS Code from code.visualstudio.com, and Git from git-scm.com.',
  },
];

/* ─── Placement quiz ──────────────────────────────────────────────── */
interface PlacementQ {
  id: string;
  q: string;
  options: string[];
  answer: number;
  part: number; /** which part this question unlocks up to */
}

const PLACEMENT_QUESTIONS: PlacementQ[] = [
  {
    id: 'q1',
    q: 'What does HTTP stand for and what is its purpose?',
    options: [
      'HyperText Transfer Protocol — the language browsers and servers use to exchange requests and responses',
      'High Transfer Traffic Protocol — a way to send data at high speed',
      'HyperText Tracking Protocol — used to track user activity on websites',
      'Host Transfer Tunnel Protocol — connects databases to servers',
    ],
    answer: 0,
    part: 1,
  },
  {
    id: 'q2',
    q: 'What is a closure in JavaScript?',
    options: [
      'A syntax that closes a function block with a curly brace',
      'A function that remembers the variables from its outer scope even after that scope has finished',
      'A built-in method that closes a file or connection',
      'An error that occurs when a function calls itself infinitely',
    ],
    answer: 1,
    part: 2,
  },
  {
    id: 'q3',
    q: 'In React, what triggers a component to re-render?',
    options: [
      'A change in the DOM',
      'A change to a state value via its setter function',
      'Any JavaScript variable change inside the component',
      'A network request completing in the background',
    ],
    answer: 1,
    part: 3,
  },
  {
    id: 'q4',
    q: 'What is middleware in Express?',
    options: [
      'A database that sits between the server and MongoDB',
      'A function that runs between receiving a request and sending a response, calling next() to continue',
      'The HTML templating layer that renders views server-side',
      'A caching layer installed between the browser and Express',
    ],
    answer: 1,
    part: 4,
  },
  {
    id: 'q5',
    q: 'In MongoDB, what is the difference between embedding and referencing?',
    options: [
      'Embedding stores data in RAM; referencing stores it on disk',
      'Embedding puts related data in a nested sub-document; referencing stores it in another collection and links via an ID',
      'Embedding is for strings; referencing is for numbers',
      'There is no difference — MongoDB uses both terms for the same concept',
    ],
    answer: 1,
    part: 5,
  },
  {
    id: 'q6',
    q: 'What is CORS and why does the browser enforce it?',
    options: [
      'A caching strategy — browsers store responses to avoid duplicate requests',
      'A protocol that encrypts data between browser and server',
      'A browser security rule that blocks a page from reading responses from a different origin unless the server allows it',
      'A React library for handling cross-component state',
    ],
    answer: 2,
    part: 6,
  },
  {
    id: 'q7',
    q: 'What is the difference between authentication and authorization?',
    options: [
      'They are the same — both verify who you are',
      'Authentication proves who you are (login); authorization decides what you are allowed to do',
      'Authentication is for APIs; authorization is for web pages',
      'Authentication encrypts data; authorization decrypts it',
    ],
    answer: 1,
    part: 7,
  },
  {
    id: 'q8',
    q: 'What does a CI/CD pipeline do?',
    options: [
      'It compiles TypeScript into JavaScript on your local machine',
      'It manages database migrations during deployment',
      'It automatically builds, tests, and deploys your code when you push changes',
      'It monitors your production server for downtime',
    ],
    answer: 2,
    part: 8,
  },
  {
    id: 'q9',
    q: 'What is the purpose of a database index?',
    options: [
      'To back up documents automatically every hour',
      'To encrypt fields that contain sensitive information',
      'To create a sorted lookup structure so queries can find documents without scanning the whole collection',
      'To enforce uniqueness across all documents in a collection',
    ],
    answer: 2,
    part: 5,
  },
  {
    id: 'q10',
    q: 'What problem does rate limiting solve?',
    options: [
      'It prevents one client from sending too many requests in a short time, protecting the server from overload or abuse',
      'It limits the size of response bodies to avoid bandwidth costs',
      'It caps the number of database documents to prevent storage overflow',
      'It ensures API responses arrive within a maximum latency threshold',
    ],
    answer: 0,
    part: 9,
  },
];

function prereqScore(answers: Record<string, boolean>): number {
  return Object.values(answers).filter(Boolean).length;
}

function placementScore(answers: Record<string, number>): { score: number; startPart: number } {
  let correct = 0;
  let highestPartPassed = 0;
  for (const q of PLACEMENT_QUESTIONS) {
    if (answers[q.id] === q.answer) {
      correct++;
      highestPartPassed = Math.max(highestPartPassed, q.part);
    }
  }
  return { score: correct, startPart: highestPartPassed };
}

/* ─── Component ───────────────────────────────────────────────────── */
export function StartPage() {
  const course = COURSES[0];
  const placement = usePlacement();
  const [phase, setPhase] = useState<'prereq' | 'quiz' | 'result'>(
    placement ? 'result' : 'prereq',
  );
  const [prereqs, setPrereqs] = useState<Record<string, boolean>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [qi, setQi] = useState(0); // current question index

  useEffect(() => {
    document.title = 'Start Here — Unpacked';
  }, []);

  /* prereq phase */
  function togglePrereq(id: string) {
    setPrereqs((p) => ({ ...p, [id]: !p[id] }));
  }
  const prereqReady = prereqScore(prereqs) === PREREQS.length;

  /* quiz phase */
  const currentQ = PLACEMENT_QUESTIONS[qi];
  function selectAnswer(qid: string, idx: number) {
    if (quizAnswers[qid] !== undefined) return;
    setQuizAnswers((a) => ({ ...a, [qid]: idx }));
    setRevealed((r) => ({ ...r, [qid]: true }));
  }
  function nextQ() {
    if (qi < PLACEMENT_QUESTIONS.length - 1) setQi((n) => n + 1);
    else finishQuiz();
  }
  function finishQuiz() {
    const { score, startPart } = placementScore(quizAnswers);
    savePlacementResult({ score, total: PLACEMENT_QUESTIONS.length, startPart, ts: Date.now() });
    setPhase('result');
  }
  function skipQuiz() {
    savePlacementResult({ score: 0, total: PLACEMENT_QUESTIONS.length, startPart: 0, ts: Date.now() });
    setPhase('result');
  }

  /* result phase */
  const result = usePlacement();
  const startPart = result?.startPart ?? 0;
  const firstLesson = course?.parts[startPart]?.lessons[0];

  return (
    <>
      <SiteHeader />
      <main className="start wrap">
        {phase === 'prereq' && (
          <section className="start-section">
            <span className="eyebrow">Before you begin</span>
            <h1 className="display">Start Here</h1>
            <p className="start-lede">
              This course assumes a small handful of things. Check each one — it takes about 5 minutes.
              If you're missing something, the hints point you to the fastest fix.
            </p>
            <div className="prereq-list">
              {PREREQS.map((p) => (
                <label key={p.id} className="prereq-item" data-checked={prereqs[p.id] || undefined}>
                  <input
                    type="checkbox"
                    checked={!!prereqs[p.id]}
                    onChange={() => togglePrereq(p.id)}
                    aria-label={p.title}
                  />
                  <span className="prereq-check">{prereqs[p.id] && <Check size={18} strokeWidth={3} />}</span>
                  <div className="prereq-body">
                    <strong>{p.title}</strong>
                    <p className="prereq-q">{p.check}</p>
                    {!prereqs[p.id] && (
                      <p className="prereq-hint muted">
                        <Info size={12} /> {p.hint}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
            {!prereqReady && (
              <p className="start-warn">
                <AlertTriangle size={14} /> Check all boxes when you're ready — or tick them anyway to explore the course first.
              </p>
            )}
            <div className="start-actions">
              <button
                className="btn btn--primary btn--lg"
                onClick={() => setPhase('quiz')}
              >
                {prereqReady ? "I'm ready — take the placement quiz" : 'Continue anyway'} <ArrowRight size={16} />
              </button>
              <button className="btn btn--lg" onClick={skipQuiz}>
                Skip quiz — start from Part 1
              </button>
            </div>
          </section>
        )}

        {phase === 'quiz' && currentQ && (
          <section className="start-section">
            <span className="eyebrow">Placement quiz · {qi + 1} of {PLACEMENT_QUESTIONS.length}</span>
            <h1 className="display">Where should you start?</h1>
            <p className="start-lede">
              This short quiz places you in the right part of the course. No grade, no judgment — honest answers give you the best starting point.
            </p>
            <div className="quiz-progress-bar">
              <div className="quiz-progress-fill" style={{ width: `${((qi) / PLACEMENT_QUESTIONS.length) * 100}%` }} />
            </div>
            <div className="quiz-card">
              <p className="quiz-q">{currentQ.q}</p>
              <ul className="quiz-options">
                {currentQ.options.map((opt, i) => {
                  const selected = quizAnswers[currentQ.id] === i;
                  const isRevealed = revealed[currentQ.id];
                  const correct = i === currentQ.answer;
                  return (
                    <li key={i}>
                      <button
                        className="quiz-option"
                        data-state={isRevealed ? (correct ? 'correct' : selected ? 'wrong' : 'dim') : selected ? 'selected' : undefined}
                        onClick={() => selectAnswer(currentQ.id, i)}
                        disabled={isRevealed}
                      >
                        <span className="quiz-opt-letter">{String.fromCharCode(65 + i)}</span>
                        <span>{opt}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {revealed[currentQ.id] && (
                <div className="quiz-feedback" data-correct={quizAnswers[currentQ.id] === currentQ.answer || undefined}>
                  {quizAnswers[currentQ.id] === currentQ.answer ? (
                    <><Check size={14} /> Correct!</>
                  ) : (
                    <><AlertTriangle size={14} /> The correct answer is <strong>{String.fromCharCode(65 + currentQ.answer)}</strong>.</>
                  )}
                </div>
              )}
              <div className="quiz-nav">
                {revealed[currentQ.id] ? (
                  <button className="btn btn--primary" onClick={nextQ}>
                    {qi < PLACEMENT_QUESTIONS.length - 1 ? 'Next question' : 'See my results'} <ArrowRight size={15} />
                  </button>
                ) : quizAnswers[currentQ.id] === undefined ? (
                  <button className="btn btn--ghost" onClick={nextQ}>Skip this question</button>
                ) : null}
                <button className="btn btn--ghost" onClick={skipQuiz} style={{ marginLeft: 'auto' }}>Skip quiz</button>
              </div>
            </div>
          </section>
        )}

        {phase === 'result' && result && course && (
          <section className="start-section">
            <span className="eyebrow">Your placement</span>
            <h1 className="display">
              {result.startPart === 0
                ? 'Start from the beginning'
                : result.startPart >= 8
                ? 'You know a lot already!'
                : `Jump to Part ${result.startPart + 1}`}
            </h1>
            {result.score > 0 && result.total > 0 && (
              <p className="start-lede">
                You answered <strong>{result.score} of {result.total}</strong> questions correctly.{' '}
                {result.startPart > 0
                  ? `The earlier lessons are marked skippable — but you can always go back.`
                  : `Start with Part 1 to build a solid foundation.`}
              </p>
            )}
            <div className="placement-parts">
              {course.parts.map((part, i) => (
                <div
                  key={part.id}
                  className="placement-part"
                  data-state={i < startPart ? 'skip' : i === startPart ? 'start' : 'later'}
                  data-tone={part.tone}
                >
                  <span className="placement-num mono">{part.num}</span>
                  <div>
                    <strong>{part.title}</strong>
                    <span className="muted placement-status">
                      {i < startPart ? '✓ Skippable' : i === startPart ? '← Start here' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="start-actions">
              {firstLesson && (
                <Link
                  className="btn btn--primary btn--lg"
                  to={`/${course.id}/${firstLesson.id}`}
                >
                  Go to Part {startPart + 1}: {course.parts[startPart]?.title} <ArrowRight size={16} />
                </Link>
              )}
              <Link className="btn btn--lg" to={`/${course.id}/roadmap`}>
                View full roadmap
              </Link>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
