<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- App state (food entries, weigh-ins, profile, targets, settings) lives in `src/lib/store.ts`, a localStorage-backed `useSyncExternalStore` store; why: foundation phase is device-only, and swapping to a backend later only touches this module.
- Nutrition math (BMR/TDEE/BMI/macro split, unit conversion) stays pure in `src/lib/nutrition.ts` with tests in `nutrition.test.ts`; progress math (7-day average, weight change) likewise stays pure in `src/lib/progress.ts` with `progress.test.ts`; why: rules users care about must stay testable without React.
- Data is always stored in metric; imperial is display/input conversion only; why: one canonical unit avoids drift.
- The mobile shell (max-w-md column + fixed bottom tab bar) lives in `src/routes/__root.tsx`; each tab is its own route file; why: tabs get real URLs and shared chrome.
- `FoodEntry.barcode` is reserved for the upcoming camera barcode scanner.
- Targets & calculator is a sub-page of Settings (`src/routes/settings/targets.tsx`), not a tab; the Settings tab stays active on its sub-pages; why: the tab bar holds only daily-use screens.
- The app is dark-only: theme tokens in `:root` of `src/styles.css` hold the dark palette (no light/dark toggle); why: the user chose a single dark look.
