const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch only the workspace packages source folder, NOT the full monorepo root.
// Watching monorepoRoot causes Metro's FallbackWatcher to scan node_modules and
// race against pnpm's temp dirs (baseline-browser-mapping_tmp_<PID>_N).
config.watchFolders = [
  path.resolve(monorepoRoot, 'packages'),
];

// Resolve packages from the app's own node_modules first, then the monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Block pnpm lifecycle temp directories from the resolver
config.resolver.blockList = [
  /.*_tmp_\d+_\d+.*/,
];

module.exports = config;
