import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Search, BookOpen } from 'lucide-react';
import { SiteFooter, SiteHeader } from './SiteHeader';
import { COMMON_ERRORS } from '@/content/courses/mern/commonErrors';
import './commonErrors.css';

export function CommonErrorsPage() {
  const [query, setQuery] = useState('');

  useEffect(() => {
    document.title = 'Common Errors Glossary — Unpacked';
  }, []);

  const filtered = COMMON_ERRORS.filter(
    (item) =>
      item.error.toLowerCase().includes(query.toLowerCase()) ||
      item.meaning.toLowerCase().includes(query.toLowerCase()) ||
      item.cause.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <SiteHeader />
      <main className="errors-page wrap">
        <div className="errors-head">
          <span className="eyebrow">Troubleshooting glossary</span>
          <h1 className="display">Common MERN Errors</h1>
          <p className="muted errors-lede">
            Every error message tells a story. Look up the error you are seeing to understand what really happened under the hood and jump straight to the lesson that explains it.
          </p>
          <div className="errors-search">
            <Search size={16} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search error message, symptom, or keyword..."
              aria-label="Search errors"
            />
          </div>
        </div>

        <div className="errors-list">
          {filtered.map((item) => (
            <article key={item.id} className="error-card">
              <div className="error-header">
                <span className="pill" data-tone={item.category === 'auth' ? 'auth' : item.category === 'mongo' ? 'data' : item.category === 'express' ? 'server' : 'client'}>
                  {item.category}
                </span>
                <Link to={`/mern/${item.lessonId}?s=${item.step}`} className="error-lesson-link">
                  <BookOpen size={13} /> Unpacked in lesson: step {item.step} <ArrowRight size={13} />
                </Link>
              </div>

              <pre className="error-message">{item.error}</pre>

              <div className="error-grid">
                <div>
                  <strong className="error-subheading">What it means</strong>
                  <p className="error-desc">{item.meaning}</p>
                </div>
                <div>
                  <strong className="error-subheading">Why it happens</strong>
                  <p className="error-desc">{item.cause}</p>
                </div>
              </div>

              <div className="error-fix">
                <strong>How to fix it:</strong>
                <code>{item.solution}</code>
              </div>
            </article>
          ))}
          {filtered.length === 0 && (
            <p className="muted" style={{ padding: '2rem 0', textAlign: 'center' }}>
              No common errors found matching "{query}".
            </p>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
