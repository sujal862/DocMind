// PM2 process manager config
// PM2:Keeps your apps running 24/7, Auto-restarts if they crash, Runs multiple services easily
// cmd : pm2 start ecosystem.config.js : auto start both backend and frontend
module.exports = {
  apps: [
    {
      name: "docmind-backend",
      cwd: "./backend",
      script: "app/main.py",
      interpreter: "/home/ubuntu/DocMind/backend/venv/bin/python",
      env: {
        PORT: 8000,
      },
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,
    },
    {
      name: "docmind-frontend",
      cwd: "./frontend",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      env: {
        NODE_ENV: "production",
        NEXT_PUBLIC_API_URL: "/api",
      },
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
