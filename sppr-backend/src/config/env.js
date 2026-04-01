import dotenv from 'dotenv';

dotenv.config();

const requiredEnvs = [
  'PORT',
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
];

requiredEnvs.forEach((envName) => {
  if (!process.env[envName]) {
    throw new Error(`Environment variable ${envName} is missing`);
  }
});

export const env = {
  port: process.env.PORT || 5000,
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
  },
};
