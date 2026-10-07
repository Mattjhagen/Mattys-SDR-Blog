# 🔒 2FA Security Checklist

## ✅ Setup Checklist (Do This Now)

### Initial Setup

- [ ] **Visit your blog:** https://mattjhagen.xyz
- [ ] **Click "Write Transmission"**
- [ ] **Choose authentication method:**
  - [ ] YubiKey (if you have one)
  - [ ] Google Authenticator (if no YubiKey yet)

### Google Authenticator Setup

- [ ] **Scan QR code** with Google Authenticator app
- [ ] **Click "Show secret key"**
- [ ] **Copy the secret key** (long string)
- [ ] **Save secret in password manager**
- [ ] **Enter 6-digit code** to complete setup
- [ ] **Close the setup modal**
- [ ] **Delete any screenshots** of the QR code

### YubiKey Setup

- [ ] **Insert YubiKey** into USB port
- [ ] **Click "Register YubiKey"**
- [ ] **Touch YubiKey** when it blinks
- [ ] **Test authentication** by logging out and back in

---

## 🔐 Security Verification

### Run This Security Check

Open browser console (F12) and paste:

```javascript
// Check what's stored
console.log('=== 2FA Security Status ===');
console.log('');
console.log('TOTP (Google Authenticator):');
console.log('  Secret exists:', !!localStorage.getItem('ham_radio_totp_secret_v1'));
console.log('  Setup complete:', localStorage.getItem('ham_radio_totp_setup_complete_v1') === 'true');
console.log('');
console.log('YubiKey (WebAuthn):');
const creds = localStorage.getItem('ham_radio_webauthn_credentials_v1');
console.log('  Registered:', !!creds && JSON.parse(creds || '[]').length > 0);
console.log('');
console.log('Session:');
const session = localStorage.getItem('ham_radio_admin_session_v1');
if (session) {
  const parsed = JSON.parse(session);
  const age = Math.round((Date.now() - parsed.timestamp) / 1000 / 60);
  console.log('  Active:', age < 1440); // 24 hours
  console.log('  Age:', age + ' minutes');
} else {
  console.log('  Active: false');
}
console.log('');
console.log('✅ This data is local to YOUR browser only');
console.log('✅ Other browsers/devices cannot access it');
```

**Expected Output:**
```
=== 2FA Security Status ===

TOTP (Google Authenticator):
  Secret exists: true
  Setup complete: true

YubiKey (WebAuthn):
  Registered: true

Session:
  Active: true
  Age: 45 minutes

✅ This data is local to YOUR browser only
✅ Other browsers/devices cannot access it
```

---

## 🚨 Red Flags (Check These)

### Someone Else Might Have Access If:

- ❌ **You shared your screen** while QR code was visible
- ❌ **You took a screenshot** and didn't delete it
- ❌ **You emailed/messaged** the secret key
- ❌ **You saved it in unencrypted notes**
- ❌ **Someone else uses your computer** without separate user accounts
- ❌ **You use public/shared computers**

### What to Do:
1. **See RESET_2FA.md** for emergency reset procedure
2. **Set up fresh credentials**
3. **Save new secret securely**

---

## 🛡️ Best Security Practices

### Physical Security

- ✅ **Lock your screen** when away from computer
- ✅ **Use YubiKey** (requires physical access)
- ✅ **Don't leave YubiKey** plugged in when away
- ✅ **Separate user accounts** if sharing computer

### Digital Security

- ✅ **Save secret in password manager** (1Password, Bitwire, etc.)
- ✅ **Enable password manager 2FA** too
- ✅ **Don't save QR screenshots** on desktop
- ✅ **Clear browser history** of 2FA setup pages
- ✅ **Use HTTPS only** (http://mattjhagen.xyz won't work)

### Access Control

- ✅ **Only access from trusted devices**
- ✅ **Don't use public computers** for admin access
- ✅ **Private/incognito mode** won't have your credentials (by design)
- ✅ **Different browser** = different credentials needed

---

## 📱 Multi-Device Setup

### Same Person, Multiple Devices

**Option 1: Share Google Authenticator Secret**
```
1. Use the SAME secret on multiple phones
2. Manually enter secret on second phone
3. Both phones generate same codes
```

**Option 2: Multiple YubiKeys**
```
Currently: One YubiKey per browser
Workaround: Use Google Authenticator on other devices
Future: Multi-key support coming
```

**Option 3: Use Both Methods**
```
Desktop: YubiKey
Laptop: YubiKey (different one)
Phone: Google Authenticator
All: Password manager backup
```

---

## 🔍 Who Can Access Your Blog Admin

### ✅ Can Access (By Design)

- **You** - From your computer/browser with 2FA
- **You** - From your phone with Google Authenticator codes
- **You** - From any device with your YubiKey
- **You** - From any device with the secret key from password manager

### ❌ Cannot Access (Security Working)

- **Other people** - Don't have YubiKey or codes
- **Other browsers** - localStorage not shared
- **Other computers** - Need to re-authenticate
- **Hackers** - Can't get in without physical access to your 2FA device

### ⚠️ Edge Cases (Be Aware)

- **Same computer, same browser, different user** - Might still work
- **Someone with your phone** - Can generate codes
- **Someone with your YubiKey** - Can authenticate
- **Someone with your secret key** - Can set up their own authenticator

**Solution:** Physical security is still important!

---

## 🔄 Regular Maintenance

### Weekly

- [ ] Test authentication still works
- [ ] Check session hasn't expired unexpectedly
- [ ] Verify YubiKey still registered

### Monthly

- [ ] Verify secret key backup still accessible
- [ ] Test recovery from backup secret
- [ ] Check password manager 2FA still enabled

### After These Events

- [ ] **Got a new phone** - Transfer Google Authenticator
- [ ] **Got a new computer** - Re-authenticate there
- [ ] **Lost YubiKey** - Use Google Authenticator backup
- [ ] **Suspect compromise** - Full reset (RESET_2FA.md)

---

## 🎯 Quick Security Test

**Test your setup right now:**

1. **Open incognito/private window**
2. **Go to:** https://mattjhagen.xyz
3. **Try to write a post**
4. **Should require 2FA** ✅
5. **Close private window**
6. **Open your normal browser**
7. **Try to write a post**
8. **If setup recently, should let you in** ✅

**If this test fails:** Something might be wrong!

---

## 📞 Emergency Contact Info

**If You Get Locked Out:**

1. **Try Google Authenticator** backup codes
2. **Try YubiKey** if you have one
3. **Use secret key** from password manager
4. **SSH to server** (if you have access)
5. **Physical access** to server as last resort

**Server Access:**
```bash
# You can clear localStorage via server
ssh matt@your-server
cd ~/Mattys-SDR-Blog
# Edit localStorage (requires browser dev tools)
```

**Current Limitation:** No remote password reset
**Future Enhancement:** Add email-based recovery

---

## 💾 Backup Your Secret Key NOW

**Do this right now if you haven't:**

1. **Open:** https://mattjhagen.xyz
2. **Click:** "Write Transmission"
3. **If first time:**
   - Click "Show secret key"
   - Copy the entire secret
4. **Save in password manager:**
   - Name: "W7SDR Blog 2FA Secret"
   - Notes: Copy the secret key here
   - Category: 2FA / Security
5. **Test recovery:**
   - Remove from Google Authenticator
   - Re-add using the saved secret
   - Generate code and verify it works

---

## ✅ You're Secure When:

- ✅ Secret saved in password manager
- ✅ Google Authenticator app installed and working
- ✅ YubiKey registered (optional but recommended)
- ✅ No QR code screenshots lying around
- ✅ Computer locked when away
- ✅ Only you know the secret key
- ✅ Only you have the YubiKey

---

**73 de W7SDR!** 📡🔐

*Security is not just software - it's habits!*
