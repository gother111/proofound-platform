# Custom Domain Setup for proofound.io

## Step 1: Add Domain in Vercel Dashboard

1. Go to your Vercel project: https://vercel.com/dashboard
2. Click on your "proofound-mvp" project
3. Go to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter: `proofound.io`
6. Click **Add**

## Step 2: Configure DNS at Your Domain Registrar

After adding the domain in Vercel, you'll see DNS configuration instructions.

### For proofound.io, you'll need to add these DNS records:

**Option A: If you want Vercel to manage DNS:**
- Change nameservers at your domain registrar to:
  ```
  ns1.vercel-dns.com
  ns2.vercel-dns.com
  ```

**Option B: If you want to keep your current DNS provider:**
- Add an **A record** pointing to Vercel's IP:
  ```
  Type: A
  Host: @ (or blank)
  Value: 76.76.21.21
  ```
- Add a **CNAME** record for www subdomain:
  ```
  Type: CNAME
  Host: www
  Value: cname.vercel-dns.com
  ```

## Step 3: SSL Certificate

Vercel will automatically provision a free SSL certificate once DNS propagates (usually 1-24 hours).

## Step 4: Verify Setup

1. Wait for DNS propagation (check with: `dig proofound.io`)
2. Visit https://proofound.io
3. The website should load with SSL

## Quick Check Commands

```bash
# Check DNS propagation
dig proofound.io

# Test HTTPS
curl -I https://proofound.io
```

## Common Domain Registrars Setup

### GoDaddy
1. Go to DNS Management
2. Add A record for @ pointing to 76.76.21.21
3. Add CNAME record for www pointing to cname.vercel-dns.com

### Namecheap
1. Go to Advanced DNS
2. Add A record for @ pointing to 76.76.21.21
3. Add CNAME record for www pointing to cname.vercel-dns.com

### Cloudflare
1. Go to DNS settings
2. Add A record for @ pointing to 76.76.21.21
3. Add CNAME record for www pointing to cname.vercel-dns.com
4. **Important**: Set SSL/TLS mode to "Full" or "Flexible"

---

**Need help?** Check Vercel's docs: https://vercel.com/docs/concepts/projects/domains
