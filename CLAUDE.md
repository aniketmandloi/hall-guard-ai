# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

- **Development**: `npm run dev` or `pnpm dev` (uses --turbopack for faster builds)
- **Build**: `npm run build`
- **Start**: `npm start`
- **Lint**: `npm run lint`
- **Database migrations**: `npx prisma migrate dev`
- **Database studio**: `npx prisma studio`
- **Generate Prisma client**: `npx prisma generate`

## Architecture Overview

This is a Next.js 15 SaaS starter kit with the following architecture:

### Core Stack

- **Frontend**: Next.js 15 with TypeScript, App Router
- **Styling**: Tailwind CSS with Shadcn/ui components
- **Authentication**: Clerk with social login support
- **Database**: PostgreSQL via Supabase with Prisma ORM
- **Payments**: Polar.sh integration for subscriptions
- **AI**: Multiple AI providers (Anthropic, OpenAI, Groq, DeepSeek) via Vercel AI SDK

### Directory Structure

- `app/` - Next.js App Router with grouped routes:
  - `(auth)/` - Authentication pages (sign-in, sign-up, user-profile)
  - `(pages)/` - Main application pages (dashboard, pricing, playground)
  - `api/` - API routes for webhooks and chat functionality
- `components/` - Reusable React components using Shadcn/ui
- `lib/` - Utility functions and configurations
- `prisma/` - Database schema and migrations

### Key Features

- **Authentication Flow**: Clerk handles authentication with webhooks to sync user data
- **Subscription Management**: Polar.sh integration with webhook handling for subscription events
- **AI Chat**: Playground feature with multiple AI provider support
- **Dashboard**: User dashboard with finance, projects, and settings sections

### Database Models

- **User**: Core user data synced from Clerk
- **Subscription**: Polar.sh subscription tracking with detailed billing info
- **Invoice**: Invoice tracking for billing history
- **SubscriptionPlan**: Plan configuration storage

### Environment Variables Required

Key variables needed for development (see .env.template):

- Clerk keys for authentication
- Supabase database URLs
- Polar.sh credentials for payments
- AI provider API keys

### Important Patterns

- Route groups in App Router for organized structure
- Webhook handling for external service integrations
- Type-safe database queries with Prisma
- Component composition with Shadcn/ui patterns
