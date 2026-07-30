import { spawn } from 'child_process';
import path from 'path';

function run(command: string, args: string[], timeoutMs: number) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`ZIP extraction timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(stderr || `${command} exited with code ${code}`));
    });
  });
}

export async function extractZip(zipPath: string, destinationDir: string, timeoutMs = 60000) {
  const absoluteZip = path.resolve(zipPath);
  const absoluteDestination = path.resolve(destinationDir);

  if (process.platform === 'win32') {
    await run(
      'powershell',
      ['-NoProfile', '-Command', `Expand-Archive -LiteralPath ${JSON.stringify(absoluteZip)} -DestinationPath ${JSON.stringify(absoluteDestination)} -Force`],
      timeoutMs
    );
    return;
  }

  try {
    await run('unzip', ['-q', absoluteZip, '-d', absoluteDestination], timeoutMs);
  } catch (error: any) {
    throw new Error(`Không thể giải nén file ZIP. Hãy đảm bảo runtime có cài unzip. ${error.message || error}`);
  }
}
