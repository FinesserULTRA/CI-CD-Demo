/**
 * PM2 ecosystem config: Flask (Gunicorn) + frontend static/server
 * Usage: pm2 start ecosystem.config.cjs
 */
module.exports = {
  apps: [
    {
      name: 'life-dashboard-api',
      cwd: './backend',
      script: '.venv/bin/python',
      args: '-m gunicorn -w 2 -b 0.0.0.0:5000 app:app',
      interpreter: 'none',
      env: { FLASK_ENV: 'production' },
      autorestart: true,
      watch: false,
    },
    {
      name: 'life-dashboard-web',
      cwd: './frontend',
      script: 'npx',
      args: 'serve -s dist -l 3000',
      interpreter: 'none',
      autorestart: true,
      watch: false,
    },
  ],
};
