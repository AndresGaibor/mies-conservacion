module.exports = {
  apps: [
    {
      name: 'mies-conservacion',
      script: 'bun',
      args: 'run src/server.ts',
      cwd: '/Users/andresgaibor/code/javascript/mies-conservacion',
      instances: 1,
      exec_mode: 'fork',
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
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,
      kill_timeout: 5000,
      listen_timeout: 3000
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
