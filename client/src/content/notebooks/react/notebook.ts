import { codeArt, defineNotebook, flowArt, hubArt, iconArt, pg, revision } from '../dsl';

export default defineNotebook({
  id: 'react',
  title: 'React',
  name: 'React JS',
  tagline: 'Components, props and state, hooks, rendering, routing, data fetching and performance: the R in MERN.',
  color: 'blue',
  pillar: 'frontend',
  order: 50,
  cover: {
    big: 'REACT',
    full: 'React JS',
    cloud: ['Components,', 'props, state,', 'hooks:', 'UI = f(state)'],
    art: {
      topLeft: iconArt('pc', 'React'),
      topRight: flowArt(['State changes', 'Re-render', 'Diff (VDOM)', 'Update DOM']),
      left: codeArt(['function App() {', '  const [n, setN] =', '    useState(0);', '  return <h1>{n}</h1>;', '}'], 'Component'),
      centre: hubArt('Component', ['Props\nin', 'State\ninside', 'UI\nout', 'Events\nback'], 'box'),
    },
    side: { title: 'Hooks', items: ['useState', 'useEffect', 'useRef', 'useMemo'] },
    why: { title: 'Why React ?', items: ['Most-used UI library', 'Reusable components', 'Huge ecosystem', 'Skills carry to React Native'] },
    footer: 'UI is a function of state!',
  },
  pages: [
    pg('introduction', 'Introduction to React', 'What React is (a UI library)', 'Components and the virtual DOM', 'SPA vs multi-page apps', 'Creating a project with Vite'),
    pg('jsx-components', 'JSX & Components', 'What JSX compiles to', 'Function components', 'Composition and children', 'Rendering lists with keys'),
    pg('props-state', 'Props & State', 'Props: data in', 'useState: data inside', 'One-way data flow', 'Lifting state up'),
    pg('events-forms', 'Events & Forms', 'Handling events', 'Controlled vs uncontrolled inputs', 'Submitting a form', 'Validation basics'),
    pg('rendering', 'How React Renders', 'Render vs commit', 'What triggers a re-render', 'Reconciliation and keys', 'StrictMode double render'),
    pg('hooks', 'Hooks in Depth', 'Rules of hooks', 'useEffect and cleanup', 'useRef', 'Writing custom hooks'),
    pg('context-state', 'Context & State Management', 'The prop-drilling problem', 'useContext', 'useReducer', 'Redux Toolkit and Zustand overview'),
    pg('routing', 'Routing', 'React Router basics', 'Dynamic routes and params', 'Nested layouts', 'Protected routes'),
    pg('data-fetching', 'Data Fetching', 'fetch inside effects', 'Loading and error states', 'TanStack Query', 'Race conditions'),
    pg('performance', 'Performance', 'memo, useMemo, useCallback', 'Code splitting with lazy()', 'List virtualization', 'React DevTools Profiler'),
    pg('patterns-testing', 'Patterns & Testing', 'Container / presentational', 'Compound components', 'React Testing Library', 'Error boundaries'),
    revision('Props vs state', 'Controlled vs uncontrolled', 'useMemo vs useCallback'),
  ],
});
