import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
if (!existsSync('.env')) {
  const template = readFileSync('.env.example', 'utf8')
  writeFileSync('.env', template.replace('PAYLOAD_SECRET=\n', `PAYLOAD_SECRET=${randomBytes(48).toString('hex')}\n`))
  console.log('Created .env with a unique local secret. No default admin password is installed.')
} else console.log('.env already exists; left unchanged.')
