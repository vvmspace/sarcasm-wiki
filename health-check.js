const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const PING_URL = process.env.PING_URL || 'https://sarcasm.wiki/';
const PING_INTERVAL = parseInt(process.env.PING_INTERVAL || '3600', 10) * 1000;
const PM2_APP_NAME = process.env.PM2_APP_NAME || 'sarcasm-wiki-dev';
const TIMEOUT = 10000;

function checkHealth() {
  return new Promise((resolve, reject) => {
    const url = new URL(PING_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'PM2-Health-Check/1.0',
      },
    };

    const req = https.request(options, (res) => {
      const statusCode = res.statusCode;
      resolve(statusCode);
    });

    req.setTimeout(TIMEOUT, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function restartApp() {
  try {
    console.log(`[${new Date().toISOString()}] Restarting ${PM2_APP_NAME}...`);
    const { stdout, stderr } = await execAsync(`pm2 restart ${PM2_APP_NAME}`);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.log(`[${new Date().toISOString()}] Restart command executed`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Failed to restart app:`, error.message);
  }
}

async function performHealthCheck() {
  try {
    const statusCode = await checkHealth();
    const timestamp = new Date().toISOString();
    
    if (statusCode === 200) {
      console.log(`[${timestamp}] Health check OK: ${PING_URL} returned ${statusCode}`);
    } else {
      console.error(`[${timestamp}] Health check FAILED: ${PING_URL} returned ${statusCode}`);
      await restartApp();
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Health check ERROR:`, error.message);
    await restartApp();
  }
}

console.log(`[${new Date().toISOString()}] Health check started`);
console.log(`[${new Date().toISOString()}] URL: ${PING_URL}`);
console.log(`[${new Date().toISOString()}] Interval: ${PING_INTERVAL / 1000}s`);
console.log(`[${new Date().toISOString()}] PM2 App: ${PM2_APP_NAME}`);

performHealthCheck();

setInterval(performHealthCheck, PING_INTERVAL);

process.on('SIGTERM', () => {
  console.log(`[${new Date().toISOString()}] Health check stopped`);
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log(`[${new Date().toISOString()}] Health check stopped`);
  process.exit(0);
});

