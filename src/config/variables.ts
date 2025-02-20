import dotenv from "dotenv"
dotenv.config()

interface Config {
  NODE_ENV?: string
  PORT?: string
  MONGO_URL: string
  AWS_ACCESS_KEY_ID?: string
  AWS_SECRET_ACCESS_KEY?: string
  S3_BUCKET_NAME?: string
  FRONTEND_URL?: string
  EMAIL_SERVICE?: string
  EMAIL_PORT?: string
  EMAIL_USER?: string
  EMAIL_PASSWORD?: string
  JWT_SECRET?: string
  JWT_LIFETIME?: string
  JWT_SECRET_KEY?: string
  JWT_ACCESS_LIFETIME?: string
  EMAIL_VERIFICATION_SECRET?: string
  RESET_PASSWORD_SECRET?: string
}

const config: Config = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  MONGO_URL: process.env.MONGO_URL || "",
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
  FRONTEND_URL: process.env.FRONTEND_URL,
  EMAIL_SERVICE: process.env.EMAIL_SERVICE,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_LIFETIME: process.env.JWT_LIFETIME, 
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
  JWT_ACCESS_LIFETIME: process.env.JWT_ACCESS_LIFETIME,
  EMAIL_VERIFICATION_SECRET: process.env.EMAIL_VERIFICATION_SECRET,
  RESET_PASSWORD_SECRET: process.env.RESET_PASSWORD_SECRET,
}

export default config
