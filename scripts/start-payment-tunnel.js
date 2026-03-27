#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const localtunnel = require('localtunnel');

const DEFAULT_PORT = 3001;
const rootDir = path.resolve(__dirname, '..');
const rootEnvPath = path.join(rootDir, '.env');

function printHelp() {
  console.log(`Easyhome payment tunnel

Usage:
  npm run backend:tunnel

Optional environment variables:
  PAYMENT_BACKEND_PORT   Local backend port to expose. Defaults to ${DEFAULT_PORT}.
  LOCALTUNNEL_SUBDOMAIN  Request a specific localtunnel subdomain.
  LOCALTUNNEL_HOST       Override the upstream localtunnel host.

This command writes EXPO_PUBLIC_API_BASE_URL to the root .env file.
Keep the process running while testing payments.`);
}

function resolvePort() {
  const rawValue = process.env.PAYMENT_BACKEND_PORT?.trim();

  if (!rawValue) {
    return DEFAULT_PORT;
  }

  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid PAYMENT_BACKEND_PORT: ${rawValue}`);
  }

  return parsed;
}

function updateRootEnv(url) {
  const nextEntry = `EXPO_PUBLIC_API_BASE_URL=${url}`;
  const existing = fs.existsSync(rootEnvPath) ? fs.readFileSync(rootEnvPath, 'utf8') : '';
  const lines = existing ? existing.split(/\r?\n/) : [];
  let replaced = false;

  const nextLines = lines.map((line) => {
    if (line.startsWith('EXPO_PUBLIC_API_BASE_URL=')) {
      replaced = true;
      return nextEntry;
    }

    return line;
  });

  if (!replaced) {
    if (nextLines.length > 0 && nextLines[nextLines.length - 1] !== '') {
      nextLines.push('');
    }

    nextLines.push(nextEntry);
  }

  const normalized = nextLines.filter((line, index, allLines) => {
    return !(index === allLines.length - 1 && line === '');
  });

  fs.writeFileSync(rootEnvPath, `${normalized.join('\n')}\n`, 'utf8');
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printHelp();
    return;
  }

  const port = resolvePort();
  const options = { port };
  const requestedSubdomain = process.env.LOCALTUNNEL_SUBDOMAIN?.trim();
  const requestedHost = process.env.LOCALTUNNEL_HOST?.trim();

  if (requestedSubdomain) {
    options.subdomain = requestedSubdomain;
  }

  if (requestedHost) {
    options.host = requestedHost;
  }

  console.log(`[tunnel] Opening localtunnel for http://127.0.0.1:${port}`);
  console.log('[tunnel] Start `npm run backend:start` in another terminal if the payment server is not already running.');

  const tunnel = await localtunnel(options);
  let tunnelClosed = false;

  const closeTunnel = () => {
    if (tunnelClosed) {
      return;
    }

    tunnelClosed = true;
    tunnel.close();
  };

  updateRootEnv(tunnel.url);

  console.log(`[tunnel] Public URL: ${tunnel.url}`);
  console.log(`[tunnel] Wrote EXPO_PUBLIC_API_BASE_URL to ${rootEnvPath}`);
  console.log('[tunnel] Restart Expo after this URL changes so the app picks up the new backend endpoint.');
  console.log('[tunnel] Keep this terminal open while testing the Interswitch flow.');

  tunnel.on('request', (info) => {
    if (!info || typeof info !== 'object') {
      return;
    }

    const method = typeof info.method === 'string' ? info.method : 'REQUEST';
    const requestPath = typeof info.path === 'string' ? info.path : '/';
    console.log(`[tunnel] ${method} ${requestPath}`);
  });

  tunnel.on('error', (error) => {
    console.error(`[tunnel] ${error instanceof Error ? error.message : String(error)}`);
  });

  tunnel.on('close', () => {
    if (!tunnelClosed) {
      tunnelClosed = true;
      console.log('[tunnel] Closed.');
    }
  });

  const shutdown = () => {
    closeTunnel();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error(`[tunnel] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});