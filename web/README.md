# TahfidzFlow Web App

This directory contains the Next.js application for TahfidzFlow.

For full project documentation — features, setup, data model, environment variables, deployment, and more — see the **[root README](../README.md)**.

## Quick Start

```bash
npm install
cp .env.example .env   # Edit: set DATABASE_URL and AUTH_SECRET
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login).
