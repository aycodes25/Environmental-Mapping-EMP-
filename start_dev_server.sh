#!/bin/bash

MONGO_URL="mongodb://localhost:27017/emp-prod-copy" NODE_ENV=development  tsx watch src/index.ts
