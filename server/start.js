const { spawnSync } = require('child_process');
const path = require('path');

const migrate = spawnSync(process.execPath, [path.join(__dirname, 'migrate.js')], {
  cwd: __dirname,
  stdio: 'inherit',
  env: process.env,
});

if (migrate.status !== 0) {
  process.exit(migrate.status || 1);
}

require('./index');
