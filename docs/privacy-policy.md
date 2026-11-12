# MundaIQ Privacy Policy

**Effective date:** 2 November 2026

MundaIQ is an offline egg-production record keeper for layer farms. This policy explains what
happens to the information you enter into the app. In short: it stays on your phone unless you
choose to export it.

## Who we are

MundaIQ is published by **[YOUR NAME OR BUSINESS NAME]** ("we", "us").
Contact: **[YOUR SUPPORT EMAIL]**

## Information you enter

You can record flocks, cage details, daily egg collections, mortality, feed use and expenses.
These records are stored only in the app's private storage on your device.

- They are encrypted at rest with XChaCha20-Poly1305.
- The encryption key is generated on your device and kept in the Android keystore through
  `expo-secure-store`.
- We do not operate a server that receives these records. The app makes no network requests to
  us, and there is no account, cloud sync or remote backup.

## App lock and biometrics

App lock is optional and off by default. If you turn it on:

- Your PIN is stored only as a salted, slow PBKDF2 hash in the Android keystore.
- Fingerprint or face unlock is performed by Android. The app receives only a success or failure
  result and never receives your biometric data.
- While app lock is on, the app asks Android to block screenshots and to hide its content from the
  recent-apps thumbnail.

If you forget your PIN, the records cannot be recovered without deleting the app's data.

## Exports and sharing

You can export a JSON backup from **More → Export backup**. The export is **not encrypted**, so it
can be restored on another phone. When you export, Android's share sheet lets you choose where the
file goes (for example, a cloud drive, email or messaging app). Once you share the file, it is
handled by the app or service you chose and is no longer under MundaIQ's control.

## Data collection, analytics and advertising

MundaIQ does **not** collect, transmit or sell personal data. The app contains:

- no analytics or crash-reporting SDK;
- no advertising or tracking SDK;
- no account system;
- no third-party sign-in; and
- no network API keys.

## Permissions

The app uses Android's biometric APIs for optional fingerprint or face unlock. It does not request
location, camera, microphone, contacts, SMS or broad storage access. Import and export use
Android's system file picker and share sheet, so the app does not need permission to read your
whole storage.

## Retention and deletion

Records remain on your device until you delete them.

- **Delete everything in the app:** More → Delete all data. This removes the records, the
  encryption key and the app-lock PIN.
- **Uninstall the app:** Android removes the app's private storage. Android cloud backup is
  disabled for MundaIQ (`allowBackup: false`), so an uninstall does not leave a restorable copy in
  Google's backup service.
- **Exported files:** files you exported are outside the app. Delete them from wherever you saved
  them.

## Children

MundaIQ is a farm business tool and is not directed at children under 13. We do not knowingly
collect information from children.

## Changes to this policy

If this policy changes, the new version will be published at the same URL with a new effective
date. Material changes will also be noted in the app's Play Store listing.

## Contact

Questions about this policy or your data: **[YOUR SUPPORT EMAIL]**

---

### Hosting this policy for Google Play

Google Play requires a public, non-editable URL (not a PDF). You can host this file with GitHub
Pages, Cloudflare Pages, Notion's public page, or any static host. Replace the bracketed
placeholders before publishing, then paste the URL into **Play Console → App content → Privacy
policy**.
