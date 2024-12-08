#!/bin/bash

NODE_ENV=development PORT=8000 \
    MONGO_URL=mongodb://localhost:27017/emp \
    JWT_SECRET_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6 \
    npm run dev
