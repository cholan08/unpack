import { codeArt, defineNotebook, flowArt, hubArt, iconArt, pg, revision } from '../dsl';

export default defineNotebook({
  id: 'typescript',
  title: 'TypeScript',
  name: 'TypeScript',
  tagline: 'JavaScript with types: interfaces, unions, generics, utility types, and typing React and Node.',
  color: 'blue',
  pillar: 'frontend',
  order: 40,
  cover: {
    big: 'TS',
    full: 'TypeScript',
    cloud: ['JavaScript', 'with types:', 'bugs caught', 'before runtime'],
    art: {
      topLeft: iconArt('laptop', 'TS'),
      topRight: flowArt(['.ts file', 'tsc checks', '.js output', 'Runs anywhere']),
      left: codeArt(['let age: number = 21;', 'age = "21";', '// ✗ Type error'], 'Types'),
      centre: hubArt('Types', ['Primitives', 'Interfaces', 'Generics', 'Unions'], 'box'),
    },
    side: { title: 'Utility', items: ['Partial<T>', 'Pick<T, K>', 'Omit<T, K>', 'Record<K, V>'] },
    why: { title: 'Why TypeScript ?', items: ['Catch bugs early', 'Great autocomplete', 'Safer refactors', 'Industry standard'] },
    footer: 'If it compiles, it’s probably right!',
  },
  pages: [
    pg('introduction', 'Introduction to TypeScript', 'What TypeScript adds to JavaScript', 'The compile step (tsc)', 'tsconfig.json basics', 'Adopting it gradually'),
    pg('basic-types', 'Basic Types', 'string, number, boolean, arrays, tuples', 'any vs unknown vs never', 'Type inference', 'Type annotations'),
    pg('interfaces', 'Interfaces & Type Aliases', 'Object types', 'Optional and readonly properties', 'interface vs type', 'Extending types'),
    pg('functions', 'Typing Functions', 'Parameter and return types', 'Optional and default parameters', 'Function overloads', 'void and never'),
    pg('unions-narrowing', 'Unions & Narrowing', 'Union and intersection types', 'Guards: typeof, in, instanceof', 'Discriminated unions', 'Literal types'),
    pg('generics', 'Generics', 'Why generics exist', 'Generic functions and interfaces', 'Constraints with extends', 'Default type parameters'),
    pg('utility-types', 'Utility & Mapped Types', 'Partial, Required, Pick, Omit', 'Record and ReturnType', 'keyof and typeof', 'Mapped and conditional types'),
    pg('classes', 'Classes, Enums & OOP', 'Access modifiers', 'Abstract classes', 'Implementing interfaces', 'Enums vs union types'),
    pg('ts-react-node', 'TypeScript with React & Node', 'Typing props and state', 'Typing hooks and events', 'Typing Express handlers', 'Declaration files (.d.ts)'),
    revision('interface vs type', 'any vs unknown', 'enum vs union'),
  ],
});
