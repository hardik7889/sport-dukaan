# Sport Dukaan 🏆

Khel ka asli ghar — sports equipment ki 3D wali online dukaan. Single-page static site, koi backend nahi.

## Kya hai ismein

- **30 products**, 6 categories (Cricket, Football, Rackets, Fitness, Apparel, More) — har card par apni 3D-style SVG art, price, MRP aur discount.
- **3D hero** — Three.js se wireframe globe + particles, extruded 3D headline, cards par mouse-tilt.
- **Cart + Checkout** — quantity controls, COD/UPI, address, order ID.
- **Multi-select** — kai products tick karke ek saath cart mein daalo ya bulk buy karo.
- **My Orders** — status timeline ke saath apne orders dekho.
- **Owner Panel** (My Orders page ke neeche) — stats, filters, search, accept/cancel/deliver actions, revenue, WhatsApp number setting, naya-order alert (chime + notification).
- **WhatsApp** — order ID ke saath pre-filled message, ek tap mein bhejo.

## Delivery fee

- ₹49 flat per order
- ₹999 ya usse zyada par **FREE**

## Owner panel

My Orders page → **Owner Panel** → password: `sport123`

Panel mein apna WhatsApp number set kar lo (wahi number order alerts aur "WhatsApp par bhejo" button mein use hoga).

## Files

| File | Kaam |
|---|---|
| `index.html` | poora app — router, cart, checkout, orders, owner panel |
| `product-photos.js` | har product ki **real photo** (CC-licensed) + LQIP + credits |
| `product-art.js` | photo na mile to dikhne wala SVG art fallback |
| `holo.js` | Three.js hero scene, 3D headline, card tilt |
| `notify.js` | naya-order alert (chime + desktop notification) |

## Real photos

`img/*.webp` — 30 product photos, sab CC-licensed (Openverse / Wikimedia Commons se).
Har photo ke saath creator + license `product-photos.js` mein hai, aur footer mein
attribution line bhi dikhti hai.

Naye/aur photos dhoondhne ke liye:

```bash
python tools/fetch_photos.py            # Openverse se sab (threaded)
python tools/fetch_commons.py           # missing ko Commons se
python tools/fetch_recheck.py           # strict quality gate ke saath dobara
python tools/fetch_curated.py           # exact Commons filename se
```

Pipeline: search → title filter → download → brightness/sharpness gate →
auto-level + crop + vignette → WebP + LQIP base64 → `product-photos.js`.

## Data

Sab kuch browser ke `localStorage` mein rehta hai (`sport_orders`, `sport_cart`). Do tabs ek hi browser mein sync hote hain; alag-alag devices sync nahi karte — uske liye backend chahiye.

## Local chalane ke liye

```bash
python -m http.server 8000
# phir http://localhost:8000 kholko
```
