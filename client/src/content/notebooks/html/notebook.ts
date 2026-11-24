import { codeArt, defineNotebook, flowArt, hubArt, iconArt, pg, revision } from '../dsl';

export default defineNotebook({
  id: 'html',
  title: 'HTML',
  name: 'HyperText Markup Language',
  tagline: 'The structure of every web page: elements, forms, semantic tags, SEO and accessibility.',
  color: 'orange',
  pillar: 'frontend',
  order: 10,
  cover: {
    big: 'HTML',
    full: 'HyperText Markup Language',
    cloud: ['Structure', 'and meaning', 'for every', 'web page'],
    art: {
      topLeft: iconArt('pc', 'HTML'),
      topRight: flowArt(['HTML', 'DOM tree', 'Render', 'Page']),
      left: codeArt(['<main>', '  <h1>Hello</h1>', '  <p>Web!</p>', '</main>'], 'Markup'),
      centre: hubArt('<html>', ['<head>\nmeta', '<body>\ncontent', 'Forms', 'Media'], 'box'),
    },
    side: { title: 'Tags', items: ['<header>', '<main>', '<section>', '<footer>'] },
    why: { title: 'Why HTML ?', items: ['The skeleton of every site', 'SEO starts here', 'Accessible by default', 'Easy to learn'] },
    footer: 'Structure first, style later!',
  },
  pages: [
    pg('introduction', 'Introduction to HTML', 'What HTML is (markup, not programming)', 'Elements, tags and attributes', 'Page skeleton: doctype, head, body', 'How the browser reads it'),
    pg('text', 'Text, Headings & Lists', 'h1–h6 hierarchy', 'Paragraphs, breaks and emphasis', 'Ordered, unordered and description lists', 'Block vs inline elements'),
    pg('links-media', 'Links, Images & Media', 'Anchor tags and paths', 'img with alt text', 'audio, video and iframe', 'Responsive images (srcset)'),
    pg('tables', 'Tables', 'table, tr, th, td', 'thead, tbody, tfoot', 'colspan and rowspan', 'When not to use tables'),
    pg('forms', 'Forms & Inputs', 'form, action and method', 'Input types', 'Labels and accessibility', 'Built-in validation'),
    pg('semantic', 'Semantic HTML', 'header, nav, main, article, section, footer', 'div vs semantic tags', 'Why semantics matter', 'The document outline'),
    pg('head-seo', 'Head, Meta & SEO', 'title and meta description', 'The viewport meta tag', 'Open Graph tags', 'Linking CSS and JavaScript'),
    pg('accessibility', 'Accessibility (a11y)', 'How screen readers read a page', 'ARIA roles: when they are needed', 'Keyboard navigation', 'Contrast and alt text'),
    pg('dom', 'The DOM', 'HTML → DOM tree', 'Nodes and elements', 'Attributes vs properties', 'Inspecting in DevTools'),
    pg('html5-apis', 'HTML5 APIs', 'Canvas and SVG', 'localStorage and sessionStorage', 'Geolocation', 'Drag and drop'),
    revision('Block vs inline', 'div vs section', 'id vs class'),
  ],
});
