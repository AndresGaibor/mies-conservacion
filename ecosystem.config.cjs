module.exports = {
  apps: [
    {
      name: 'mies-conservacion',
      script: './dist/server.js',
      cwd: process.cwd(),
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: `${process.cwd()}/logs/err.log`,
      out_file: `${process.cwd()}/logs/out.log`,
      log_file: `${process.cwd()}/logs/combined.log`,
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      merge_logs: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ],

  deploy: {
    production: {
      user: 'node',
      host: 'tu-servidor.com',
      ref: 'origin/main',
      repo: 'git@github.com:tu-usuario/mies-conservacion.git',
      path: '/var/www/mies-conservacion',
      'pre-deploy-local': '',
      'post-deploy': 'bun install && bun run build && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': ''
    }
  }
};
