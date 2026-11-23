import { Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router';
import { HomePage } from '@/site/HomePage';
import { CoursePage, GlossaryPage } from '@/site/CoursePage';
import { LessonShell } from '@/site/LessonShell';
import { LessonPageLazy } from '@/site/prefetch';
import { SearchProvider } from '@/site/Search';
import { NotFound } from '@/site/NotFound';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <SearchProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/:courseId" element={<CoursePage />} />
        <Route path="/:courseId/glossary" element={<GlossaryPage />} />
        <Route
          path="/:courseId/:lessonId"
          element={
            <Suspense fallback={<LessonShell />}>
              <LessonPageLazy />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </SearchProvider>
    </BrowserRouter>
  );
}
