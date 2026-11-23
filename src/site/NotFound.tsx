import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from './SiteHeader';

export function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="wrap notfound">
        <span className="eyebrow mono">404</span>
        <h1 className="display">This page didn’t make the round trip.</h1>
        <p className="muted">The link may be old, or the lesson hasn’t been written yet.</p>
        <Link to="/" className="btn btn--primary">Back home</Link>
      </main>
      <SiteFooter />
    </>
  );
}
