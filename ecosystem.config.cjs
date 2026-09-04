module.exports = {
  apps: [
    {
      name: "rsm-e-invoicing",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "rsm-e-invoicing-incomplete-cron",
      script: "scripts/run-incomplete-cron.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: false,
      cron_restart: "*/5 * * * *",
      env: {
        NODE_ENV: "production",
        CRON_BASE_URL: "http://127.0.0.1:3000",
      },
    },
  ],
};
