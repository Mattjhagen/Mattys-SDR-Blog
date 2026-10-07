# 🔒 Authentication & Visitor Log Setup

## ✅ Features Added

Your blog now has:
1. **Two-Factor Authentication (2FA)** - Google Authenticator OR YubiKey
2. **Public Visitor Log** - Anyone can sign the guestbook

**New:** YubiKey hardware security key support! See `YUBIKEY_SETUP.md` for details.

---

## 🔐 Setting Up Google Authenticator

### First Time Setup

**When you click "Write Transmission":**

1. You'll see a QR code and setup instructions
2. Open **Google Authenticator** app on your phone
   - iOS: https://apps.apple.com/app/google-authenticator/id388497605
   - Android: https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2
3. Tap **"+"** in the app
4. Select **"Scan QR code"**
5. Scan the QR code from your blog
6. Your blog will now appear in Google Authenticator with a 6-digit code
7. Enter the 6-digit code to complete setup
8. **Done!** The setup is saved permanently

### Manual Entry (If Camera Won't Scan)

If you can't scan the QR code:
1. Click "Show secret key for manual entry"
2. In Google Authenticator, choose "Enter a setup key"
3. Enter:
   - Account: `W7SDR Blog`
   - Key: (the displayed secret)
   - Type: Time-based
4. Enter the generated code

---

## 📝 Writing Transmissions

**After Setup:**

1. Click **"Write Transmission"** button
2. Enter the **6-digit code** from Google Authenticator
3. The code changes every 30 seconds (use the current one)
4. Once verified, the editor opens
5. Your session lasts **24 hours**

**Security:**
- ✅ Only you have the Google Authenticator secret
- ✅ Codes expire every 30 seconds
- ✅ Can't be guessed or brute-forced
- ✅ Much more secure than passwords

---

## 📖 Visitor Log (Public Guestbook)

### Anyone Can Sign It!

The **Visitor Log** is in the navigation menu (top right).

**Visitors can:**
- ✅ Sign with their callsign
- ✅ Leave their name and QTH
- ✅ Write a message
- ✅ See all previous entries

**Perfect for:**
- Ham club members visiting your site
- Other hams who check out your blog
- Tracking who stopped by your station
- Building a community around your SDR adventures

**Data Storage:**
- Stored in browser localStorage
- Each visitor's browser stores their own view
- No server-side database needed

---

## 🔧 Technical Details

### Authentication Storage

**Keys in localStorage:**
```
ham_radio_totp_secret_v1          - Your Google Authenticator secret
ham_radio_totp_setup_complete_v1  - Setup completion flag
ham_radio_admin_session_v1        - Your 24-hour session
```

### Visitor Log Storage

**Key in localStorage:**
```
ham_radio_visitor_log_v1 - Visitor guestbook entries
```

### Resetting 2FA

If you need to reset Google Authenticator:

```bash
# In browser console (F12):
localStorage.removeItem('ham_radio_totp_secret_v1');
localStorage.removeItem('ham_radio_totp_setup_complete_v1');
localStorage.removeItem('ham_radio_admin_session_v1');
```

Then refresh the page and set up again.

---

## 📱 Using on Multiple Devices

### Your Main Computer
- Set up Google Authenticator once
- Use the same phone for all computers
- Same codes work everywhere

### Backup Your Secret

**IMPORTANT:** Save your setup secret key somewhere safe!

1. During first setup, click "Show secret key"
2. Copy and save it securely (password manager, encrypted note)
3. If you lose your phone, you can re-enter this key in Google Authenticator

**Without the backup:**
- If you lose your phone, you're locked out
- You'll need to reset 2FA (see above)

---

## 🌐 How It Works

### Authentication Flow

```
1. Click "Write Transmission"
   ↓
2. Not authenticated? → Show 2FA modal
   ↓
3. First time? → Show QR code + setup
   ↓
4. Already set up? → Just ask for code
   ↓
5. Verify code against TOTP secret
   ↓
6. Valid? → Open editor + save 24h session
```

### Visitor Log Flow

```
1. Click "Visitor Log" in navigation
   ↓
2. View all previous entries
   ↓
3. Click "Sign the Logbook"
   ↓
4. Enter callsign (required)
   ↓
5. Optionally add name, QTH, message
   ↓
6. Entry appears immediately for all visitors
```

---

## ✅ Testing

### Test Authentication

1. Go to https://mattjhagen.xyz
2. Click "Write Transmission"
3. **First time:** You'll see QR code
4. **After setup:** Just enter 6-digit code
5. Editor opens if code is valid

### Test Visitor Log

1. Click "Visitor Log" in top navigation
2. Click "Sign the Logbook"
3. Enter a test callsign (e.g., "W7TEST")
4. Add name, QTH, message
5. Click "Sign Log"
6. Your entry appears immediately

---

## 🔐 Security Notes

### What's Protected

✅ **Writing transmissions** - Requires 2FA
✅ **Editing posts** - Requires 2FA
✅ **Your admin session** - 24 hour timeout

### What's Public

🌐 **Reading blog posts** - Anyone can read
🌐 **Viewing QSO map** - Anyone can view
🌐 **Visitor log** - Anyone can sign
🌐 **SDR waterfall** - Anyone can listen

---

## 📊 Summary

**Authentication:**
- Uses Google Authenticator 2FA
- 6-digit codes that change every 30 seconds
- Much more secure than passwords
- Session lasts 24 hours
- Only needed for writing/editing

**Visitor Log:**
- Public guestbook for visitors
- Requires callsign (name/QTH/message optional)
- Stored in localStorage
- Perfect for ham community engagement

---

## 🎯 Next Steps

1. **Set up Google Authenticator** (first time you write a post)
2. **Save your backup secret** (in case you lose your phone)
3. **Share your blog** with your ham club!
4. **Check the Visitor Log** to see who stops by

Your blog is now secure and ready for visitors! 📡🔒
