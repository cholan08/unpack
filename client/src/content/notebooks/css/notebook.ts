import { codeArt, defineNotebook, flowArt, hubArt, iconArt, pg, revision } from '../dsl';

export default defineNotebook({
  id: 'css',
  title: 'CSS',
  name: 'Cascading Style Sheets',
  tagline: 'Selectors, the box model, Flexbox and Grid, responsive design, animation and Tailwind.',
  color: 'purple',
  pillar: 'frontend',
  order: 20,
  cover: {
    big: 'CSS',
    full: 'Cascading Style Sheets',
    cloud: ['Colour,', 'layout,', 'spacing,', 'motion'],
    art: {
      topLeft: iconArt('pc', 'CSS', 'purple'),
      topRight: flowArt(['Selector', 'Cascade', 'Box model', 'Layout'], 'purple'),
      left: codeArt(['.card {', '  display: grid;', '  gap: 1rem;', '}'], 'Rule'),
      centre: hubArt('The Box', ['Content', 'Padding', 'Border', 'Margin'], 'box', 'purple'),
    },
    side: { title: 'Layout', items: ['Flexbox', 'Grid', 'Position', 'Media queries'] },
    why: { title: 'Why CSS ?', items: ['Makes the web beautiful', 'Responsive on every screen', 'Brands and design systems', 'Animation without JS'] },
    footer: 'Design is in the details!',
  },
  pages: [
    pg('introduction', 'Introduction to CSS', 'Inline, internal and external CSS', 'Rule anatomy: selector, property, value', 'How CSS is applied', 'Browser defaults and resets'),
    pg('selectors', 'Selectors & Specificity', 'Type, class, id and attribute selectors', 'Combinators', 'Pseudo-classes and pseudo-elements', 'Specificity scoring and !important'),
    pg('cascade', 'Cascade & Inheritance', 'Origin and order', 'Inherited vs non-inherited properties', 'inherit, initial, unset', 'Cascade layers'),
    pg('box-model', 'The Box Model', 'Content, padding, border, margin', 'box-sizing: border-box', 'Margin collapsing', 'display: block, inline, inline-block'),
    pg('units-colors', 'Units, Colours & Typography', 'px, em, rem, %, vw / vh', 'Colours: hex, rgb, hsl, oklch', 'Fonts and line height', 'Custom properties (variables)'),
    pg('flexbox', 'Flexbox', 'Main axis vs cross axis', 'justify-content and align-items', 'flex-grow, shrink, basis', 'Common flex layouts'),
    pg('grid', 'CSS Grid', 'Rows, columns and the fr unit', 'Grid areas', 'auto-fit and minmax()', 'Grid vs Flexbox'),
    pg('positioning', 'Positioning & Stacking', 'static, relative, absolute, fixed, sticky', 'z-index and stacking contexts', 'Overflow', 'Ways to centre anything'),
    pg('responsive', 'Responsive Design', 'Mobile-first', 'Media queries and breakpoints', 'Container queries', 'Fluid type with clamp()'),
    pg('animations', 'Transitions & Animations', 'transition', '@keyframes', 'transform', 'prefers-reduced-motion'),
    pg('architecture', 'Tailwind & CSS Architecture', 'BEM naming', 'CSS Modules', 'Utility-first with Tailwind', 'Sass basics'),
    revision('Flexbox vs Grid', 'em vs rem', 'absolute vs fixed'),
  ],
});
