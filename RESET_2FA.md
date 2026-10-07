# 🔄 How to Reset 2FA (If Compromised)

## Emergency Reset Procedure

If someone might have your QR code or secret key, **reset everything immediately**.

---

## Method 1: Browser Console Reset (Fastest)

1. **Open your blog:** https://mattjhagen.xyz
2. **Press F12** to open developer console
3. **Paste this code:**

```javascript
// Remove all 2FA credentials
localStorage.removeItem('ham_radio_totp_secret_v1');
localStorage.removeItem('ham_radio_totp_setup_complete_v1');
localStorage.removeItem('ham_radio_webauthn_credentials_v1');
localStorage.removeItem('ham_radio_webauthn_challenge_v1');
localStorage.removeItem('ham_radio_admin_session_v1');

console.log('✅ All 2FA credentials cleared!');
```

4. **Refresh the page**
5. **Set up 2FA again** with a NEW secret
6. **Save the NEW secret** in your password manager
7. **Delete the old secret** from Google Authenticator

---

## Method 2: Google Authenticator App Reset

If you just need to remove the old entry:

1. **Open Google Authenticator** on your phone
2. **Tap the account** (W7SDR Blog)
3. **Tap the trash icon** or "Delete"
4. **Confirm deletion**
5. **Set up again** from blog with NEW QR code

---

## Method 3: Complete Browser Data Clear

**Nuclear option** (clears everything):

1. **Chrome/Edge:** Settings → Privacy → Clear browsing data
2. **Select:** Cookies and site data
3. **Time range:** All time
4. **Clear data**

⚠️ **Warning:** This logs you out of ALL websites!

---

## After Reset Checklist

- [ ] Old TOTP secret removed from Google Authenticator
- [ ] Old TOTP secret removed from password manager
- [ ] New TOTP secret saved in password manager
- [ ] New QR code scanned in Google Authenticator
- [ ] Tested authentication with new codes
- [ ] YubiKey re-registered (if using)
- [ ] Old screenshots/photos with QR code deleted

---

## Prevention for Next Time

**Do This Right After Setup:**

1. ✅ Save secret key in password manager immediately
2. ✅ Don't leave QR code visible on screen
3. ✅ Don't screenshot the QR code (or delete immediately after)
4. ✅ Lock your computer when away
5. ✅ Don't share your screen while QR code is visible
6. ✅ Use YubiKey as primary (no codes to intercept)

---

## Emergency Access Recovery

**If you lose access completely:**

1. You'll need **physical access** to the server
2. Or **server SSH access** to modify localStorage
3. Or **database access** (if we add backend storage later)

**Current setup:** Client-side only (localStorage)
**This means:** No remote password reset possible
**Solution:** Keep backups of your secret key!

---

## Backup Strategy

**Recommended:**

1. **Primary:** YubiKey (daily use)
2. **Backup 1:** Google Authenticator on phone
3. **Backup 2:** Secret key in password manager
4. **Backup 3:** Paper copy in safe

**Why 3 backups?**
- Lose YubiKey → Use Google Authenticator
- Phone breaks → Use password manager secret
- Both lost → Use paper backup
- Never get locked out!

---

**73 de W7SDR!** 📡🔒

*Stay secure, stay on the air!*
