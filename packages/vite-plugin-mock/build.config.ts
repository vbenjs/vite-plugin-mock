import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  clean: true,
  entries: ['src/index', 'src/client'],
  declaration: true,
  rollup: {
    emitCJS: true,
  },
})
