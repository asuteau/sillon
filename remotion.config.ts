import { Config } from '@remotion/cli/config'
import { enableTailwind } from '@remotion/tailwind-v4'

// Landing engine spike (#110): Remotion Studio only, never the app build.
// The app's Tailwind v4 styles (`src/styles.css`) load through webpack here;
// root-relative urls (the fonts in `public/`) are left for Remotion's static
// server instead of being resolved as modules.
Config.overrideWebpackConfig((config) => {
  const tailwind = enableTailwind(config)
  return {
    ...tailwind,
    module: {
      ...tailwind.module,
      rules: (tailwind.module?.rules ?? []).map((rule) => {
        if (
          !rule ||
          typeof rule !== 'object' ||
          !Array.isArray(rule.use) ||
          !String(rule.test).includes('css')
        ) {
          return rule
        }
        return {
          ...rule,
          use: rule.use.map((use) =>
            typeof use === 'object' &&
            use !== null &&
            'loader' in use &&
            String(use.loader).includes('css-loader')
              ? {
                  ...use,
                  options: {
                    ...(typeof use.options === 'object' ? use.options : {}),
                    url: { filter: (url: string) => !url.startsWith('/') },
                  },
                }
              : use,
          ),
        }
      }),
    },
  }
})
