import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'src/index.ts',
  plugins: [
    typescript({
      tsconfig: 'tsconfig.build.json',
    }),
    resolve({
      jsnext: true,
      main: true,
      module: true,
      preferBuiltins: false,
      modulesOnly: true,
    }),
    commonjs(),
  ],
  output: [
    {
      file: 'lib/one-core.js',
      format: 'cjs',
    },
    {
      file: 'lib/one-core.mjs',
      format: 'esm',
    },
  ],
  // external: ['rxjs', 'reflect-metadata'],
};
