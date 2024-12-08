
# EMP-BACKEND

## Table of Contents

- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Project](#running-the-project)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Introduction

Briefly describe your project, what it does, and its key features.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- **Node.js**: Make sure you have Node.js installed. You can download it from [nodejs.org](https://nodejs.org/).
- **npm**: npm is distributed with Node.js, which means that when you download Node.js, you automatically get npm installed.
- **Git**: You should have Git installed to clone the repository. You can download it from [git-scm.com](https://git-scm.com/).

## Installation

Follow these steps to set up and run the project:

### Step 1: Clone the Repository

Open your terminal and run the following command:

```bash
git clone https://github.com/OrionLabsTest/environmental-mapping-web-backend-001.git
```

### Step 2: Navigate to the Project Directory

Change to the project directory:

```bash
cd environmental-mapping-web-backend-001
```

### Step 3: Install Dependencies

Install the project dependencies using npm:

```bash
npm install
```

This command will read the `package.json` file and install the dependencies listed under `dependencies` and `devDependencies`.

## Configuration

If your project requires configuration, describe the steps needed here.

### Environment Variables

Create a `.env` file in the root directory of the project and add the necessary environment variables. Here is an example:

```
NODE_ENV=development
PORT=8000

MONGO_URL=mongodb+srv://developer001:1CRgXxmpb1VI26nN@oriondev00.ir7zrz7.mongodb.net/env-mapping-staging?retryWrites=true&w=majority&appName=oriondev00


# s3 bucket config
AWS_ACCESS_KEY_ID= "xxxxxxxxx"
AWS_SECRET_ACCESS_KEY= "xxxxx"

S3_BUCKET_NAME= 'emp-bucket-new'

# needed for reset password
FRONTEND_URL=https://environmental-mapping-web-frontend-001.vercel.app



# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-email-password



# JWT Configuration
JWT_SECRET=bfba35717a6977aeaa9826f1519cf1b82e266fcfae93ae19dd593f17c6b7d560
JWT_SECRET_KEY=bfba35717a6977aeaa9826f1519cf1b82e266fcfae93ae19dd593f17c6b7d560
JWT_LIFETIME=30d
JWT_ACCESS_LIFETIME=30d
EMAIL_VERIFICATION_SECRET=8b6043bd9f65af46eff3a3a7042e399720c9adc563efe4b576c4b0530fd99a2c
RESET_PASSWORD_SECRET=eb3028f528786eef8fee1a3a206b7c4b97b1d0e4fa58158e656c98f1edb41582
```

Make sure to replace the values with your actual configuration.

## Running the Project

### Development Server

To run the project in development mode, use the following command:

```bash
npm run dev
```

This command will start the development server and reload the server whenever you make changes to the source code.

### Production Server

To run the project in production mode, use the following command:

```bash
npm run build
npm run start
```

This command will start the server in production mode, typically without automatic reloading and with optimizations enabled.

### Seeding SuperAdmin User

To seed the SuperAdmin user, run the following command:

```bash
curl -X GET http://localhost:8000/api/user/seed-super-admin
```

This is the sample response after seeding the SuperAdmin user:

```js
{
    "message": "SuperAdmin seeded successfully.",
    "user": {
        "username": "superAdmin",
        "fullname": "Super Admin",
        "password": "$2a$10$Zfnqr/WLhDK9mYwOFgCi9OX.q0/S5QW3Ao1UGzMuxRxa81IBv9rka",
        "email": "superAdmin@example.com",
        "role": "superAdmin",
        "isVerified": true,
        "models": [],
        "twoFactorAuth": {
            "enabled": false
        },
        "_id": "66d1ccbc49cf6dcf718906c9",
        "createdAt": "2024-08-30T13:44:28.964Z",
        "updatedAt": "2024-08-30T13:44:28.964Z",
        "__v": 0
    }
}
```

After seeding the Super Admin you can then change your password from the frontend of the application

## Troubleshooting

List common issues and how to resolve them.

### Common Issue 1: Port Already in Use

If you get an error that the port is already in use, you can change the port number in your `.env` file or specify a different port when starting the server:

```bash
PORT=3001 npm start
```

### Common Issue 2: Module Not Found

If you encounter a "module not found" error, ensure all dependencies are installed correctly by running:

```bash
npm install
```

If the problem persists, try removing the `node_modules` directory and reinstalling:

```bash
rm -rf node_modules
npm install
```

## Contributing

Describe how others can contribute to your project.

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature/your-feature`).
6. Open a pull request.
