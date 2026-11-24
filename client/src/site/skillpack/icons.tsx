/* Hand-drawn, simplified brand marks for the Skillpack tiles (24×24 grid).
   No icon dependency: each mark is a few SVG primitives in the brand colour.
   `currentColor` marks (black logos) follow the theme's ink colour. */
import type { ReactNode } from 'react';

const W = '#fff';
const BG = 'var(--surface)';

/** Regular polygon points, first vertex pointing up. */
function poly(n: number, r: number, cx = 12, cy = 12, rot = -90) {
  return Array.from({ length: n }, (_, i) => {
    const a = ((rot + (360 / n) * i) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

const T = (p: { x?: number; y: number; s: number; fill: string; children: ReactNode; ls?: number; italic?: boolean }) => (
  <text
    x={p.x ?? 12}
    y={p.y}
    fontSize={p.s}
    fill={p.fill}
    textAnchor="middle"
    letterSpacing={p.ls}
    fontStyle={p.italic ? 'italic' : undefined}
  >
    {p.children}
  </text>
);

const reactAtom = (
  <g fill="none" stroke="#61DAFB" strokeWidth="1.2">
    <ellipse cx="12" cy="12" rx="10" ry="3.9" />
    <ellipse cx="12" cy="12" rx="10" ry="3.9" transform="rotate(60 12 12)" />
    <ellipse cx="12" cy="12" rx="10" ry="3.9" transform="rotate(120 12 12)" />
    <circle cx="12" cy="12" r="1.9" fill="#61DAFB" stroke="none" />
  </g>
);

const javaCup = (
  <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
    <path d="M11.2 2.5c-2.4 2.2 2.2 3.4 0 6.4M14.2 4.8c-1.6 1.5 1.5 2.2 0 4.2" stroke="#E76F00" />
    <path d="M5.5 12h11v2.6a4.6 4.6 0 0 1-4.6 4.6h-1.8a4.6 4.6 0 0 1-4.6-4.6z" stroke="#5382A1" />
    <path d="M16.5 13h1.1a1.8 1.8 0 0 1 0 3.6h-1.4M4.5 21.5h13" stroke="#5382A1" />
  </g>
);

const dotnet = <T y={15.4} s={10} fill="#8B6CF0" ls={-0.6}>.NET</T>;

const gear = (color: string) => (
  <g fill="none" stroke={color}>
    <circle cx="12" cy="12" r="9.4" strokeWidth="2.6" strokeDasharray="1.7 1.25" />
    <circle cx="12" cy="12" r="7.4" strokeWidth="1.6" />
  </g>
);

export const SKILL_ICONS: Record<string, ReactNode> = {
  /* ---------- frontend ---------- */
  html: (
    <>
      <path d="M3 2h18l-1.6 18L12 22.2 4.6 20z" fill="#E34F26" />
      <path d="M12 3.6v16.9l5.9-1.7L19.3 3.6z" fill="#F06529" />
      <T y={15.8} s={11} fill={W}>5</T>
    </>
  ),
  css: (
    <>
      <path d="M3 2h18l-1.6 18L12 22.2 4.6 20z" fill="#1572B6" />
      <path d="M12 3.6v16.9l5.9-1.7L19.3 3.6z" fill="#33A9DC" />
      <T y={15.8} s={11} fill={W}>3</T>
    </>
  ),
  javascript: (
    <>
      <rect x="2" y="2" width="20" height="20" rx="2" fill="#F7DF1E" />
      <text x="20" y="19.5" fontSize="9.5" fill="#000" textAnchor="end">JS</text>
    </>
  ),
  typescript: (
    <>
      <rect x="2" y="2" width="20" height="20" rx="2" fill="#3178C6" />
      <text x="20" y="19.5" fontSize="9.5" fill={W} textAnchor="end">TS</text>
    </>
  ),
  react: reactAtom,
  vue: (
    <>
      <path d="M1.5 3.5h4.3L12 14.2l6.2-10.7h4.3L12 21.5z" fill="#41B883" />
      <path d="M5.8 3.5h3.6L12 8l2.6-4.5h3.6L12 14.2z" fill="#35495E" />
    </>
  ),
  angular: (
    <>
      <path d="M12 1.8 2.8 5.1l1.4 12.1 7.8 4.9 7.8-4.9 1.4-12.1z" fill="#DD0031" />
      <path d="M12 1.8v20.3l7.8-4.9 1.4-12.1z" fill="#C3002F" />
      <path d="M7.4 17 12 5.8 16.6 17M9.1 13h5.8" fill="none" stroke={W} strokeWidth="1.9" strokeLinejoin="round" />
    </>
  ),
  next: (
    <>
      <circle cx="12" cy="12" r="10.5" fill="currentColor" />
      <path d="M8.6 16.6V7.4l8 10.6M15.4 7.4v6" fill="none" stroke={BG} strokeWidth="1.7" strokeLinecap="round" />
    </>
  ),
  nuxt: (
    <g fill="none" stroke="#00DC82" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M9.6 19H2.8L10 6.6l3.1 5.4" />
      <path d="M13 19h8.2l-4.1-7.1z" fill="#00DC82" />
    </g>
  ),
  bootstrap: (
    <>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="#7952B3" />
      <T y={16.6} s={13} fill={W}>B</T>
    </>
  ),
  tailwind: (
    <path
      fill="#06B6D4"
      d="M12 6c-2.7 0-4.3 1.3-5 4 1-1.3 2.2-1.8 3.5-1.5.8.2 1.3.7 1.9 1.3 1 1 2.1 2.2 4.6 2.2 2.7 0 4.3-1.3 5-4-1 1.3-2.2 1.8-3.5 1.5-.8-.2-1.3-.7-1.9-1.3C15.6 7.2 14.5 6 12 6zm-5 6c-2.7 0-4.3 1.3-5 4 1-1.3 2.2-1.8 3.5-1.5.8.2 1.3.7 1.9 1.3 1 1 2.1 2.2 4.6 2.2 2.7 0 4.3-1.3 5-4-1 1.3-2.2 1.8-3.5 1.5-.8-.2-1.3-.7-1.9-1.3C10.6 13.2 9.5 12 7 12z"
    />
  ),
  mui: (
    <g fill="#007FFF">
      <path d="M1.5 4.5 9 8.8l7.5-4.3V15l-4 2.3v-4l3-1.7V8.9L9 12.7 2.5 9v7.5L1.5 16z" />
      <path d="M18 4.6l4-2.3v4.4l-4 2.3zM18 11l4-2.3v6.9l-9.5 5.5v-4.4L18 13.6z" />
    </g>
  ),
  chakra: (
    <>
      <circle cx="12" cy="12" r="10.5" fill="#319795" />
      <path d="M13.4 4.5 7 13h4.4l-1.2 6.5L17 11h-4.4z" fill={W} />
    </>
  ),
  shadcn: (
    <path d="M5 13.5 13.5 5M10.5 19 19 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  ),

  /* ---------- backend ---------- */
  python: (
    <>
      <path
        fill="#3776AB"
        d="M11.9 2C7 2 7.3 4.1 7.3 4.1v2.2h4.7V7H5.4S2 6.6 2 11.9s3 5.1 3 5.1h1.8v-2.5s-.1-3 2.9-3h4.9s2.8 0 2.8-2.7V4.6S17.8 2 11.9 2zM9.3 3.5a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8z"
      />
      <path
        fill="#FFD43B"
        transform="rotate(180 12 12)"
        d="M11.9 2C7 2 7.3 4.1 7.3 4.1v2.2h4.7V7H5.4S2 6.6 2 11.9s3 5.1 3 5.1h1.8v-2.5s-.1-3 2.9-3h4.9s2.8 0 2.8-2.7V4.6S17.8 2 11.9 2zM9.3 3.5a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8z"
      />
    </>
  ),
  node: (
    <>
      <polygon points={poly(6, 10.2)} fill="none" stroke="#5FA04E" strokeWidth="1.6" strokeLinejoin="round" />
      <T y={15} s={8} fill="#5FA04E">JS</T>
    </>
  ),
  java: javaCup,
  ruby: (
    <>
      <path d="M6.5 3h11l4 5L12 21.5 2.5 8z" fill="#CC342D" />
      <path
        d="M2.5 8h19M8.5 8 12 3l3.5 5M8.5 8 12 21.5 15.5 8"
        fill="none"
        stroke="rgba(255,255,255,.55)"
        strokeWidth=".9"
        strokeLinejoin="round"
      />
    </>
  ),
  php: (
    <>
      <ellipse cx="12" cy="12" rx="11" ry="6.4" fill="#777BB4" />
      <T y={14.6} s={7.6} fill={W} italic>php</T>
    </>
  ),
  csharp: <T y={17} s={13.5} fill="#A179DC">C#</T>,
  rust: (
    <>
      {gear('#F46623')}
      <T y={15.6} s={10} fill="#F46623">R</T>
    </>
  ),
  go: (
    <>
      <path d="M1 9.6h4M.2 12h3.6M1.2 14.4h2.4" stroke="#00ADD8" strokeWidth="1.1" strokeLinecap="round" />
      <text x="14.2" y="16.4" fontSize="12" fill="#00ADD8" textAnchor="middle" fontStyle="italic" letterSpacing="-0.6">GO</text>
    </>
  ),
  express: (
    <text x="12" y="16.5" fontSize="15" fill="currentColor" textAnchor="middle" className="sk-thin">ex</text>
  ),
  django: <T y={16.5} s={14} fill="#44B78B">dj</T>,
  springboot: (
    <>
      <polygon points={poly(6, 10.8)} fill="#6DB33F" />
      <path d="M12 6.6v5.2M8.4 8.8a5 5 0 1 0 7.2 0" fill="none" stroke={W} strokeWidth="1.9" strokeLinecap="round" />
    </>
  ),
  rails: (
    <g fill="none" stroke="#D30001" strokeLinecap="round">
      <path d="M2.5 20.5C4.2 11 10.5 5 21.5 4.5" strokeWidth="2.6" />
      <path d="M7.4 20.5c1.3-5.6 5.3-9.4 12.6-10.2" strokeWidth="1.7" />
      <path d="M5 11.5l1.6 1M8.4 7.8l1.2 1.4M12.6 5.4l.7 1.6" strokeWidth="1.3" />
    </g>
  ),
  dotnet,
  laravel: (
    <path
      d="M3 5 6 3.3 9 5v8.5l6-3.5V6.2l3-1.7 3 1.7V10l-6 3.5V17l-6 3.5L3 17zM3 5l3 1.7L9 5M6 6.7V15l3 1.7M15 6.2l3 1.7 3-1.7M18 7.9v3.8M9 13.5l6 3.5M9 16.7l6-3.2"
      fill="none"
      stroke="#FF2D20"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  ),
  nest: (
    <>
      <path d="M4 7.5 7 3l2.6 3.2h4.8L17 3l3 4.5v6.3c0 4.3-3.6 7.7-8 7.7s-8-3.4-8-7.7z" fill="#E0234E" />
      <circle cx="9" cy="12" r="1.3" fill={BG} />
      <circle cx="15" cy="12" r="1.3" fill={BG} />
      <path d="M10.5 15.8h3l-1.5 1.4z" fill={BG} />
    </>
  ),

  /* ---------- databases ---------- */
  mysql: (
    <>
      <path d="M11 8.6c2.6-3.6 7-4.1 10-1.2-1.6-.2-2.6.3-3.2 1" fill="none" stroke="#4479A1" strokeWidth="1.3" strokeLinecap="round" />
      <text x="12" y="17.4" fontSize="8.8" textAnchor="middle" fill="#4479A1" letterSpacing="-0.4">
        My<tspan fill="#F29111">SQL</tspan>
      </text>
    </>
  ),
  postgres: (
    <>
      <path d="M5.2 7.4c-2.3 1.2-2.6 4.6-.9 6.6 1.2 1.4 3.2 1.6 4.4.6z" fill="#5B8BEF" />
      <path d="M11.5 2.8c4.4 0 7.7 3 7.7 7.2 0 2.3-1 4.1-2.5 5.2v4.3c0 1.6-1.2 2.6-2.6 2.6h-.9v-1.9h.7c.6 0 .8-.3.8-.8v-3.3c-.9.3-2 .5-3.2.5-4.4 0-7.7-3-7.7-7S7.1 2.8 11.5 2.8z" fill="#336791" />
      <circle cx="14.3" cy="8.6" r="1.1" fill={W} />
      <path d="M17.6 13.2c1.4.4 2.6.1 3.4-.8" fill="none" stroke={W} strokeWidth="1.3" strokeLinecap="round" />
    </>
  ),
  mongodb: (
    <>
      <path d="M12 1.8S6 7.7 6 13.4c0 3.6 2.6 6 5.3 6.8L12 22.2l.7-2c2.7-.8 5.3-3.2 5.3-6.8C18 7.7 12 1.8 12 1.8z" fill="#47A248" />
      <path d="M12 6v16" stroke="#2E7A30" strokeWidth=".9" />
    </>
  ),
  couchdb: (
    <g fill="#E42528">
      <rect x="4.5" y="6" width="15" height="6" rx="1.6" />
      <rect x="4.5" y="13" width="15" height="3.6" rx="1" />
      <rect x="1.5" y="9.5" width="3.2" height="9" rx="1.2" />
      <rect x="19.3" y="9.5" width="3.2" height="9" rx="1.2" />
    </g>
  ),
  cassandra: (
    <g fill="none" stroke="#1287B1" strokeWidth="1.4" strokeLinecap="round">
      <path d="M2 13c3-4.3 6.5-6.3 10-6.3S19 8.7 22 13c-3 4.3-6.5 6.3-10 6.3S5 17.3 2 13z" />
      <circle cx="12" cy="13" r="3" fill="#1287B1" />
      <path d="M5.6 8.1 4 6M9.4 6.4 8.8 4M14.6 6.4l.6-2.4M18.4 8.1 20 6" />
    </g>
  ),
  elasticsearch: (
    <>
      <path d="M4.4 9a8.6 8.6 0 0 1 15.2 0z" fill="#FEC514" />
      <path d="M3.2 10.4h17.6a8.8 8.8 0 0 1 0 3.2H3.2a8.8 8.8 0 0 1 0-3.2z" fill="#00BFB3" />
      <path d="M4.4 15h15.2a8.6 8.6 0 0 1-15.2 0z" fill="#F04E98" />
    </>
  ),
  neo4j: (
    <g stroke="#018BFF" strokeWidth="1.5">
      <path d="M15.5 13.5 5.5 18M15.5 13.5 8 5.5M15.5 13.5 19.5 5" />
      <circle cx="15.5" cy="13.5" r="3.8" fill="#018BFF" />
      <circle cx="5.5" cy="18" r="2.2" fill={BG} />
      <circle cx="8" cy="5.5" r="2.2" fill={BG} />
      <circle cx="19.5" cy="5" r="1.6" fill={BG} />
    </g>
  ),
  arangodb: (
    <g fill="none" stroke="#DDE072" strokeWidth="1.6">
      <ellipse cx="12" cy="13" rx="9.5" ry="5.5" />
      <ellipse cx="10.5" cy="12" rx="4.5" ry="3" />
      <path d="M14 7.8c1.5-2.5 3.6-3.6 6-3.3" strokeLinecap="round" />
    </g>
  ),
  redis: (
    <g fill="#FF4438">
      <path d="M2 8.2 12 4l10 4.2-10 4.2z" />
      <path d="M2 12.2l10 4.2 10-4.2" fill="none" stroke="#FF4438" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M2 16.2l10 4.2 10-4.2" fill="none" stroke="#FF4438" strokeWidth="1.8" strokeLinejoin="round" />
    </g>
  ),
  kafka: (
    <g fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8.5 5.5v13M8.5 12l7.4-4.1M8.5 12l7.4 4.1" />
      <circle cx="8.5" cy="4" r="2" fill={BG} />
      <circle cx="8.5" cy="12" r="2.6" fill={BG} />
      <circle cx="8.5" cy="20" r="2" fill={BG} />
      <circle cx="17.5" cy="7" r="2" fill={BG} />
      <circle cx="17.5" cy="17" r="2" fill={BG} />
    </g>
  ),
  rabbitmq: (
    <path
      fill="#FF6600"
      fillRule="evenodd"
      d="M3 4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v6h3V4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v6h3a2 2 0 0 1 2 2v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zm12.5 10h3v3h-3z"
    />
  ),
  sqs: (
    <g fill="#FF4F8B">
      <polygon points={poly(6, 5.2, 12, 7.2, -90)} />
      <polygon points={poly(6, 5.2, 7, 16, -90)} />
      <polygon points={poly(6, 5.2, 17, 16, -90)} />
      <g fill="none" stroke={BG} strokeWidth=".9">
        <path d="M12 7.2v5.2M12 7.2l4.5-2.6M12 7.2 7.5 4.6M7 16v5.2M7 16l4.5-2.6M7 16l-4.5-2.6M17 16v5.2M17 16l4.5-2.6M17 16l-4.5-2.6" />
      </g>
    </g>
  ),
  zeromq: <T y={15.8} s={10.2} fill="#DF0000" ls={-0.6}>ØMQ</T>,

  /* ---------- devops ---------- */
  nginx: (
    <>
      <polygon points={poly(6, 10.8)} fill="#009639" />
      <path d="M8.6 16.4V7.6l6.8 8.8V7.6" fill="none" stroke={W} strokeWidth="1.9" strokeLinejoin="round" strokeLinecap="round" />
    </>
  ),
  apache: (
    <>
      <path d="M18.5 2.5C13.5 4.5 8.6 10 6.5 17.5l-.8 3.8 1.6-3c4.3-1.8 9-6.6 11.2-15.8z" fill="#D22128" />
      <path d="M17.5 4.5C13.5 8.5 9.5 14 7 20" stroke="#F69923" strokeWidth=".8" fill="none" />
    </>
  ),
  aws: (
    <>
      <text x="12" y="13.2" fontSize="9" fill="currentColor" textAnchor="middle">aws</text>
      <path d="M4.5 16c4.5 2.6 10.5 2.6 15 0M17.3 14.8l2.4 1.1-.9 2.4" fill="none" stroke="#FF9900" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  azure: (
    <>
      <path d="M10.2 3.5 3 19h5.2l7-12.8z" fill="#0078D4" />
      <path d="M15.4 8.5 11 16.2l3.8 2.8H21z" fill="#35A6F0" />
    </>
  ),
  gcloud: (
    <path
      d="M7.2 18.5a4.6 4.6 0 0 1-.5-9.2 6 6 0 0 1 11.3 1.7 3.8 3.8 0 0 1-.4 7.5z"
      fill="none"
      stroke="#4285F4"
      strokeWidth="2.3"
      strokeLinejoin="round"
    />
  ),
  ansible: (
    <>
      <circle cx="12" cy="12" r="10.5" fill="#EE0000" />
      <path d="M7.6 17.2 12 6.4l4.4 10.8M9.6 12.6l5.6 4" fill="none" stroke={W} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    </>
  ),
  terraform: (
    <g fill="#844FBA">
      <path d="M2.5 2v5.6l4.9 2.8V4.8z" />
      <path d="M8.6 5.5v5.6l4.9 2.8V8.3z" />
      <path d="M8.6 12.4V18l4.9 2.8v-5.6z" />
      <path d="M14.7 8.3v5.6l4.9-2.8V5.5z" />
    </g>
  ),
  chef: (
    <>
      <circle cx="12" cy="12" r="9.4" fill="none" stroke="#F09820" strokeWidth="2.4" strokeDasharray="4.2 1.6" />
      <path d="M15.2 9.2a4 4 0 1 0 0 5.6" fill="none" stroke="#F09820" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  jenkins: (
    <g fill="none" stroke="#D24939" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="11" r="7.5" />
      <path d="M8.5 20.5c1-1.5 2.2-2 3.5-2s2.5.5 3.5 2M9.5 13.5c1.4 1.3 3.6 1.3 5 0" />
      <circle cx="9.4" cy="9.6" r=".6" fill="#D24939" />
      <circle cx="14.6" cy="9.6" r=".6" fill="#D24939" />
      <path d="M5.5 7.5c2-3.5 9-4.5 12.5-.5" />
    </g>
  ),
  ghactions: (
    <g fill="none" stroke="#2088FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="5" r="2.6" />
      <path d="M5 7.6V19h4.4M7.6 5h4.4a3 3 0 0 1 3 3v.9" />
      <circle cx="12" cy="19" r="2.6" />
      <circle cx="17.5" cy="11.5" r="2.6" />
      <path d="m10.9 19 .8.8 1.4-1.6M16.4 11.5l.8.8 1.4-1.6" />
    </g>
  ),
  gitlab: (
    <>
      <path d="M12 21.5 2.2 14.4l1.9-10 2.6 7.2h10.6l2.6-7.2 1.9 10z" fill="#FC6D26" />
      <path d="M12 21.5 6.7 11.6h10.6z" fill="#E24329" />
    </>
  ),
  docker: (
    <>
      <path d="M1.8 12h17.6c.9-1.6 2.3-2.1 2.9-2-.2 1-.9 1.9-2 2.3C19.1 16.8 15 20 9.6 20 5 20 2.4 16.5 1.8 12z" fill="#2496ED" />
      <g fill="#2496ED">
        {[4.4, 7, 9.6, 12.2].map((x) => <rect key={`a${x}`} x={x} y="8.9" width="2.2" height="2.2" rx=".3" />)}
        {[7, 9.6, 12.2].map((x) => <rect key={`b${x}`} x={x} y="6.3" width="2.2" height="2.2" rx=".3" />)}
        <rect x="12.2" y="3.7" width="2.2" height="2.2" rx=".3" />
      </g>
    </>
  ),
  kubernetes: (
    <>
      <polygon points={poly(7, 11)} fill="#326CE5" strokeLinejoin="round" />
      <g stroke={W} strokeWidth="1.3" fill="none" strokeLinecap="round">
        <circle cx="12" cy="12.2" r="3.6" />
        {Array.from({ length: 7 }, (_, i) => {
          const a = ((-90 + (360 / 7) * i) * Math.PI) / 180;
          return (
            <line key={i} x1={12 + 2 * Math.cos(a)} y1={12.2 + 2 * Math.sin(a)} x2={12 + 6.6 * Math.cos(a)} y2={12.2 + 6.6 * Math.sin(a)} />
          );
        })}
      </g>
    </>
  ),
  openshift: (
    <>
      <circle cx="12" cy="12" r="8.6" fill="none" stroke="#EE0000" strokeWidth="2.8" strokeDasharray="22 5" transform="rotate(-20 12 12)" />
      <path d="M3 9.5 9 7.6M15 16.4l6-1.9" stroke="#EE0000" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  elk: (
    <g fill="none" stroke="#00BFB3" strokeWidth="1.5">
      <circle cx="9" cy="9" r="5.5" />
      <circle cx="15" cy="9" r="5.5" />
      <circle cx="12" cy="15" r="5.5" />
    </g>
  ),
  prometheus: (
    <>
      <circle cx="12" cy="12" r="10.5" fill="#E6522C" />
      <path d="M12 4.8c1 2.6 3.6 3.6 3.6 6.8a3.6 3.6 0 0 1-7.2 0c0-1.6 1-2.6 1.5-3.1 0 1.6.8 2.1 1.5 2.1 0-2.1-.5-3.6.6-5.8z" fill={W} />
      <path d="M8 17h8M9.2 19.2h5.6" stroke={W} strokeWidth="1.3" strokeLinecap="round" />
    </>
  ),
  grafana: (
    <>
      {gear('#F46800')}
      <path d="M12 8.5a3.5 3.5 0 1 0 3.5 3.5" fill="none" stroke="#F46800" strokeWidth="2" strokeLinecap="round" />
    </>
  ),

  /* ---------- mobile ---------- */
  flutter: (
    <>
      <path d="M14.3 2 4.3 12l3.1 3.1L20.5 2z" fill="#47C5FB" />
      <path d="M14.3 11.3 9 16.6l5.3 5.4h6.2l-5.4-5.4 5.4-5.3z" fill="#47C5FB" />
      <path d="M9 16.6l3.1 3.1 2.2-3.1-2.2-2.2z" fill="#02569B" />
    </>
  ),
  ionic: (
    <>
      <path d="M19.6 8.4A9 9 0 1 1 15.6 3.8" fill="none" stroke="#3880FF" strokeWidth="2" strokeLinecap="round" />
      <circle cx="18.4" cy="5.6" r="1.8" fill="#3880FF" />
      <circle cx="12" cy="12" r="4.2" fill="#3880FF" />
    </>
  ),
  pwa: <T y={15.8} s={10.4} fill="#8A5CF5" ls={-0.6}>PWA</T>,
  kotlin: <path d="M3 3h18l-9 9 9 9H3z" fill="#7F52FF" />,
  android: (
    <>
      <path d="M4.5 17a7.5 7.5 0 0 1 15 0z" fill="#3DDC84" />
      <path d="M7.6 10.4 5.8 7.6M16.4 10.4l1.8-2.8" stroke="#3DDC84" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="9" cy="14" r=".95" fill={BG} />
      <circle cx="15" cy="14" r=".95" fill={BG} />
    </>
  ),
  swift: (
    <>
      <rect x="1.5" y="1.5" width="21" height="21" rx="5.5" fill="#F05138" />
      <path
        transform="translate(2.6 2.4) scale(.78)"
        fill={W}
        d="M17.5 15.5c1-3-1-6.5-4.5-9 1.8 2.3 2.4 4.5 1.8 6.3C12.5 11 9.5 8.5 6.5 6.5c2 2.3 4 4.5 5.5 6-1.8-1-4-2.5-6.2-4.5 2 3.8 5 6.5 8.5 8-2.5 1.2-5.5 1-8.3-.5 2 2.5 5.5 3.8 9 2.6 1.2-.4 2-.3 2.6.4.2-.9-.1-1.9-.1-1.9z"
      />
    </>
  ),
  apple: (
    <path
      fill="currentColor"
      d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2-1.1 2.8-2.3.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.7zM14.1 5.8c.6-.8 1.1-1.8 1-2.8-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.7-1 2.7 1 .1 2-.5 2.7-1.3z"
    />
  ),
  xcode: (
    <>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="#147EFB" />
      <path d="M7 17.5 14.5 10M12.4 6.6l5 5M12.4 6.6c1.5-1 3.3-.9 4.4.2" fill="none" stroke={W} strokeWidth="2" strokeLinecap="round" />
      <path d="M6 7h3M7.5 5.5v3" stroke="rgba(255,255,255,.6)" strokeWidth="1" strokeLinecap="round" />
    </>
  ),
};

export function SkillIcon({ name, size = 30 }: { name: string; size?: number }) {
  return (
    <svg className="sk-ico" viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      {SKILL_ICONS[name] ?? <circle cx="12" cy="12" r="9" fill="var(--muted-2)" />}
    </svg>
  );
}
