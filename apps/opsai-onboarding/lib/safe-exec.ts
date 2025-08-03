// Safe execution utilities that avoid shell injection vulnerabilities
import { spawn } from 'child_process'
import { promisify } from 'util'

interface ExecOptions {
  cwd?: string
  env?: NodeJS.ProcessEnv
  timeout?: number
}

interface ExecResult {
  stdout: string
  stderr: string
  exitCode: number
}

// Safe command execution that prevents shell injection
export async function safeExec(
  command: string,
  args: string[] = [],
  options: ExecOptions = {}
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      shell: false, // Disable shell to prevent injection
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('error', (error) => {
      reject(new Error(`Failed to execute ${command}: ${error.message}`))
    })

    child.on('close', (code) => {
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code || 0,
      })
    })

    // Handle timeout
    if (options.timeout) {
      setTimeout(() => {
        child.kill('SIGTERM')
        reject(new Error(`Command timed out after ${options.timeout}ms`))
      }, options.timeout)
    }
  })
}

// Specific safe wrappers for common operations
export async function npmInstall(cwd: string): Promise<void> {
  const result = await safeExec('npm', ['install'], { cwd, timeout: 300000 }) // 5 min timeout
  if (result.exitCode !== 0) {
    throw new Error(`npm install failed: ${result.stderr}`)
  }
}

export async function runTypeCheck(cwd: string): Promise<void> {
  const result = await safeExec('npx', ['tsc', '--noEmit'], { cwd, timeout: 60000 }) // 1 min timeout
  if (result.exitCode !== 0) {
    throw new Error(`TypeScript check failed: ${result.stderr}`)
  }
}

export async function runLint(cwd: string): Promise<void> {
  const result = await safeExec('npx', ['next', 'lint'], { cwd, timeout: 60000 }) // 1 min timeout
  if (result.exitCode !== 0) {
    throw new Error(`Linting failed: ${result.stderr}`)
  }
}

// Check if a command exists
export async function commandExists(command: string): Promise<boolean> {
  try {
    const result = await safeExec('which', [command])
    return result.exitCode === 0
  } catch {
    return false
  }
}