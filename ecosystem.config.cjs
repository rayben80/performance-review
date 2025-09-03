module.exports = {
  apps: [
    {
      name: 'webapp',
      script: 'npx',
      args: 'wrangler pages dev dist --ip 0.0.0.0 --port 5000',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}