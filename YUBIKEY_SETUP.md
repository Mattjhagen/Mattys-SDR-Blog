# 🔑 YubiKey Authentication Setup

## Overview

Your blog now supports **YubiKey hardware security keys** in addition to Google Authenticator! YubiKeys provide the highest level of security using FIDO2/WebAuthn standards.

---

## ✅ What's New

**Two Authentication Methods:**
1. **Google Authenticator** - Time-based codes (TOTP)
2. **YubiKey** - Hardware security key (FIDO2/WebAuthn)

You can use **either method** or set up **both** as backup options!

---

## 🔐 Why Use a YubiKey?

### Security Benefits
- ✅ **Phishing-resistant** - Impossible to intercept or replay
- ✅ **No codes to type** - Just touch the button
- ✅ **Works offline** - No phone or network needed
- ✅ **Hardware-backed** - Cryptographic keys stored in secure hardware
- ✅ **Fast authentication** - Touch and you're in

### Compared to Google Authenticator
| Feature | Google Authenticator | YubiKey |
|---|---|---|
| **Security Level** | High | Highest |
| **Phishing Protection** | No | Yes |
| **Device Required** | Phone | YubiKey hardware |
| **Offline** | Yes | Yes |
| **Speed** | Type 6 digits | Touch button |
| **Cost** | Free | ~$25-70 |

---

## 🛒 Getting a YubiKey

### Recommended Models for Ham Radio Blog

**Best for Most Users:**
- **YubiKey 5 NFC** ($55) - USB-A + NFC for mobile
- **YubiKey 5C NFC** ($55) - USB-C + NFC for modern laptops

**Budget Option:**
- **Security Key NFC** ($29) - FIDO2/WebAuthn only (perfect for this use case!)

**Where to Buy:**
- https://www.yubico.com/store/
- Amazon (verify seller is Yubico)
- Major electronics retailers

---

## 🚀 Setting Up YubiKey

### First Time Setup

1. **Click "Write Transmission"** on your blog
2. **Choose "YubiKey"** method (right side)
3. **Insert your YubiKey** into a USB port
4. **Click "Register YubiKey"**
5. **Touch the YubiKey** when it blinks/flashes
6. **Done!** Your YubiKey is now registered

### Browser Compatibility

**Fully Supported:**
- ✅ Chrome/Edge (Desktop & Android)
- ✅ Firefox (Desktop & Android)
- ✅ Safari (Desktop & iOS 14+)
- ✅ Brave
- ✅ Opera

**Requirements:**
- HTTPS connection (works on https://mattjhagen.xyz)
- Modern browser with WebAuthn support

---

## 🔄 Using Both Methods

You can set up **both** Google Authenticator and YubiKey!

### Setup Process

1. **First, set up Google Authenticator** (recommended)
   - Provides a backup if you lose your YubiKey
   
2. **Then add YubiKey**
   - Switch to YubiKey tab during authentication
   - Register your key
   - Now you have two options!

### Switching Between Methods

When prompted for authentication:
- **Top of modal** shows method selector
- **Google Authenticator** (left) - Enter 6-digit code
- **YubiKey** (right) - Touch hardware key

Choose whichever is more convenient at the time!

---

## 📱 Mobile Support

### NFC-Enabled YubiKeys

If you have a YubiKey with NFC (like YubiKey 5 NFC):

**iOS (iPhone/iPad):**
1. Open blog in Safari
2. Tap "Write Transmission"
3. Choose YubiKey
4. Hold YubiKey against top of iPhone
5. Touch YubiKey button when prompted

**Android:**
1. Open blog in Chrome or Firefox
2. Tap "Write Transmission"
3. Choose YubiKey
4. Hold YubiKey against back of phone
5. Touch YubiKey button when prompted

**Without NFC:**
- Use Google Authenticator on mobile
- Use YubiKey on desktop/laptop

---

## 🔧 Technical Details

### How It Works

**YubiKey Authentication Uses:**
- **Protocol:** FIDO2/WebAuthn
- **Encryption:** Public-key cryptography
- **Storage:** Credentials stored in browser localStorage
- **Challenge-Response:** Server generates unique challenge each time
- **User Verification:** Touch button confirms physical presence

**Security Features:**
- Private key never leaves the YubiKey
- Each authentication requires physical touch
- Impossible to phish or remotely compromise
- Works only on registered domain (mattjhagen.xyz)

### Storage Keys (localStorage)

```javascript
ham_radio_webauthn_credentials_v1  // Registered credential IDs
ham_radio_webauthn_challenge_v1    // Current authentication challenge
```

---

## 🛠️ Troubleshooting

### "YubiKey Not Supported"

**Cause:** Browser doesn't support WebAuthn

**Solutions:**
1. Update your browser to the latest version
2. Use Chrome, Firefox, Edge, or Safari
3. Ensure you're on HTTPS (not HTTP)
4. Fall back to Google Authenticator

### "Registration Cancelled or Timed Out"

**Cause:** YubiKey wasn't touched within 60 seconds

**Solutions:**
1. Click "Register YubiKey" again
2. Touch the YubiKey button **immediately** when it blinks
3. Make sure YubiKey is fully inserted

### "Security Error"

**Cause:** Not using HTTPS or domain mismatch

**Solutions:**
1. Access via https://mattjhagen.xyz (not http://)
2. Don't use IP address or localhost
3. Clear browser cache and try again

### YubiKey Not Blinking

**Possible Issues:**
1. **Wrong USB port** - Try a different port
2. **USB hub** - Connect directly to computer
3. **Power saving** - Disable USB selective suspend
4. **Driver issue** - YubiKeys work with built-in drivers (no software needed)

### "Failed to Register YubiKey"

**Solutions:**
1. Try a different USB port
2. Remove and reinsert YubiKey
3. Restart browser
4. Check YubiKey with https://demo.yubico.com/webauthn-technical
5. Try a different browser

---

## 🔄 Resetting YubiKey Registration

If you need to re-register your YubiKey:

```javascript
// In browser console (F12):
localStorage.removeItem('ham_radio_webauthn_credentials_v1');
localStorage.removeItem('ham_radio_webauthn_challenge_v1');
```

Then refresh the page and register again.

---

## 🔒 Best Practices

### Backup Strategy

**Recommended Setup:**
1. **Primary:** YubiKey for daily use
2. **Backup:** Google Authenticator on phone
3. **Emergency:** Save TOTP secret key in password manager

**Why Multiple Methods?**
- If you lose YubiKey → Use Google Authenticator
- If phone dies → Use YubiKey
- Never get locked out!

### Multiple YubiKeys

**Can you register multiple YubiKeys?**
- Currently: One YubiKey per browser
- Workaround: Use different browsers
- Alternative: Keep Google Authenticator as universal backup

**Future Enhancement:**
- Support for multiple registered YubiKeys per account
- Would require backend database (currently client-side only)

---

## 🎯 Quick Start Guide

### New User (Never Set Up 2FA)

1. Click "Write Transmission"
2. Choose "YubiKey" (if you have one) or "Google Authenticator"
3. Follow setup instructions
4. Done!

### Existing User (Already Have Google Authenticator)

1. Click "Write Transmission"
2. Enter your Google Authenticator code to get in
3. Set up YubiKey for next time (optional):
   - Edit localStorage or wait for multi-key support
4. Next time: Choose YubiKey tab and use hardware key!

---

## 📊 Comparison Matrix

### When to Use Each Method

| Situation | Recommended Method |
|---|---|
| At your shack (desktop) | YubiKey |
| On the go (mobile) | Google Authenticator |
| Maximum security | YubiKey |
| No hardware available | Google Authenticator |
| Quick authentication | YubiKey (just touch) |
| Shared computer | YubiKey (removable) |
| Multiple devices | Google Authenticator (one phone, many devices) |

---

## 🌐 WebAuthn Resources

**Learn More:**
- https://webauthn.guide/ - Excellent visual guide
- https://www.yubico.com/authentication-standards/fido2/ - FIDO2 overview
- https://developers.yubico.com/ - Developer documentation

**Test Your YubiKey:**
- https://demo.yubico.com/webauthn-technical - WebAuthn test
- https://webauthn.io/ - Interactive WebAuthn demo

---

## 🎉 Summary

**What You Get:**
- ✅ Hardware-level security with YubiKey
- ✅ Fallback with Google Authenticator
- ✅ Choose method per authentication
- ✅ Fast, phishing-resistant authentication
- ✅ Works on desktop and mobile (with NFC)

**Best Practice:**
Set up **both** methods for redundancy!

---

**73 de W7SDR!** 📡🔑

*Making Radio Transmissions More Secure, One YubiKey at a Time*

---

**Need Help?**
- Check troubleshooting section above
- Test at: https://demo.yubico.com/webauthn-technical
- See AUTHENTICATION_AND_VISITOR_LOG.md for Google Authenticator setup

**Hardware Not Working?**
- Reset with browser console commands above
- Try different browser
- Verify HTTPS connection
- Check USB port/connection

---

**End of YubiKey Setup Guide**
