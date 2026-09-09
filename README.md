# EMP Backend — Environmental Mapping Platform API

RESTful API backend for the Environmental Mapping Platform (EMP), powering 3D facility model management, environmental sampling coordinates, incident tracking, and compliance reporting.

---

## Table of Contents

- [Overview & Tech Stack](#overview--tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
  - [Environment Variables Reference](#environment-variables-reference)
- [Running the Project](#running-the-project)
  - [Development Mode](#development-mode)
  - [Production Build & Run](#production-build--run)
- [Database & Seeding](#database--seeding)
- [Deployment (Vercel)](#deployment-vercel)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Overview & Tech Stack

- **Runtime**: Node.js (LTS recommended, v18+)
- **Language**: TypeScript (`tsc`)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose (8.x)
- **Authentication**: JWT (JSON Web Tokens) with role-based access control & TOTP (2FA via Speakeasy)
- **File Storage**: AWS S3 (`aws-sdk`)
- **Email Delivery**: Nodemailer (Gmail / SMTP)
- **Deployment**: Vercel Serverless / Docker

---

## Prerequisites

Ensure you have the following installed on your machine:

- **Node.js**: v18 or higher ([nodejs.org](https://nodejs.org/))
- **npm**: Distributed with Node.js
- **Git**: For version control ([git-scm.com](https://git-scm.com/))
- **MongoDB**: Local MongoDB instance or [MongoDB Atlas](https://www.mongodb.com/atlas) cloud cluster

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/aycodes25/Environmental-Mapping-EMP-.git
cd Environmental-Mapping-EMP-
```

### 2. Install Dependencies

```bash
npm install
```

---

## Environment Configuration

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

### Environment Variables Reference

Replace all placeholder values with your actual service credentials:

```env
# ==============================================================================
# Server Configuration
# ==============================================================================
NODE_ENV=development
PORT=8000

# ==============================================================================
# Database Configuration (MongoDB Atlas or Local MongoDB)
# ==============================================================================
# Replace <username>, <password>, and <cluster-url> with your MongoDB Atlas details
MONGO_URL=mongodb+srv://<username>:<password>@<cluster-url>/env-mapping?retryWrites=true&w=majority

# ==============================================================================
# AWS S3 Bucket Configuration (Evidence & Model Assets)
# ==============================================================================
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
S3_BUCKET_NAME=emp-bucket-new

# ==============================================================================
# Frontend Application URL (Used for CORS and email verification/password reset links)
# ==============================================================================
# Local: http://localhost:5173 | Production: https://your-frontend.vercel.app
FRONTEND_URL=http://localhost:5173

# ==============================================================================
# Email Service Configuration (Nodemailer)
# ==============================================================================
EMAIL_SERVICE=gmail
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
# For Gmail, generate a 16-character App Password at: https://myaccount.google.com/apppasswords
EMAIL_PASSWORD=your_gmail_app_password

# ==============================================================================
# Authentication & JWT Security Secrets
# ==============================================================================
# Generate secure random strings (e.g., using openssl rand -hex 32)
JWT_SECRET=your_jwt_secret_key
JWT_SECRET_KEY=your_jwt_secret_key
JWT_LIFETIME=30d
JWT_ACCESS_LIFETIME=30d

# Token secrets for account verification and password reset workflows
EMAIL_VERIFICATION_SECRET=your_email_verification_secret_key
RESET_PASSWORD_SECRET=your_reset_password_secret_key
```

> [!WARNING]
> Never commit `.env` or `.env.development` files to version control. Ensure they are listed in `.gitignore`.

---

## Running the Project

### Development Mode

Runs the TypeScript compiler in watch mode with `nodemon`:

```bash
npm run dev
```

The server will start on `http://localhost:8000`. Any code changes in `src/` will trigger an automatic restart.

### Production Build & Run

To compile TypeScript to JavaScript and run the production bundle:

```bash
# Compile TypeScript to dist/
npm run build

# Start the compiled production server
npm start
```

---

## Database & Seeding

When running in `development` mode (`NODE_ENV=development`), the application automatically checks for the default superadmin account and seeds it if it does not already exist.

- **Default Superadmin Email**: `superadmin@mail.com`
- **Default Superadmin Password**: `superadmin`


> [!IMPORTANT]
> Make sure to update the default credentials immediately in a production environment.

---

## Deployment (Vercel)

This repository includes a `vercel.json` configuration for serverless deployment on Vercel:

1. Connect the repository to Vercel.
2. In the Vercel Project Settings, navigate to **Environment Variables** and add all variables from the [Environment Variables Reference](#environment-variables-reference) section above.
3. Deploy! Vercel will automatically trigger builds on push to the `main` branch.

---

## Project Structure

```
├── src/
│   ├── index.ts                # Application entrypoint
│   ├── app.ts                  # Express application setup & middleware
│   ├── middlewares/            # Auth, validation, error handling middlewares
│   ├── resources/              # Modular resource controllers, services, models
│   │   ├── users/              # User auth, profile, and role management
│   │   ├── models/             # 3D facility model management
│   │   ├── tags/               # Tagging system (coordinates & classifications)
│   │   ├── samples/            # Sampling records & evidence
│   │   ├── incidents/          # Incident tracking
│   │   ├── notifications/      # Real-time notifications
│   │   └── ...                 # Feedback, comments, locations
│   └── utils/                  # AWS S3, mailer, JWT, and helper utilities
├── vercel.json                 # Vercel serverless deployment config
├── tsconfig.json               # TypeScript configuration
└── package.json                # Project dependencies and npm scripts
```

---

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature-name`).
3. Commit your changes (`git commit -m 'feat: add new feature'`).
4. Push to the branch (`git push origin feature/your-feature-name`).
5. Open a Pull Request.

---

## License

ISC License
