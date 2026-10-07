# DNS Setup for Cloudflare Tunnel

## ✅ Tunnel Created Successfully!

**Tunnel Name:** mattys-sdr-blog  
**Tunnel ID:** ec54e2a6-bbb7-4ca7-895f-7c747e05bdf4  
**Credentials:** `/home/matt/.cloudflared/ec54e2a6-bbb7-4ca7-895f-7c747e05bdf4.json`

## 📝 Manual DNS Configuration Required

Since `mattjhagen.xyz` already has DNS records, you need to update them manually through the Cloudflare Dashboard.

### Option 1: Update via Cloudflare Dashboard (Easiest)

1. **Log in to Cloudflare:**
   - Visit https://dash.cloudflare.com/
   - Select your domain: `mattjhagen.xyz`

2. **Go to DNS Settings:**
   - Click on "DNS" in the left sidebar
   - Find the existing record for `@` (root domain)

3. **Update the Record:**
   - Click "Edit" on the existing record
   - Change the record type to: **CNAME**
   - Change the target/content to: **`ec54e2a6-bbb7-4ca7-895f-7c747e05bdf4.cfargotunnel.com`**
   - Set Proxy status: **Proxied** (orange cloud)
   - Save the record

4. **Add/Update www subdomain:**
   - Edit or create a CNAME record for `www`
   - Target: **`ec54e2a6-bbb7-4ca7-895f-7c747e05bdf4.cfargotunnel.com`**
   - Proxy status: **Proxied**

### Option 2: Update via CLI (Alternative)

First, you need to delete the existing records, then add new ones:

```bash
# List existing DNS records to find their IDs
# (You'll need to note the record IDs from the output)
curl -X GET "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/dns_records" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json"

# Delete old record (replace RECORD_ID)
curl -X DELETE "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/dns_records/RECORD_ID" \
  -H "Authorization: Bearer YOUR_API_TOKEN"

# Then create new CNAME
cloudflared tunnel route dns mattys-sdr-blog mattjhagen.xyz
```

## 🎯 What Your DNS Should Look Like

After updating, you should have these records:

| Type  | Name | Target                                              | Proxy Status |
|-------|------|-----------------------------------------------------|--------------|
| CNAME | @    | ec54e2a6-bbb7-4ca7-895f-7c747e05bdf4.cfargotunnel.com | Proxied      |
| CNAME | www  | ec54e2a6-bbb7-4ca7-895f-7c747e05bdf4.cfargotunnel.com | Proxied      |

## ✅ Once DNS is Updated

Continue with service deployment:

```bash
cd ~/Mattys-SDR-Blog

# Generate systemd service files
./deploy.sh

# Install services
sudo cp /tmp/mattys-sdr-blog.service /etc/systemd/system/
sudo cp /tmp/cloudflared-sdr-blog.service /etc/systemd/system/
sudo systemctl daemon-reload

# Enable and start services
sudo systemctl enable mattys-sdr-blog cloudflared-sdr-blog
sudo systemctl start mattys-sdr-blog cloudflared-sdr-blog

# Check status
sudo systemctl status mattys-sdr-blog
sudo systemctl status cloudflared-sdr-blog
```

## 🔍 Verify Deployment

```bash
# Test local server
curl http://localhost:3000

# Check tunnel is running
cloudflared tunnel info mattys-sdr-blog

# Test your domain (DNS may take 1-5 minutes to propagate)
curl -I https://mattjhagen.xyz

# View logs
sudo journalctl -u mattys-sdr-blog -f
sudo journalctl -u cloudflared-sdr-blog -f
```

## ⏰ DNS Propagation

After updating DNS records:
- Changes typically propagate in **1-5 minutes** with Cloudflare
- Check status: `dig mattjhagen.xyz` or visit https://dnschecker.org

## 🆘 Troubleshooting

If the tunnel doesn't connect:
```bash
# Test tunnel manually
cloudflared tunnel --config ~/Mattys-SDR-Blog/cloudflare-tunnel.yml run mattys-sdr-blog
```

If you see "connection established" and tunnel ID, your configuration is correct!

---

**Next:** Update DNS records via Cloudflare Dashboard → Deploy services → Visit https://mattjhagen.xyz 🎉
