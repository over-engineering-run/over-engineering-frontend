/**
 * @type {import('@remix-run/dev').AppConfig}
 */
module.exports = {
  serverDependenciesToBundle: [
    "recharts",
    /^d3-*/,
    "internmap",
    "@sindresorhus/is",
    "ky",
  ],
  cacheDirectory: "./node_modules/.cache/remix",
  ignoredRouteFiles: ["**/.*", "**/*.css", "**/*.test.{js,jsx,ts,tsx}"],
};
