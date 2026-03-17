module.exports = {
  apps: [
    {
      name: 'quiz-app',
      script: 'index.js',
      instances: 4, // use all CPU cores
      exec_mode: 'cluster', // enable cluster mode

      env: {
        NODE_ENV: 'development',
      },

      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
