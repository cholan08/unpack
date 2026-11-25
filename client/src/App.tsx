import { Suspense, lazy, useEffect } from 'react';
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
import { SkillToolPage } from '@/site/SkillToolPage';
import { TechpackPage } from '@/site/TechpackPage';
import { HandnotePage } from '@/site/HandnotePage';
import { NotebooksPage } from '@/site/notebooks/NotebooksPage';
import { NotebookReader } from '@/site/notebooks/NotebookReader';
import { TopicPage } from '@/site/TopicPage';
import { LibraryPage } from '@/site/LibraryPage';
import { AboutPage } from '@/site/AboutPage';
import { PILLARS } from '@/content/pillars';
import { AppLayout } from '@/site/AppShell';
import { LessonShell } from '@/site/LessonShell';
import { LessonPageLazy } from '@/site/prefetch';
import { SearchProvider } from '@/site/Search';
import { NotFound } from '@/site/NotFound';
import { MentorDock } from '@/site/MentorDock';
import { Hotkeys } from '@/site/Hotkeys';
import { Toaster } from '@/site/Toaster';
import { LevelWatcher } from '@/site/doors/Levels';
import { installSpotlight } from '@/lib/spotlight';

installSpotlight();

// The Manual: its own chunks, fetched the first time someone opens it.
const ManualPage = lazy(() => import('@/site/manual/ManualPage').then((m) => ({ default: m.ManualPage })));
const ChapterPage = lazy(() => import('@/site/manual/ChapterPage').then((m) => ({ default: m.ChapterPage })));
// The three doors into the Manual (Explore, Build, Path): one chunk each.
const ExplorePage = lazy(() => import('@/site/doors/ExplorePage').then((m) => ({ default: m.ExplorePage })));
const BuildPage = lazy(() => import('@/site/doors/BuildPage').then((m) => ({ default: m.BuildPage })));
const PathPage = lazy(() => import('@/site/doors/PathPage').then((m) => ({ default: m.PathPage })));

/**
 * A new page starts at the top. A link with a #anchor (a Techpack sheet, a glossary term…) lands
 * on that element instead, waiting a few frames for it if the page renders it a moment later.
 */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    let tries = 0;
    let raf = 0;
    const seek = () => {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) el.scrollIntoView({ block: 'start' });
      else if (tries++ < 40) raf = requestAnimationFrame(seek);
    };
    seek();
    return () => cancelAnimationFrame(raf);
  }, [pathname, hash]);
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
            <Route path="/manual" element={<Suspense fallback={null}><ManualPage /></Suspense>} />
            <Route path="/manual/:chapterId" element={<Suspense fallback={null}><ChapterPage /></Suspense>} />
            <Route path="/explore" element={<Suspense fallback={null}><ExplorePage /></Suspense>} />
            <Route path="/build" element={<Suspense fallback={null}><BuildPage /></Suspense>} />
            <Route path="/path" element={<Suspense fallback={null}><PathPage /></Suspense>} />
            <Route path="/me" element={<DashboardPage />} />
            <Route path="/capstone" element={<CapstonePage />} />
            <Route path="/capstone/:milestoneId" element={<CapstonePage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/skillpack" element={<SkillpackPage />} />
            <Route path="/skillpack/:toolId" element={<SkillToolPage />} />
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
            <Route path="/about" element={<AboutPage />} />
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
        {/* the AI mentor follows the learner across every page, lesson player included */}
        <MentorDock />
        {/* "G then …" page shortcuts and the "?" sheet, everywhere */}
        <Hotkeys />
        <Toaster />
        {/* records a level the moment it is earned, on any page (lesson player included) */}
        <LevelWatcher />
      </SearchProvider>
    </BrowserRouter>
  );
}
