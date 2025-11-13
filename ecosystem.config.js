module.exports = {
  apps: [
    {
      name: 'sarcasm-wiki-dev',
      script: 'npm',
      args: 'run dev',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: true,
      max_memory_restart: '1G',
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
      ],
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
    },
  ],
};

