# Pen Wise Path

Pen Wise Path is a farm management app for tracking feedlot animals from arrival to sale. It helps a farm team see what animals they have, where they are housed, how they are growing, what they are eating, and when they may be ready for market.

The app is built for day-to-day livestock work. A user can record animal details, keep daily weight records, manage pens, monitor feed stock, review health and growth alerts, record sales, and follow market prices and selling predictions. The dashboard brings the main signals together so the team can quickly see animals needing attention, feed items running low, unpaid sales, pen utilization, and potential selling opportunities.

## Main Features

- Animal records for cattle, goats, pigs, and other supported species.
- Pen and assignment management so animals can be tracked by location.
- Bulk weight entry for daily weighing sessions.
- Growth alerts and health assessments to flag animals that may need review.
- Feed inventory, feed records, and feed cost analysis.
- Market price tracking, selling predictions, and sales records.
- Profitability, performance, and feed cost reports.
- Farm member management with role-based access.
- Audit logs for important farm actions.

## How It Works

Pen Wise Path uses Supabase for the database, authentication, row-level security, and Edge Functions. The frontend is a React app using TanStack Router, TanStack Query, Vite, and Tailwind CSS.

The Supabase migrations define the farm data model, security rules, reporting tables, and automation support. Edge Functions handle heavier farm operations such as growth alert generation, health assessments, selling predictions, report insights, member invitations, and sale recording.

## Running Locally

Install the project dependencies:

```bash
bun install
```

Create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Start the app:

```bash
bun run dev
```

For the full Supabase setup, including linking a project, running migrations, deploying functions, and setting secrets, see [instructions.txt](instructions.txt).

## Supabase Deployment

After logging in with the Supabase CLI and choosing a project, you can run:

```bash
bun run supabase:deploy -- --project-ref <your-project-ref>
```

This links the local project, pushes database migrations, and deploys all Edge Functions found in `supabase/functions`.

## Project Structure

- `src/features` contains the main app features such as animals, feed, market, reports, farm, dashboard, auth, and search.
- `src/routes` contains the TanStack Router file-based routes.
- `supabase/migrations` contains database migrations.
- `supabase/functions` contains Supabase Edge Functions.
- `scripts/deploy-supabase.mjs` automates migration and function deployment.
