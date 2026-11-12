# MundaIQ — Android release checklist

Tracks: **free direct-APK release (default)** and **Google Play (optional)**. Android only,
local-first v1.0.0.

The default track is GitHub Releases + Obtainium — see `docs/github-releases.md` for the full
walkthrough. Sections 1–2 below apply to both tracks; sections 3–7 are the optional Google Play
track.

This checklist assumes the app is built with Expo SDK 57 + EAS Build. On this Windows machine the
PowerShell shim for npm is blocked by execution policy, so use `npm.cmd` and `npx.cmd`.

---

## 0. Before you start (both tracks)

- [ ] Confirm the app package name: `com.mundaiq.app`. **It cannot be changed after the first
  release.**
- [ ] Install Git for Windows and put this project under version control before the first release.
  (Git is not installed on the current machine — see `docs/github-releases.md`.)
- [ ] Make a backup of the project folder.
- [ ] Create a free Expo account (needed for EAS Build on both tracks).
- [ ] Replace the remaining `[YOUR ...]` placeholders (support email, privacy-policy URL, developer
  name) in `README.md` and `docs/`.

### Only if you choose the Google Play track

- [ ] Decide whether the Play Console account is **personal** or **organisation**.
  - Personal accounts created after 13 November 2023 must run a closed test with **12 testers
    opted in for 14 continuous days** before they can apply for production access.
  - Organisation accounts do not have the 12-tester requirement, but need organisation details and
    may need verification.
- [ ] Complete Google Play developer identity verification.
- [ ] Have a public support email and a public privacy-policy URL ready (see
  `docs/privacy-policy.md`).

## 1. One-time project setup

```powershell
cd "C:\Users\ADMIN\Documents\Default Project\munda-iq"

# 1. Create a free Expo account, then log in.
npx.cmd eas-cli@latest login

# 2. Link this project to an EAS project.
#    This adds extra.eas.projectId to app.json and creates the project on expo.dev.
npx.cmd eas-cli@latest init

# 3. Check the resolved Android config.
npx.cmd expo config --type public
```

Confirm in the resolved config:

- `platforms` is `["android"]`
- `android.package` is `com.mundaiq.app`
- `android.versionCode` is `1`
- `android.allowBackup` is `false`
- Splash screen and adaptive icon paths exist

EAS manages the Android upload keystore. Back it up after the first build:

```powershell
npx.cmd eas-cli@latest credentials --platform android
```

Choose **Download existing keystore**. Store it and its passwords somewhere safe (password manager,
encrypted drive). On the direct-APK track a lost key means users must uninstall and reinstall (losing
local data unless they exported a backup). On Play, Google Play App Signing can help with a reset,
but it is slow and risky.

## 2. Build an APK and test on a real phone

```powershell
# Direct-APK track (GitHub Releases):
npx.cmd eas-cli@latest build --platform android --profile direct

# Or the preview profile, which is equivalent for testing:
npx.cmd eas-cli@latest build --platform android --profile preview
```

Install the resulting APK on an Android phone (Android 10 or newer recommended) and run this test
script:

### Data and encryption

- [ ] Fresh install opens with **no demo data**: no flocks, no collections, no expenses.
- [ ] Add a flock, add a daily collection and add an expense. Force-close and reopen — all three
  are still there.
- [ ] Put the phone in airplane mode — the app still works.
- [ ] Upgrade test: install a build of the old plaintext version, add data, then install this build
  over it. The old records appear and are still readable after a restart (one-time migration).
- [ ] Confirm Android backup is off:
  ```powershell
  adb shell dumpsys package com.mundaiq.app | findstr /i backup
  ```
  `allowBackup=false` (or the backup-agent equivalent) must be present.

### App lock

- [ ] Turn on app lock with a 4-digit PIN.
- [ ] Force-close and reopen — the lock screen appears before any farm data.
- [ ] Unlock with the correct PIN.
- [ ] Enter a wrong PIN 5 times — the app enforces a 30-second lockout.
- [ ] Enable biometrics, background the app for more than 15 seconds, return — the app asks for
  fingerprint/face.
- [ ] Try to take a screenshot or open the recent-apps switcher — content is hidden/blocked.
- [ ] Change the PIN, then turn app lock off with the current PIN.
- [ ] Turn app lock back on for the remaining tests.

### Backup, restore and deletion

- [ ] **More → Export backup** opens the Android share sheet and creates
  `mundaiq-backup-YYYY-MM-DD.json`.
- [ ] Open the exported file and confirm it contains your flocks, records and expenses. The file is
  intentionally unencrypted.
- [ ] Install a clean copy on another phone (or clear app data), then **More → Import backup** and
  pick the file. Records are restored after confirmation.
- [ ] Import an invalid file (for example a photo renamed to `.json`). The app shows an error and
  does **not** change existing data.
- [ ] **More → Delete all data** clears the records, and the app returns to the empty state.
- [ ] After deletion, force-close and reopen — still empty.

### UI and content

- [ ] No screen shows "Green Valley Farm", demo batches, sample expenses or "Demo" labels.
- [ ] The "Add record" and "Add expense" dates default to today's date.
- [ ] The dashboard, production, expenses, cage map and performance screens open without crashes.
- [ ] No red error screen and no unhandled promise warnings in `adb logcat` during the test.

## 3. Play Console: create the app

In **Play Console → All apps → Create app**:

| Field | Value |
| --- | --- |
| App name | `MundaIQ: Layer Records` |
| Default language | English (United Kingdom) or English (United States) |
| App or game | App |
| Free or paid | Free |
| Declarations | Accept Play Console policies and US export laws |

Then complete **Dashboard → Set up your app**:

- [ ] **App access:** no login required. App lock is off on a fresh install.
- [ ] **Ads:** no ads.
- [ ] **Content rating:** complete the questionnaire (expected Everyone / PEGI 3).
- [ ] **Target audience:** 18+ / business.
- [ ] **News app:** no.
- [ ] **Data safety:** no data collected, no data shared. See `docs/store-listing.md`.
- [ ] **Government apps:** no.
- [ ] **Financial features:** none (expense recording only).
- [ ] **Health features:** none.
- [ ] **Privacy policy:** paste the public URL.
- [ ] **Store listing:** copy the text and upload graphics from `docs/store-listing.md`.
- [ ] **Countries/regions:** select the markets you can support.
- [ ] **App signing:** accept Google Play App Signing (recommended).

## 4. Target API and technical requirements

Google Play requires new apps and updates to target recent Android versions. For the 2026 cycle,
new apps must target **Android 16 (API level 36)** from **31 August 2026**. Expo SDK 57 targets API
36; verify it in the EAS build output or with:

```powershell
# After downloading the AAB/APK build artifact
aapt dump badging app-release.apk | findstr targetSdkVersion
```

Also confirm:

- [ ] 64-bit native libraries are included (EAS release builds are arm64-v8a + armeabi-v7a).
- [ ] `versionCode` increases for every upload. `eas.json` uses `autoIncrement` for production.
- [ ] The app launches without Google Play services dependencies that would break on budget phones.
- [ ] No unused sensitive permissions are declared in the merged manifest.

## 5. Closed testing (personal accounts)

If the Play Console account is personal:

- [ ] Create a **Closed testing** track.
- [ ] Upload the first AAB/APK to that track.
- [ ] Recruit **12 testers** who accept the invite and install the build.
- [ ] Keep all 12 opted in for **14 continuous days**. Removing a tester resets the clock for that
  slot.
- [ ] Use the 14 days to collect crash reports and feedback; ship fixes as new builds on the same
  track.
- [ ] After 14 days, apply for **production access** from the closed-testing dashboard.
- [ ] Answer Google's production-access questions honestly (who tested, what changed, why the app
  is ready).

Organisation accounts can skip the 12-tester requirement but should still use internal/closed
testing before production.

## 6. Production build and upload

```powershell
# Build an Android App Bundle (.aab) for Play.
npx.cmd eas-cli@latest build --platform android --profile production
```

Then either upload the `.aab` manually in **Play Console → Production → Create new release**, or use
EAS Submit with a Google Cloud service account that has Play Developer API access:

```powershell
npx.cmd eas-cli@latest submit --platform android --profile production
```

Release notes (example):

```
First release of MundaIQ.

• Track flocks, daily egg collections, feed use and expenses.
• See hen-day rate, feed cost and weekly production trends.
• Records are encrypted on your phone and work offline.
• Optional PIN or biometric app lock.
• Export and import a JSON backup, or delete all data in the app.
```

## 7. Review and rollout

- [ ] Complete the **Pre-launch report** and fix any crashes or accessibility warnings.
- [ ] Resolve all Play policy warnings.
- [ ] Start with a **staged rollout** (for example 20%), monitor crash-free rate and reviews for
  48–72 hours, then increase to 100%.
- [ ] Keep the previous AAB available for rollback. You cannot downgrade `versionCode`, so ship a
  fixed build with a higher code if needed.

## 8. After release

- [ ] Back up the EAS keystore and Play Console owner account recovery codes.
- [ ] Record the release `versionCode`, commit hash and build date.
- [ ] Monitor Play Console **Android vitals** and user reviews weekly.
- [ ] Update the privacy policy and Data safety form before shipping any build that adds network
  sync, analytics, crash reporting or push notifications.
- [ ] Keep `docs/store-listing.md` and the Play listing in sync with the actual app.

## 9. Dependency audit

Run before each release:

```powershell
npm.cmd audit --omit=dev
```

As of v1.0.0 there are **no critical** advisories (the `shell-quote` issue is pinned to a patched
version via `overrides` in `package.json`). The remaining high/moderate reports are:

- `decode-uri-component` via `expo-router` → `query-string`: denial of service on malformed
  percent-encoded input. Expo SDK 57 has no patched release yet; exposure is limited to a crafted
  deep link, not access to farm data.
- `deepmerge`, `glob`, `minimatch` and Expo's internal `zod` v3: build-time tooling, not shipped in
  the APK.

**Do not run `npm.cmd audit fix --force`.** It downgrades Expo to SDK 51 and breaks the project.
Re-check the audit after each Expo SDK upgrade.

---

## Known v1 limitations to state honestly

- The Hatchery screen is hidden from the in-app tools list until incubation batches are stored in
  the encrypted data model.
- The Cage Map uses the fixed house/cage layout defined in `src/data/mock.ts`; it is a planning
  view, not a per-farm layout editor.
- Supabase sync is not part of v1. Backups are manual JSON exports.
- Data is device-local. A lost phone without an exported backup cannot be recovered.
