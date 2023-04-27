# Client side loading of translations via HTTP

This examples shows a basic way of loading translations within a clientside rendered page. In general you should prefer static and server rendered pages where possible where you can benefit from preloading links in Next.js, however there are use cases where client side rendering and async loading of translations makes sense.

This includes but not limited to
* client side only rendered components that you dont want to always load translations for at build
* Setting `fallback: true` while using incremental static regeneration - no server side methods like getStaticProps are run for the fallback page
* You want completely client side routing with no waiting for server or static props methods to run

## How does it work

On the server when using SSR the translations are loaded via the filesystem and then returned as page data via the `serverSideTranslations` method included in `next-i18next`. With our config we specify an alternative loading method purely for the browser environment. We're using three i18next backend plugins:
* [i18next-chained-backend](https://github.com/i18next/i18next-chained-backend)
* [i18next-http-backend](https://github.com/i18next/i18next-http-backend)
* [i18next-localstorage-backend](https://github.com/i18next/i18next-localstorage-backend)

The chained plugin allows us to chain together backend plugins so we can specify load strategies for our translations, i18next-http-backend allows you to load translations via fetch or XMLHttpRequest and finally i18next-localstorage-backend allows us to cache and then subsequently load our translations from localstorage. If your translation responses are sending a Cache-Control header, you may not need the i18next-localstorage-backend and i18next-chained-backend plugin.

Please read the i18next [Add or Load Translations docs](https://www.i18next.com/how-to/add-or-load-translations) and [Caching docs](https://www.i18next.com/how-to/caching) in order to see how to setup and use backend plugins. The config used in this example is shown below.

This approach is also handled in [this blog post](https://locize.com/blog/next-i18next/).

```js
const HttpBackend = require('i18next-http-backend/cjs')
const ChainedBackend= require('i18next-chained-backend').default
const LocalStorageBackend = require('i18next-localstorage-backend').default

module.exports = {
  backend: {
    backendOptions: [{ expirationTime: 60 * 60 * 1000 }, { /* loadPath: 'https:// somewhere else' */ }], // 1 hour
    backends: typeof window !== 'undefined' ? [LocalStorageBackend, HttpBackend]: [],
  },
  // debug: true,
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de'],
  },
  serializeConfig: false,
  use: typeof window !== 'undefined' ? [ChainedBackend] : [],
}
```

The config specifies that on the server we use the default load methods specified with `next-i18next` but on the browser we load the ChainedBackend plugin which then firstly tries to load translations from localstorage, if they dont exist there then it falls back to the HttpBackend which then will query them from our backend and then pass them back to the localStorage backend which then caches them for reuse.

## Setup

### 1. Installation

Yarn
```
yarn add next-i18next react-i18next i18next i18next-chained-backend i18next-http-backend i18next-localstorage-backend
```

npm
```
npm i --save next-i18next react-i18next i18next i18next-chained-backend i18next-http-backend i18next-localstorage-backend
```

### 2. Setup next-i18next

Setup `next-i18next` as described in the [README](https://github.com/i18next/next-i18next/blob/master/README.md#2-translation-content)

### 3. Pass your config as an override config to the appWithTranslation HOC

This step is necessary as usually when server rendering/loading your translations `next-i18next` will load your config from the pageProps but seen as you're not using `getServerSideProps` or `getStaticProps` here you'll need another way to load your config into the I18nProvider

```tsx
import { appWithTranslation } from 'next-i18next'
import nextI18nConfig from '../next-i18next.config'

const MyApp = ({ Component, pageProps }) => (
  <Component {...pageProps} />
);

export default appWithTranslation(MyApp, nextI18nConfig);
```

### 4. Setup your client rendered pages/components

Use the `ready` property from `useTranslation` to ensure the i18next instance is ready and that your translations are loaded to avoid the user seeing bare translation keys, below is a very simplistic example of this.

ADVICE: I suggest you don't use this client-side only approach, but use the lazy-reload approach (below) instead!

```jsx
// getServerSideProps and getStaticProps are not used (no serverSideTranslations method)
const ClientPage = () => {
  const { t, ready } = useTranslation('client-page')

  return (
    <>
      <main>
        <Text>{ready ? t('h1') : ''}</Text>
      </main>
      <Footer />
    </>
  )
}

export default ClientPage
```

This will work, but the server side rendered part will probably not include the translated texts (not really SEO friendly).
<br />
To fix this, use the lazy-reload approach.

### Alternative usage (the preferred way)

You might see a warning like this: `Expected server HTML to contain a matching text node for...`
<br />
Or your delivered server side rendered page, might not include the translated texts.

This can be optimized by keeping the `getServerSideProps` or `getStaticProps` function and making use of the `reloadResources` functionality of i18next.

This way the ready check is also not necessary, because the translations served directly by the server are used. And as soon the translations are reloaded, new translations are shown.

This can be prevented by keeping the `getServerSideProps` or `getStaticProps` function but making use of the [`reloadResources`](https://www.i18next.com/overview/api#reloadresources) functionality of i18next.


```javascript
const LazyReloadPage = () => {

  const { t, i18n } = useTranslation(['lazy-reload-page', 'footer'], { bindI18n: 'languageChanged loaded' })
  // bindI18n: loaded is needed because of the reloadResources call
  // if all pages use the reloadResources mechanism, the bindI18n option can also be defined in next-i18next.config.js
  useEffect(() => {
    i18n.reloadResources(i18n.resolvedLanguage, ['lazy-reload-page', 'footer'])
  }, [])

  return (
    <>
      <main>
        <Header heading={t('h1')} title={t('title')} />
        <Link href='/'>
          <button
            type='button'
          >
            {t('back-to-home')}
          </button>
        </Link>
      </main>
      <Footer />
    </>
  )
}

export const getStaticProps = async ({ locale }) => ({
  props: {
    ...await serverSideTranslations(locale, ['lazy-reload-page', 'footer']),
  },
})

export default LazyReloadPage
```

This way the translations served directly by the server are used. And as soon the translations are reloaded, new translations are shown.
