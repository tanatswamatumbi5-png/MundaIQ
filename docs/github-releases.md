# MundaIQ — free distribution with GitHub Releases + Obtainium

This is the default release track for MundaIQ. It costs nothing, needs no store account, and lets
users install and update the app without Google Play.

**How it works**

1. EAS Build produces a signed `.apk`.
2. You attach that `.apk` to a GitHub Release (for example tag `v1.0.0`).
3. Users install [Obtainium](https://github.com/ImranR98/Obtainium) once, add your GitHub repo URL,
   and Obtainium installs the latest APK and offers updates when you publish a new release.

You can still publish on Google Play later — see the warning about signing keys at the end.

---

## 0. One-time setup

### Install Git

Git is not installed on this machine. In PowerShell:

```powershell
winget install --id Git.Git -e --source winget
```

Close and reopen the terminal, then check:

```powershell
git --version
```

### Create the accounts

- [ ] Free GitHub account: <https://github.com/signup>
- [ ] Free Expo account: <https://expo.dev/signup>
- [ ] Turn on two-factor authentication on **both** accounts.

### Put the project under version control

Run from the project folder:

```powershell
cd "C:\Users\ADMIN\Documents\Default Project\munda-iq"

git init
git add .
git commit -m "MundaIQ 1.0.0"
git branch -M main
```

This project's repository is **<https://github.com/tanatswamatumbi5-png/MundaIQ>** (public). If you
ever recreate it, create an **empty** repository (no README, no .gitignore, no licence — the project
already has those). Then connect and push:

```powershell
git remote add origin https://github.com/tanatswamatumbi5-png/MundaIQ.git
git push -u origin main
```

> The repo can be private. Obtainium works with private repos only if the user supplies a GitHub
> token, so use **public** if you want the simplest install experience.

### Link EAS (one time)

```powershell
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest init
```

`init` adds `extra.eas.projectId` to `app.json`. Commit that change:

```powershell
git add app.json
git commit -m "Link EAS project"
git push
```

### Back up the Android signing key — do this before the first release

EAS generates and stores the keystore for you:

```powershell
npx.cmd eas-cli@latest credentials --platform android
```

Choose **Download existing keystore**. Store the `.jks` file and its passwords in a password manager
and on an offline drive. **Never commit it** — `.gitignore` already excludes `*.jks` and
`*.keystore`.

If you lose this key:

- You cannot ship an update that installs over the existing app.
- Users must uninstall (losing local data unless they exported a backup) and reinstall.
- Google Play cannot recover it for a directly distributed app.

---

## 1. Build the APK

`eas.json` has a `direct` profile: APK output with internal distribution. You bump `versionCode`
yourself in `app.json`, so the number always matches the tag you publish.

```powershell
npx.cmd eas-cli@latest build --platform android --profile direct
```

When the build finishes, download the `.apk` from the build page or the link printed in the
terminal. Rename it so the version is visible in the release:

```
MundaIQ-1.0.0.apk
```

### Optional: verify the build

```powershell
# Requires Android SDK build-tools on PATH.
aapt dump badging .\MundaIQ-1.0.0.apk | findstr /i "package versionCode targetSdkVersion"
```

Confirm:

- `package: name='com.mundaiq.app'`
- `versionCode='1'` (or higher on later releases)
- `targetSdkVersion:'36'`

Compute a checksum to publish next to the download:

```powershell
Get-FileHash .\MundaIQ-1.0.0.apk -Algorithm SHA256
```

### Smoke-test on a real phone

Install the APK directly (copy it to the phone or use `adb install`), then run the test script in
`docs/release-checklist.md` → section 2.

```powershell
adb install -r .\MundaIQ-1.0.0.apk
```

---

## 2. Publish the GitHub Release

1. Open your repo on GitHub → **Releases** → **Draft a new release**.
2. **Choose a tag** → type `v1.0.0` → **Create new tag on publish**.
3. Title: `MundaIQ 1.0.0`.
4. Description: use the release notes below.
5. Attach `MundaIQ-1.0.0.apk`.
6. Publish the release (not a draft — Obtainium only reads published releases).

### Release notes template

```markdown
First public release of MundaIQ: Layer Records.

• Track flocks, daily egg collections, feed use and expenses.
• See hen-day rate, feed cost and weekly production trends.
• Records are encrypted on your phone and work offline.
• Optional PIN or biometric app lock.
• Export and import a JSON backup, or delete all data in the app.

Install: download MundaIQ-1.0.0.apk below.
Android 10 or newer. You will need to allow "install unknown apps" for your browser or file manager.

SHA-256: <paste the hash from Get-FileHash>
```

Tag names must increase in a way Obtainium can compare (`v1.0.0`, `v1.0.1`, `v1.1.0`). Keep the
`version` in `app.json` in sync with the tag.

---

## 3. Tell users how to install

Send them these steps:

1. Install **Obtainium**: <https://github.com/ImranR98/Obtainium/releases> (or from F-Droid).
2. Open Obtainium → **Add App**.
3. Paste `https://github.com/tanatswamatumbi5-png/MundaIQ`.
4. Tap **Add**, then **Install**.
5. Allow Obtainium to install unknown apps when Android asks.

Obtainium checks the repo for new releases and shows an update when you publish one. Users can also
download the APK from the Releases page directly if they prefer.

> Without Obtainium there is no automatic update. Users must return to the Releases page and install
> the new APK manually.

---

## 4. Shipping an update

1. Bump `expo.version` in `app.json` (`1.0.0` → `1.0.1`).
2. Bump `expo.android.versionCode` (`1` → `2`). This must be higher than every APK you have already
   published — see the build output or `aapt dump badging` if you are unsure.
3. Build:

   ```powershell
   npx.cmd eas-cli@latest build --platform android --profile direct
   ```

4. Rename the artifact `MundaIQ-1.0.1.apk`.
5. Commit, tag, and push:

   ```powershell
   git add .
   git commit -m "Release 1.0.1"
   git tag -a v1.0.1 -m "MundaIQ 1.0.1"
   git push
   git push origin v1.0.1
   ```

6. Draft a new GitHub Release for tag `v1.0.1`, attach the APK, publish.

Rules that matter:

- **Never reuse a versionCode.** Android refuses to install a lower one over a higher one.
- **Never change the signing key.** Updates only install over an app signed with the same key.
- Keep the previous APK so users can roll back by reinstalling (a lower versionCode needs an
  uninstall first).

---

## 5. Costs, limits and caveats

| Item | Detail |
| --- | --- |
| GitHub Releases | Free. 2 GB per file limit, far above an APK. |
| EAS Build | Free tier has a monthly build quota; Android APK builds typically fit. |
| Store fees | None. |
| Discoverability | None — users need the link. |
| Updates | Only via Obtainium or manual reinstall. |
| Trust signal | Users see Android's "unknown app" warning on first install. |

### Android developer verification

Google is introducing developer verification for apps installed on certified Android devices:

- From **30 September 2026** in Brazil, Indonesia, Singapore and Thailand, apps from participating
  stores must come from verified developers.
- Wider rollout is planned for **2027**.
- Google has said there will be a **free limited-distribution tier (up to 20 devices)** for
  hobby/personal use; broader non-Play distribution is expected to require the paid registration.

Direct APK distribution still works today. If MundaIQ grows past a small audience, plan to register
for verification or move to a store.

### If you later publish on Google Play

Google Play re-signs new apps with **Play App Signing**. That means a Play build has a different
signature from your direct APK, so existing sideloaded users **cannot update in place** — they must
uninstall and reinstall (and should export a backup first).

Nothing else blocks a later Play release: the package name `com.mundaiq.app` stays the same, and
you can keep publishing direct APKs alongside Play.

---

## 6. Release checklist (short form)

- [ ] `expo.version` and `expo.android.versionCode` bumped in `app.json`
- [ ] `npm.cmd run typecheck` and `npm.cmd run lint` pass
- [ ] APK built with the `direct` profile
- [ ] Installed and smoke-tested on a real Android phone
- [ ] Keystore downloaded and backed up
- [ ] APK renamed `MundaIQ-<version>.apk`
- [ ] SHA-256 hash generated
- [ ] Git commit and tag pushed
- [ ] GitHub Release published with the APK attached
- [ ] Obtainium update verified from the previous version
