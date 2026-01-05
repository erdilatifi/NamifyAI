 # NamifyAI
 
 NamifyAI is a full-stack web app that helps people generate *brandable* business names with AI, quickly validate whether related domains are likely available, and save the best ideas to a personal history.
 
 It also includes authentication, password reset by email, and a simple subscription system (Free vs Pro) that controls monthly generation limits.
 
 ![NamifyAI Poster](./public/namifyPoster.png)
 
 ## Demo video
 
 [Watch the demo (Google Drive)](https://drive.google.com/file/d/1QfZpck47MqqNbtTA7q5kfgVQPiSAWX6_/view?usp=sharing)
 
 ## Purpose
 
 When you’re naming a project, you usually need:
 
 - **Fast iterations** on name ideas.
 - **Consistency** with an industry and tone (professional, playful, etc.).
 - **A way to track** what you’ve already generated and saved.
 - **Domain signals** (not a guarantee) to avoid falling in love with names that are obviously taken.
 
 NamifyAI combines these into one workflow: generate -> review -> check likely domains -> save -> revisit later.
 
 ## How the app works (user flow)
 
 1. **Visit marketing pages**
 
    Public pages live under `app/(marketing)`.
 
 2. **Create an account / sign in**
 
    Authentication supports:
    
    - **Email + password** (Credentials)
    - **Google OAuth** (optional, enabled only if Google env vars are set)
 
 3. **Generate names in the dashboard**
 
    In `app/dashboard/generate`, you provide:
 
    - business description
    - industry
    - tone
    - optional keywords
    - how many suggestions (2 / 4 / 6)
 
    The UI calls `POST /api/ai/generate` and displays enriched results.
 
 4. **Save your favorites**
 
    Clicking “Save” stores a suggestion into the database via `POST /api/names/save`.
 
 5. **View history**
 
    The history page fetches your saved names via `GET /api/names` with pagination.
 
 6. **Upgrade to Pro (optional)**
 
    Pro unlocks a higher monthly generation limit using Stripe Checkout + webhooks.
 
 ## How it works internally (system overview)
 
 ### 1) Authentication
 
 - **Library:** NextAuth (`lib/auth.ts`)
 - **Session strategy:** JWT
 - **Protected routes:** there is a middleware implementation in `proxy.ts` that checks for a session cookie and redirects unauthenticated users away from `/dashboard/*`. In Next.js, middleware must be in `middleware.ts` at the project root to run automatically.
 
 Credentials sign-in validates the user by comparing a plaintext password against `user.passwordHash` (bcrypt).
 
 ### 2) AI generation
 
 - **API route:** `POST /api/ai/generate` (`app/api/ai/generate/route.ts`)
 - **Model:** configured with `OPENAI_API_KEY` (defaults to `gpt-4o-mini` unless `OPENAI_NAME_MODEL` is set)
 
 The endpoint:
 
 - Validates input with Zod.
 - Requires a logged-in user.
 - Enforces rate limits per IP and per user.
 - Checks the user’s **monthly usage limit** (Free vs Pro).
 - Calls OpenAI chat completions and expects strict JSON.
 - Normalizes and deduplicates names.
 - Checks whether a generated name already exists in your database history.
 - Enriches each suggestion with **domain availability signals**.
 
 ### 3) Domain checks (RDAP)
 
 After generating a name, the API derives a domain label (e.g. `cool-labs`) and checks a small set of common TLDs (like `.com`, `.ai`, `.io`, etc.).
 
 It uses RDAP (Registration Data Access Protocol) via:
 
 - an IANA bootstrap file (`https://data.iana.org/rdap/dns.json`) to pick the right RDAP server by TLD
 - a fallback server (`https://rdap.org`)
 
 **Important:** this is a *best-effort signal* and not a purchase/registration guarantee.
 
 ### 4) Saving and history
 
 - `POST /api/names/save` inserts a row into `GeneratedName`.
 - `GET /api/names` returns paginated saved names for the authenticated user.
 
 ### 5) Usage tracking (credits)
 
 Usage is tracked per user per month in `UsageTracking`.
 
 - **Free limit:** 1 credit/month
 - **Pro limit:** 200 credits/month
 - **Cost per generation:**
   - 2 suggestions = 1 credit
   - 4 suggestions = 2 credits
   - 6 suggestions = 3 credits
 
 The generator endpoint increments usage only after successful generation.
 
 ### 6) Billing (Stripe)
 
 - **Create checkout session:** `POST /api/stripe/checkout`
 - **Handle webhooks:** `POST /api/stripe/webhook`
 - **Billing portal:** `POST /api/stripe/portal`
 
 Stripe webhooks update the `Subscription` table (plan/status/period end). Webhook events are stored in `StripeWebhookEvent` for idempotency (Stripe may retry the same event).
 
 ## Tech stack
 
 - **Frontend**
   - Next.js (App Router)
   - React
   - Tailwind CSS
   - Radix UI primitives + shadcn/ui-style components
   - TanStack React Query (client data fetching)
   - Framer Motion (marketing animations)
 
 - **Backend**
   - Next.js Route Handlers (`app/api/*`)
   - Prisma ORM
   - PostgreSQL
 
 - **Auth**
   - NextAuth (Credentials + optional Google OAuth)
 
 - **Email**
   - Resend (password reset emails)
 
 - **AI**
   - OpenAI API
 
 - **Billing**
   - Stripe (checkout + webhook)
 
 ## Project structure
 
 - `app/(marketing)`
 
   Public marketing pages (home, pricing sections)
 
 - `app/(auth)`
 
   Auth pages (login, register, forgot/reset password)
 
 - `app/dashboard`
 
   Logged-in app (generate, history, billing)
 
 - `app/api`
 
   Server routes (AI generation, auth endpoints, names CRUD, usage, Stripe)
 
 - `components`
 
   Shared UI components
 
 - `lib`
 
   Shared utilities (auth, prisma, env, stripe, rate limiting)
 
 - `prisma`
 
   Prisma schema and migrations
 
 ## Key API routes
 
 - **Auth**
   - `POST /api/auth/register`
   - `POST /api/auth/forgot-password`
   - `POST /api/auth/reset-password`
 
 - **AI + names**
   - `POST /api/ai/generate`
   - `GET /api/names`
   - `POST /api/names/save`
 
 - **Usage + billing**
   - `GET /api/usage`
   - `GET /api/usage/weekly`
   - `POST /api/stripe/checkout`
   - `POST /api/stripe/portal`
   - `POST /api/stripe/webhook`
 
 ## Database (Prisma)
 
 See `prisma/schema.prisma` for the full source of truth. Core models include:
 
 - `user`: accounts
 - `account`: OAuth linkage (Google)
 - `session`: session records (if used)
 - `PasswordResetToken`: password reset tokens
 - `GeneratedName`: saved name history
 - `UsageTracking`: monthly usage tracking
 - `Subscription` and `StripeWebhookEvent`: billing state and webhook idempotency
 
 ## Environment variables
 
 Copy `.env.example` to `.env` and fill values.
 
 - `DATABASE_URL`
 
   PostgreSQL connection string.
 
 - `NEXT_PUBLIC_APP_URL`
 
   Public base URL of the app (used for building absolute links like password reset and Stripe redirect URLs).
 
 - `AUTH_SECRET`
 
   NextAuth secret for signing/encrypting auth tokens.
 
 - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (optional)
 
   If set, Google sign-in is enabled.
 
 - `RESEND_API_KEY`, `RESEND_FROM` (optional but recommended)
 
   Enables password reset emails. If `RESEND_API_KEY` is not set, the API logs the reset URL in the server console for local development.
 
 - `OPENAI_API_KEY`
 
   Enables AI name generation.
 
 - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`
 
   Enables subscription checkout + webhook processing. `STRIPE_PRO_PRICE_ID` can be a `price_...` or `prod_...` value.
 
 ## Local development
 
 ### 1) Install dependencies
 
 ```bash
 npm install
 ```
 
 ### 2) Configure environment variables
 
 ```bash
 copy .env.example .env
 ```
 
 ### 3) Prisma
 
 ```bash
 npm run prisma:generate
 npm run prisma:migrate
 ```
 
 ### 4) Start the dev server
 
 ```bash
 npm run dev
 ```
 
 Open `http://localhost:3000`.
 
 ## Email (Resend) setup notes
 
 Password reset emails are sent via Resend when `RESEND_API_KEY` is set.
 
 - For local/dev you can use:
 
   `RESEND_FROM="NamifyAI <onboarding@resend.dev>"`
 
 - For production, set `RESEND_FROM` to a sender on a verified domain in your Resend dashboard.
 
 ## Stripe webhook notes
 
 For local testing, you typically forward Stripe webhooks to your local server using the Stripe CLI, then set `STRIPE_WEBHOOK_SECRET` to the signing secret Stripe provides for that forwarding endpoint.
 
 ## Troubleshooting
 
 - **AI generation returns `OpenAI is not configured`**
 
   Set `OPENAI_API_KEY` in `.env`.
 
 - **Stripe checkout returns `Stripe is not configured`**
 
   Set `STRIPE_SECRET_KEY` and `STRIPE_PRO_PRICE_ID`.
 
 - **Password reset doesn’t send emails**
 
   Ensure `RESEND_API_KEY` is set. If not set, check your server console logs for the reset URL.
