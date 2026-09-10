import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettierConfig from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'
import { noChainedAssertion } from './eslint-rules/no-chained-assertion.mjs'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Typed configs. strictTypeChecked already enables no-explicit-any,
  // no-unnecessary-type-assertion, no-unnecessary-condition,
  // no-non-null-assertion, no-empty-object-type. stylisticTypeChecked
  // already enables prefer-nullish-coalescing and prefer-optional-chain,
  // so they are not repeated below.
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    name: 'jot/project-service',
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['*.mjs', '*.js'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    name: 'jot/extra-type-rules',
    rules: {
      // Not in any preset (only in `all`): separate type imports reduce
      // accidental value imports and noisy diffs.
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      // Not enabled by strictTypeChecked (only in `all`): rejects
      // assertions that narrow without evidence (e.g. unknown -> string).
      '@typescript-eslint/no-unsafe-type-assertion': 'error',
      // Local port of anti-slop no-chained-type-assertions (narrow scope):
      // nested `as` launders weak evidence. No standard equivalent.
      'jot/no-chained-assertion': 'error',
    },
    plugins: { jot: { rules: { 'no-chained-assertion': noChainedAssertion } } },
  },
  // Must stay last: disables stylistic rules that would fight Prettier.
  prettierConfig,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    '.context/**',
    'coverage/**',
    'drizzle/**',
  ]),
])

export default eslintConfig
