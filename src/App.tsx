import { Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router';
import { HomePage } from '@/site/HomePage';
import { CoursePage, GlossaryPage } from '@/site/CoursePage';
import { StartPage } from '@/site/StartPage';
import { RoadmapPage } from '@/site/RoadmapPage';
import { GatePage } from '@/site/GatePage';
import { DashboardPage } from '@/site/DashboardPage';
import { CapstonePage } from '@/site/CapstonePage';
import { CommonErrorsPage } from '@/site/CommonErrorsPage';
import { ReviewPage } from '@/site/ReviewPage';
import { SkillpackPage } from '@/site/SkillpackPage';
import { TechpackPage } from '@/site/TechpackPage';
import { HandnotePage } from '@/site/HandnotePage';
import { NotebooksPage } from '@/site/notebooks/NotebooksPage';
import { NotebookReader } from '@/site/notebooks/NotebookReader';
import { TopicPage } from '@/site/TopicPage';
import { LibraryPage } from '@/site/LibraryPage';
import { PILLARS } from '@/content/pillars';
import { AppLayout } from '@/site/AppShell';
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
          {/* every page except the lesson player sits inside the app shell (sidebar / drawer) */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/start" element={<StartPage />} />
            <Route path="/me" element={<DashboardPage />} />
            <Route path="/capstone" element={<CapstonePage />} />
            <Route path="/capstone/:milestoneId" element={<CapstonePage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/skillpack" element={<SkillpackPage />} />
            <Route path="/techpack" element={<TechpackPage />} />
            <Route path="/handnote" element={<HandnotePage />} />
            <Route path="/notebooks" element={<NotebooksPage />} />
            <Route path="/notebooks/:bookId" element={<NotebookReader />} />
            <Route path="/notebooks/:bookId/:pageId" element={<NotebookReader />} />
            <Route path="/errors" element={<CommonErrorsPage />} />
            {/* main topics + Projects (Start Here keeps its own /start page); must come before /:courseId */}
            {PILLARS.filter((p) => p.id !== 'start').map((p) => (
              <Route key={p.id} path={`/${p.id}`} element={<TopicPage id={p.id} />} />
            ))}
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/:courseId" element={<CoursePage />} />
            <Route path="/:courseId/roadmap" element={<RoadmapPage />} />
            <Route path="/:courseId/gate/:partId" element={<GatePage />} />
            <Route path="/:courseId/glossary" element={<GlossaryPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          {/* the lesson player is full screen: no sidebar */}
          <Route
            path="/:courseId/:lessonId"
            element={
              <Suspense fallback={<LessonShell />}>
                <LessonPageLazy />
              </Suspense>
            }
          />
        </Routes>
      </SearchProvider>
    </BrowserRouter>
  );
}
