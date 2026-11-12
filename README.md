# MundaIQ: Layer Records

A private, offline record keeper for layer-farm egg production. Track flocks, daily collections,
feed use and expenses — without sending your farm's numbers to the cloud.

Android 10 or newer. No account. No ads. No analytics.

## Install

### Obtainium (recommended — gets updates)

1. Install [Obtainium](https://github.com/ImranR98/Obtainium/releases).
2. Open Obtainium → **Add App**.
3. Paste this repository's URL: `https://github.com/tanatswamatumbi5-png/MundaIQ`
4. Tap **Add**, then **Install**. Allow "install unknown apps" when Android asks.

### APK

Download the latest `MundaIQ-*.apk` from the
[Releases](https://github.com/tanatswamatumbi5-png/MundaIQ/releases) page and open it. You will
need to allow your browser or file manager to install unknown apps.

Each release lists a SHA-256 checksum. Verify the download before installing if you want to be
certain it is unmodified.

## What it does

- Layer flocks — breed, age, house and stage.
- Daily collections — intact, broken and dirty eggs, mortality, birds at collection, feed and feed
  cost.
- Expenses — feed, veterinary, labour, equipment, transport and utilities.
- Hen-day rate, feed per dozen, feed cost per egg, mortality and weekly trends.
- Optional PIN or biometric app lock; screenshots are blocked while it is on.
- JSON backup export/import, and delete-all-data, from inside the app.

## Privacy

- Everything is stored on the device and encrypted at rest with a key held in the Android keystore.
- Android cloud backup is disabled for this app.
- No network calls, no analytics, no ads, no crash reporting.
- Data leaves the app only when you export or share a backup yourself. **Exported backups are not
  encrypted — keep them private.**

## Build from source

Requires Node.js, an Expo account, and EAS CLI.

```powershell
npm.cmd install
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest init
npx.cmd eas-cli@latest build --platform android --profile direct
```

The `direct` profile produces a signed APK for GitHub Releases. See
[`docs/github-releases.md`](docs/github-releases.md) for the full release walkthrough, including
keystore backup and versioning.

## Docs

- [`docs/github-releases.md`](docs/github-releases.md) — free distribution, updates, signing
- [`docs/release-checklist.md`](docs/release-checklist.md) — build and test checklist
- [`docs/privacy-policy.md`](docs/privacy-policy.md) — privacy policy
- [`docs/store-listing.md`](docs/store-listing.md) — listing copy and Data Safety notes

## Support

Open an issue in this repository.

## Licence

All rights reserved. The source is published for transparency and building; it is not licensed for
redistribution under a separate name. See [`LICENSE`](LICENSE).
