import { spawnSync } from 'node:child_process'
const result = spawnSync(process.execPath, ['node_modules/payload/bin.js', 'migrate:create', process.argv[2] || 'archive', '--skip-empty'], {
  stdio: 'inherit', env: { ...process.env, GENERATE_POSTGRES_MIGRATIONS: '1' },
})
process.exit(result.status || 0)
