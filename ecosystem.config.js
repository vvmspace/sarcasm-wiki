module.exports = {
  apps: [
    {
      name: 'sarcasm-wiki-dev',
      script: 'npm',
      args: 'run dev',
      cwd: './',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: true,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 5000,
      wait_ready: false,
      listen_timeout: 10000,
      env: {
        NODE_ENV: 'development',
      },
      ignore_watch: [
        'node_modules',
        '.next',
        'test-results',
        'playwright-report',
        '*.test.ts',
        '*.test.js',
        'logs',
        'ecosystem.config.js',
      ],
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
    },
  ],
};

