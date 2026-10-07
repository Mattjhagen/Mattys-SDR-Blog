# Test Your DNS Resolution

Run these commands on YOUR computer (not the server) and share the results:

## Test 1: Check DNS via Google DNS

```bash
nslookup mattjhagen.xyz 8.8.8.8
```

**Expected:**
```
Server:		8.8.8.8
Address:	8.8.8.8#53

Name:	mattjhagen.xyz
Address: 104.21.44.200
Address: 172.67.203.169
```

## Test 2: Check DNS via Cloudflare DNS

```bash
nslookup mattjhagen.xyz 1.1.1.1
```

**Expected:** Same IPs as above

## Test 3: Check Your Default DNS

```bash
nslookup mattjhagen.xyz
```

**This shows what YOUR computer's DNS returns**

## Test 4: Try Ping

```bash
ping mattjhagen.xyz
```

**Expected:** Should show one of the Cloudflare IPs

## If Any Test Fails:

### Your DNS is the problem. Fix it by:

**Option 1: Flush DNS Cache**
- Windows: `ipconfig /flushdns` (as Administrator)
- Mac: `sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder`
- Linux: `sudo systemd-resolve --flush-caches`

**Option 2: Change DNS Server to Cloudflare**
Set your network DNS to: `1.1.1.1` and `1.0.0.1`

**Option 3: Edit Hosts File (temporary workaround)**
Add this line to your hosts file:
```
104.21.44.200  mattjhagen.xyz www.mattjhagen.xyz
```

Hosts file location:
- Windows: `C:\Windows\System32\drivers\etc\hosts`
- Mac/Linux: `/etc/hosts`

(Need admin/sudo to edit)

## Share Your Results

Tell me what you see from:
1. `nslookup mattjhagen.xyz 8.8.8.8`
2. `nslookup mattjhagen.xyz` (default DNS)
3. `ping mattjhagen.xyz`
