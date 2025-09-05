# Next.js SaaS Starter Kit 🚀

A modern, production-ready SaaS starter kit built with Next.js 14, TypeScript, Tailwind CSS, Prisma, and more.

## Features ✨

- **🔐 Authentication & Authorization**

  - Secure authentication with [Clerk](https://clerk.com)
  - Social login support
  - Role-based access control

- **💾 Database & ORM**

  - PostgreSQL with [Supabase](https://supabase.com)
  - Type-safe queries with [Prisma](https://prisma.io)
  - Automatic migrations and schema management

- **🎨 UI/UX**

  - Modern UI with [Tailwind CSS](https://tailwindcss.com)
  - Dark mode support
  - Responsive design
  - Shadcn UI components

- **⚡ Performance**
  - Server-side rendering
  - Edge runtime support
  - Optimized images and assets
  - API route handlers

## Tech Stack 🛠️

- [Next.js 14](https://nextjs.org) - React framework
- [TypeScript](https://www.typescriptlang.org) - Type safety
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Prisma](https://prisma.io) - Database ORM
- [Clerk](https://clerk.com) - Authentication
- [Supabase](https://supabase.com) - Database
- [Vercel](https://vercel.com) - Deployment

## Getting Started 🏁

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- PostgreSQL database (we use Supabase)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/aniketmandloi/saas-starter-kit.git
cd saas-starter-kit
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Update `.env` with your credentials:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

CLERK_WEBHOOK_SECRET=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

SUPABASE_URL=
SUPABASE_SERVICE_KEY=

DATABASE_URL=
DIRECT_URL=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

FRONTEND_URL=http://localhost:3000/
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Polar.sh Configuration
POLAR_ACCESS_TOKEN=your_polar_access_token
POLAR_WEBHOOK_SECRET=your_polar_webhook_secret
POLAR_SERVER_URL=sandbox

# Polar Product IDs (replace with your actual product IDs from Polar dashboard)
NEXT_PUBLIC_POLAR_BASIC_PRODUCT_ID=your_basic_product_id
NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID=your_pro_product_id
NEXT_PUBLIC_POLAR_ENTERPRISE_PRODUCT_ID=your_enterprise_product_id
```

5. Run database migrations:

```bash
npx prisma migrate dev
```

6. Start the development server:

```bash
pnpm dev
```

Visit `http://localhost:3000` to see your application.

## Deployment 🚀

This project is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Import your repository to Vercel
3. Set up your environment variables
4. Deploy!
