const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer.
  // This is required for Render deployments to ensure the Chrome binary
  // is downloaded inside the project directory and persists between the build and run phases.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
