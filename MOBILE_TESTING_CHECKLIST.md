# Mobile Testing & Deployment Checklist

## 📱 Mobile Testing (Before Deploying)

### **iPhone/iOS Safari**
- [ ] Hero section stacks vertically (not side-by-side)
- [ ] Hero image doesn't overflow
- [ ] Category filters scroll horizontally (not wrapped)
- [ ] No horizontal page scroll
- [ ] Inputs don't zoom on focus (16px minimum font size)
- [ ] All buttons are 44px minimum (Apple guideline)
- [ ] Footer disclaimer is readable
- [ ] SDR preview card displays properly
- [ ] Navigation collapses to mobile menu (if implemented)

### **Android Chrome**
- [ ] Same checks as iOS
- [ ] Bottom nav doesn't get hidden by keyboard
- [ ] Pull-to-refresh doesn't break layout
- [ ] Dark theme renders properly

### **Tablet (iPad)**
- [ ] Hero uses 2-column layout (left text, right SDR card)
- [ ] Category filters show all in one row
- [ ] Cards use 2-column grid
- [ ] Navigation shows full labels

---

## 🎨 Accessibility (WCAG 2.1 AA)

### **Keyboard Navigation**
- [ ] All interactive elements reachable by Tab
- [ ] Visible focus indicators on all buttons
- [ ] Modal can be closed with Escape key
- [ ] No keyboard traps

### **Screen Reader**
- [ ] One H1 per page (main heading)
- [ ] All images have alt text
- [ ] Buttons have aria-label where text isn't visible
- [ ] Form inputs have associated labels
- [ ] Error messages announced

### **Color & Contrast**
- [ ] Text meets 4.5:1 contrast ratio (white on dark)
- [ ] Amber accent meets 3:1 for large text
- [ ] Link text distinguishable from body text
- [ ] No information conveyed by color alone

---

## 🚀 Pre-Deployment Checks

### **Build Test**
```bash
npm run build
npm run preview
# Visit http://localhost:4173
```

- [ ] Build succeeds without errors
- [ ] Preview loads without console errors
- [ ] All environment variables work in production build
- [ ] Images load correctly
- [ ] No 404s in Network tab

### **Environment Variables**
- [ ] `.env` file created with your details
- [ ] `VITE_OPERATOR_CITY` displays in hero
- [ ] `VITE_OPERATOR_STATE` displays in hero
- [ ] `VITE_MAIDENHEAD_GRID` displays in footer
- [ ] `VITE_HAM_CALLSIGN` shows "Pending (Studying)" correctly
- [ ] `VITE_CLUB_NAME` appears in footer

### **Content Audit**
- [ ] No "Transmission" or "Transmit" words visible
- [ ] Footer disclaimer present on all pages
- [ ] Zero counts hidden (no "0 Transmissions" shown)
- [ ] QSO Map doesn't show "(0)" when empty
- [ ] TAGS row hidden when no tags exist

### **Functional Tests**
- [ ] Can open "Log a Listen" modal
- [ ] 2FA authentication works
- [ ] CW Morse tool plays audio
- [ ] Grid calculator works
- [ ] Club nets schedule displays
- [ ] Export ADIF downloads JSON file
- [ ] Category filters work
- [ ] Search filters work
- [ ] Tag filtering works

---

## 🌐 Deployment

### **Your Current Setup (Based on Repo)**
Looks like you're using:
- Cloudflare Tunnel (`tunnel.log` exists)
- systemd service (`mattys-sdr-blog.service`)
- Port 3000 by default

### **Deploy to Production**
```bash
# 1. Build the production bundle
npm run build

# 2. Preview locally first
npm run preview

# 3. If using systemd service, restart it
sudo systemctl restart mattys-sdr-blog

# 4. Check status
sudo systemctl status mattys-sdr-blog

# 5. Check logs
journalctl -u mattys-sdr-blog -f
```

### **Cloudflare Tunnel** (if using)
```bash
# Make sure your tunnel is running
cloudflared tunnel info

# Routes should point to localhost:3000
# Check cloudflare-tunnel.yml
```

---

## 🔍 Post-Deployment Verification

### **Production Site**
- [ ] Visit your public URL (e.g., mattjhagen.xyz)
- [ ] All pages load correctly
- [ ] No console errors in DevTools
- [ ] Images load (check /images/ path)
- [ ] Mobile view works on real device
- [ ] HTTPS certificate valid

### **SEO & Meta**
- [ ] Page title shows correctly
- [ ] Meta description present
- [ ] Favicon displays
- [ ] Open Graph tags present (optional)

---

## 🐛 Common Issues & Fixes

### **Environment variables not showing**
```bash
# Vite requires rebuild for .env changes
npm run build
```

### **Images not loading**
```bash
# Check public/ directory structure
ls -la public/images/
# Should contain Matt-at-Ham.png
```

### **Horizontal scroll on mobile**
```bash
# Open DevTools → Device Toolbar
# Look for elements wider than viewport
# Check: hero image, SDR card, filter buttons
```

### **Port 3000 already in use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
# Or change port in .env
PORT=3001
```

---

## 📊 Lighthouse Scores to Aim For

Run in Chrome DevTools → Lighthouse:
- **Performance:** 90+ (green)
- **Accessibility:** 95+ (green)
- **Best Practices:** 90+ (green)
- **SEO:** 90+ (green)

Common deductions:
- Missing alt text → Fix: add to all images
- Contrast too low → Already fixed (white on dark)
- Tap targets too small → Already fixed (44px min)

---

## ✅ Final Pre-Launch Checklist

- [ ] All P0 fixes implemented ✅
- [ ] `.env` configured with your details
- [ ] Build succeeds (`npm run build`)
- [ ] Mobile tested on real device
- [ ] Accessibility checks pass
- [ ] Footer disclaimer visible
- [ ] No "transmission" language anywhere
- [ ] Production deployment tested
- [ ] DNS/tunnel configured correctly
- [ ] HTTPS certificate valid

---

## 🎉 You're Ready to Launch!

When you're confident:
1. Deploy to production
2. Test on multiple devices
3. Share with your club
4. Start logging those SWL catches!
5. Study for your Technician exam 📚

**73 DE [YOUR-CALLSIGN-WHEN-LICENSED]! 📻**

---

*Last updated: 2026-10-08*
