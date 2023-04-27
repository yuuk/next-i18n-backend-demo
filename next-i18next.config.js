const HttpBackend = require("i18next-http-backend/cjs");

const isDev = process.env.NODE_ENV === "development";

module.exports = {
  debug: isDev,
  backend: {
    loadPath: "http://localhost:3000/api/locales?lng={{lng}}&ns={{ns}}",
    addPath: "http://localhost:3000/api/locales?lng={{lng}}&ns={{ns}}",
    requestOptions: {
      mode: "no-cors",
      cache: "default",
    },
  },
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  serializeConfig: false,
  use: [HttpBackend],
};
