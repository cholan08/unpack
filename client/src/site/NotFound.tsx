import { Link } from 'react-router';
import { ArrowRight, Search } from 'lucide-react';
import { useSearch } from './Search';

export function NotFound() {
  const { open } = useSearch();
  return (
    <main className="wrap notfound">
      <span className="notfound-code mono">404</span>
      <h1 className="page-title">This page didn’t make the round trip.</h1>
      <p className="page-lede">The link may be old, or the lesson hasn’t been written yet. Search for it, or head back home.</p>
      <div className="page-actions">
        <Link to="/" className="btn btn--primary">
          Back home <ArrowRight size={15} />
        </Link>
        <button className="btn" onClick={open}>
          <Search size={15} /> Search
        </button>
      </div>
    </main>
  );
}
