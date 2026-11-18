# MundaIQ — free distribution with GitHub Releases + Obtainium

This is the default release track for MundaIQ. It costs nothing, needs no store account, and lets
users install and update the app without Google Play.

**How it works**

1. A local Gradle build produces a signed `.apk` (no build service, no account).
2. You attach that `.apk` to a GitHub Release (for example tag `v1.0.0`).
3. Users install [Obtainium](https://github.com/ImranR98/Obtainium) once, add your GitHub repo URL,
   and Obtainium installs the latest APK and offers updates when you publish a new release.

You can still publish on Google Play later — see the warning about signing keys at the end.

---

## 0. One-time setup

### Tools

The build runs entirely on this machine. It needs:

- **Git for Windows** — installed at `%LOCALAPPDATA%\Programs\PortableGit`
- **JDK 17** — `C:\Users\ADMIN\.jdks\jdk-17.0.20.1+1`
- **Android SDK** — `C:\Users\ADMIN\AppData\Local\Android\Sdk` (platform 36, build-tools 36)

No Expo account is required.

### Create the account

- [ ] Free GitHub account: <https://github.com/signup>
- [ ] Turn on two-factor authentication.

### Put the project under version control

The repository is **<https://github.com/tanatswamatumbi5-png/MundaIQ>** (public). If you ever
recreate it, create an **empty** repository (no README, no .gitignore, no licence — the project
already has those). Then:

```powershell
git remote add origin https://github.com/tanatswamatumbi5-png/MundaIQ.git
git push -u origin main
```

> The repo can be private. Obtainium works with private repos only if the user supplies a GitHub
> token, so use **public** if you want the simplest install experience.

### Signing key — do this once, then never lose it

The release key already exists at:

```
C:\Users\ADMIN\mundaiq-signing\mundaiq-release.jks
```

Its alias, password and certificate fingerprints are recorded in
`C:\Users\ADMIN\mundaiq-signing\KEYSTORE-INFO.txt`. The build reads the key through Gradle
properties in `C:\Users\ADMIN\.gradle\gradle.properties`, which is **outside** the repository:

```properties
MUNDAIQ_UPLOAD_STORE_FILE=C:/Users/ADMIN/mundaiq-signing/mundaiq-release.jks
MUNDAIQ_UPLOAD_KEY_ALIAS=mundaiq
MUNDAIQ_UPLOAD_STORE_PASSWORD=...
MUNDAIQ_UPLOAD_KEY_PASSWORD=...
```

`.gitignore` excludes `*.jks` and `*.keystore`, so the key can never be committed by accident.

**Back the key up three ways:** password manager, offline drive, and private cloud storage. Test a
backup with:

```powershell
keytool -list -keystore C:\Users\ADMIN\mundaiq-signing\mundaiq-release.jks -alias mundaiq
```

If you lose this key:

- You cannot ship an update that installs over the existing app.
- Users must uninstall (losing local data unless they exported a backup) and reinstall.
- Google Play cannot recover it for a directly distributed app.

---

## 1. Build the APK

One command does everything — it regenerates the native project, applies the release signing config
and runs Gradle:

```powershell
cd "C:\Users\ADMIN\Documents\Default Project\munda-iq"
npm.cmd run build:android
```

What the script (`scripts/build-android-release.mjs`) does:

1. Verifies the signing properties in `~/.gradle/gradle.properties` exist.
2. Runs `expo prebuild --platform android` to regenerate `android/` (not committed).
3. Patches `android/app/build.gradle` so `release` is signed with the real key instead of the
   debug key. This patch is reapplied on every build, so regenerating `android/` is safe.
4. Runs `gradlew.bat assembleRelease`.
5. Copies the result to `release/MundaIQ-<version>.apk` and writes a `.sha256` file.

The first build downloads Gradle and the Android dependencies, so it is slow. Later builds reuse the
cache and take a few minutes.

### Optional: verify the build

```powershell
$sdk = "$env:LOCALAPPDATA\Android\Sdk"
& "$sdk\build-tools\36.0.0\aapt.exe" dump badging .\release\MundaIQ-1.0.0.apk |
  Select-String "package|targetSdkVersion"
```

Confirm:

- `package: name='com.mundaiq.app'`
- `versionCode='1'` (or higher on later releases)
- `targetSdkVersion:'36'`

Check it is signed with the release key, not the debug key:

```powershell
& "$sdk\build-tools\36.0.0\apksigner.bat" verify --print-certs .\release\MundaIQ-1.0.0.apk
```

The SHA-256 digest must match `KEYSTORE-INFO.txt`.

### Smoke-test on a real phone

Install the APK directly (copy it to the phone or use `adb install`), then run the test script in
`docs/release-checklist.md` → section 2.

```powershell
adb install -r .\release\MundaIQ-1.0.0.apk
```

---

## 2. Publish the GitHub Release

1. Open your repo on GitHub → **Releases** → **Draft a new release**.
2. **Choose a tag** → type `v1.0.0` → **Create new tag on publish**.
3. Title: `MundaIQ 1.0.0`.
4. Description: use the release notes below.
5. Attach `release/MundaIQ-1.0.0.apk`.
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

SHA-256: <paste release/MundaIQ-1.0.0.apk.sha256>
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
   npm.cmd run build:android
   ```

4. The script names the artifact `release/MundaIQ-1.0.1.apk` for you.
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
| Local Gradle build | Free, unlimited, no account or build queue. |
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
- [ ] `npm.cmd run build:android` completes
- [ ] APK signed with the release key (`apksigner verify --print-certs`)
- [ ] Installed and smoke-tested on a real Android phone
- [ ] Keystore backed up in three places
- [ ] SHA-256 hash recorded
- [ ] Git commit and tag pushed
- [ ] GitHub Release published with the APK attached
- [ ] Obtainium update verified from the previous version
