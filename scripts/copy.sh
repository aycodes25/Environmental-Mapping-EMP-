#!/bin/bash

# Copy deployment artifacts into dist
cp .env ./dist
cp serverless.yml ./dist
cp -R node_modules ./dist

