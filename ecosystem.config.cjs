// PM2 Ecosystem Configuration
// PM2 프로세스 관리를 위한 설정 파일

module.exports = {
  apps: [
    {
      name: 'webapp',
      script: 'python3',
      args: '-m http.server 3000 --bind 0.0.0.0',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false, // 파일 변경 감시 비활성화 (정적 파일 서버이므로)
      instances: 1,
      exec_mode: 'fork',
      
      // 로그 설정
      log_file: './logs/webapp.log',
      out_file: './logs/webapp-out.log',
      error_file: './logs/webapp-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      
      // 프로세스 재시작 설정
      autorestart: true,
      max_restarts: 5,
      min_uptime: '10s',
      max_memory_restart: '150M',
      
      // 서버 설정
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      }
    }
  ]
};