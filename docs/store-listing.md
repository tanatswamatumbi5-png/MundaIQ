# MundaIQ — store listing copy

Written for **Google Play Console → Grow → Store presence → Main store listing**, but the same copy
works for a GitHub Release description, Samsung Galaxy Store, or Huawei AppGallery. Replace every
`[BRACKETED]` value before publishing.

For the free GitHub Releases track, see `docs/github-releases.md`.

## App name (max 30 characters)

```
MundaIQ: Layer Records
```

## Short description (max 80 characters)

```
Track eggs, feed, mortality and costs for your layer flock — offline and private.
```

## Full description (max 4000 characters)

```
MundaIQ is a simple, private record keeper for layer-farm egg production. It replaces the notebook
and the mental arithmetic, without sending your farm's numbers to the cloud.

WHAT YOU CAN RECORD
• Layer flocks — breed, age, house and stage.
• Daily collections — intact, broken and dirty eggs, mortality, birds at collection, feed used and
  feed cost.
• Expenses — feed, veterinary, labour, equipment, transport and utilities.
• A cage map that shows the laying row and grades its weekly crate output.

WHAT YOU GET BACK
• Eggs today, eggs this week and average hen-day rate.
• Feed per dozen and feed cost per egg.
• Mortality and weekly production trends.
• Flock-by-flock and overall performance, so you can see which batches are paying their way.

BUILT FOR THE FARM
• Works completely offline. No account and no sign-in.
• Records stay on your phone, encrypted with a key held in the Android keystore.
• Optional app lock with a PIN or fingerprint/face.
• Screenshots are blocked while app lock is on.
• Export a JSON backup you can save or move to another phone, and import it again.
• Delete all data from inside the app whenever you choose.

PRIVACY BY DEFAULT
MundaIQ has no analytics, no ads and no tracking SDKs. Nothing is uploaded to a server. The only
time data leaves the app is when you deliberately export or share a backup, and that backup is not
encrypted — keep it private.

GOOD TO KNOW
• MundaIQ is a record-keeping tool, not veterinary or financial advice.
• Data is stored on your device. If you uninstall the app or lose the phone without an exported
  backup, the records cannot be recovered.
• Android cloud backup is disabled for MundaIQ.

Questions or support: [YOUR SUPPORT EMAIL]
Privacy policy: [YOUR PRIVACY POLICY URL]
```

## Categorisation

| Field | Value |
| --- | --- |
| App or game | App |
| Category | Business |
| Tags | Farm management, Poultry, Egg production, Agriculture |
| Contact email | `[YOUR SUPPORT EMAIL]` |
| Website | `[YOUR WEBSITE OR PRIVACY POLICY URL]` |
| Phone | optional |
| Privacy policy URL | `[YOUR PRIVACY POLICY URL]` |

## Graphics checklist

| Asset | Requirement |
| --- | --- |
| App icon | 512 × 512 px PNG, no transparency, no rounded corners baked in |
| Feature graphic | 1024 × 500 px PNG or JPEG |
| Phone screenshots | 2–8 images, 16:9 or 9:16, at least 1080 px on the long edge |
| Tablet screenshots | optional (Android-only phone app) |
| Promo video | optional |

Suggested screenshot set:

1. Dashboard with production stats.
2. Daily collection form.
3. Flock list / flock detail.
4. Weekly performance chart.
5. Expenses list.
6. Cage map.
7. Security & privacy screen.
8. Export/import screen.

Do not show real farmer names or real financial data in screenshots. Use sample data.

## Store settings answers

| Play Console question | Answer |
| --- | --- |
| Ads | No ads |
| In-app purchases | No |
| App access | No login or restricted area. App lock is off by default, so reviewers can use every screen. |
| Target audience | 18+ / business users (not designed for children) |
| Content rating | Complete the questionnaire; expected Everyone / PEGI 3 |
| News app | No |
| COVID-19 contact tracing | No |
| Government app | No |
| Financial features | No (expense recording only; no payments, lending or trading) |
| Health features | No |
| Data safety | No data collected, no data shared (see below) |
| Account deletion | Not applicable — there are no accounts. In-app "Delete all data" is available. |

## Data safety declaration

Because the app has no network calls, analytics or ads:

- **Does your app collect or share any of the required user data types?** No.
- **Is all of the user data encrypted in transit?** Not applicable — no data is transmitted.
- **Do you provide a way for users to request that their data is deleted?** Yes — in-app
  **More → Delete all data**; uninstalling also removes it.
- **Data types:** none collected or shared.

If you later add Supabase sync, crash reporting, push notifications or analytics, this declaration
must be updated before that build is released.
