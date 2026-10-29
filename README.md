# Pocket Ledger

Track money by just saying it. Type or speak what you spent the way you would text a friend. Pocket Ledger finds the amount, the date, how you paid and the right category, then turns it into budgets and plain-language insights.

**Use it:** https://anojskunte2002-pixel.github.io/pocket-ledger/

## What it does

- **Plain-words entry.** `coffee 120`, `Uber 230 yesterday on card`, `salary 85k credited`, `Netflix 649 monthly`, `lunch 350 and movie 500`. A live preview shows what will be saved before you press Enter.
- **Voice.** Tap the mic and talk, or use your keyboard's mic.
- **Bank messages and statements.** Paste SMS or e-mail alerts, many at once, or import a CSV statement. Possible duplicates are flagged.
- **Learns as you go.** Change a category once and similar entries go there from then on.
- **Budgets.** A monthly limit and per-category limits, with pace tracking, a daily allowance and a month-end projection. Your budget month can start on payday.
- **Insights.** Spending pace against last month, unusual expenses, repeating charges, weekday habits, needs, wants and saving, and top places, each with a chart and a table view.
- **Repeating entries.** Rent, subscriptions and EMIs add themselves when due.
- **Backups.** Export a spreadsheet (CSV) or a full backup (JSON), and restore any time.
- **Installable and offline.** Add it to your home screen; it keeps working without a connection.

Savings and investments, credit card bill payments, ATM withdrawals and transfers between your own accounts are recorded but kept out of spending, so nothing is counted twice.

## Your data

The website keeps every entry in your browser, on your device. Nothing is sent to a server. On iPhone, add it to the Home Screen so Safari keeps your entries.

There is also a Claude version (a Claude artifact) that stores the ledger privately in your Claude account and adds Claude-powered extras: reading receipt photos, sorting out tricky entries and answering questions about your money. The two keep separate data; move entries between them with **Download a full backup** and **Import → Backup** in Settings.

## Develop

No dependencies. Plain JavaScript, built into single pages.

```bash
node build.js              # docs/ (website) and dist/ (Claude artifact)
node tests/parser.test.js  # 118 plain-language parsing checks
node tests/e2e.js          # browser run of the main flows (needs Playwright)
```

| Path | What lives there |
| --- | --- |
| `src/core.js` | dates, money formatting, categories and the keyword dictionary |
| `src/parser.js` | plain words, bank messages and CSV statements → entries |
| `src/store.js` | saving to the browser or to private Claude storage |
| `src/analytics.js` | totals, projections, repeating charges and insights |
| `src/charts.js` | the SVG charts, tooltips and table views |
| `src/ai.js` | Claude features in the artifact version |
| `src/ui.js`, `src/sheets.js`, `src/actions.js`, `src/main.js` | screens, dialogs and wiring |
| `src/styles.css`, `src/shell.html` | look and page structure |
| `site/` | offline worker and icons for the website |
| `docs/` | the built website that GitHub Pages serves |

The site is published by GitHub Pages from the `docs/` folder on `main`. Run `node build.js` and commit `docs/` to update it.
