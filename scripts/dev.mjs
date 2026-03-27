import { spawn } from 'node:child_process'

const children = []

const spawnProcess = (command, args, name) => {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  child.on('exit', (code) => {
    if (code !== 0) {
      process.exitCode = code ?? 1
    }

    for (const other of children) {
      if (other !== child && !other.killed) {
        other.kill()
      }
    }
  })

  children.push(child)
  return child
}

spawnProcess('node', ['--env-file=.env', 'server.mjs'], 'api')
spawnProcess('vite', [], 'web')

const shutdown = () => {
  for (const child of children) {
    if (!child.killed) {
      child.kill()
    }
  }
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
