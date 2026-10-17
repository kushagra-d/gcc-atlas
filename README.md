# GCC Atlas (GCC-Pulse) — interactive prototype

Next.js (App Router) + Tailwind CSS v4. No backend or external services: all data is in `lib/data/`, and prototype state (submissions, shortlist, claimed leads) persists to `localStorage`.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

Modules: `components/Registry.tsx`, `Radar.tsx`, `IncentiveMatrix.tsx`, `ProviderScorecard.tsx`, `SubmitModal.tsx`.
Deep links: `#registry`, `#radar`, `#incentives`, `#providers`.

## Data honesty
- **Registry**: illustrative sample (headcount as bands). Market totals are from the strategy deck (Nasscom-Zinnov FY26).
- **Radar**: simulated; every entrant is fictional.
- **Incentives**: summarised from public law-firm / press summaries (linked per cell). Low-confidence items are tagged. Verify against the notified G.O. before use.
- **Providers**: synthetic profiles and reviews.
