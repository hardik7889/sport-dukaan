#!/usr/bin/env python3
"""
Doosra charan: pehle se liye gaye photos mein se jo weak/clipart/scene lage,
unhe strict filters ke saath dobara curate karo.

Strict:
  - creator/title se clipart-stock sources hataye (openclipart, shutterstock, ...)
  - bright >= 92, sharp >= 22, width >= 600
  - commercial-safe license
  - sabse sharp + bada candidate jeetata hai
"""
import os
import re
import sys
import json
import time
import io
import requests
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fetch_photos as fp          # noqa: E402
import fetch_commons as fc         # noqa: E402

CLIPART_SRC = re.compile(r'openclipart|clipart|vector|shutterstock|istock|getty|alamy|'
                         r'dreamstime|123rf|bigstock|adobe\s?stock|stock\.png|pixabay\.com', re.I)
OK_LIC = re.compile(r'(CC0|^by$|^by-sa$|^pdm$|public domain|PDM|CC BY(-SA)? \d\.\d)', re.I)

BRIGHT_MIN = 92
SHARP_MIN = 22
MIN_W, MIN_H = 600, 420

# id -> (queries, must, excl)
TARGETS = {
    'ball1':   (['cricket ball closeup', 'red cricket ball', 'cricket ball leather sport',
                 'cricket ball on grass'], r'cricket.{0,25}ball|ball.{0,25}cricket', None),
    'gloves1': (['cricket batting gloves pair', 'batting gloves white cricket',
                 'cricket gloves sport', 'batting gloves padded'], r'glove', None),
    'kitbag1': (['sports duffel bag', 'gym kit bag', 'sports bag large', 'duffel bag gym'],
                r'bag', r'backpack|handbag|purse|luggage|golf'),
    'stumps1': (['cricket stumps bails', 'cricket stumps closeup', 'cricket wickets bails',
                 'stumps cricket bail'], r'stump|wicket|bail',
                r'player|match|game|stadium|person'),
    'helmet1': (['cricket helmet front', 'cricket helmet grill', 'cricket headguard sport',
                 'cricket helmet protection'], r'helmet|head ?guard|headguard', None),
    'shuttle1': (['badminton shuttlecocks tube', 'badminton shuttlecock feathers',
                  'shuttlecock badminton sport', 'feather shuttlecock'],
                 r'shuttle', r'diagram|illustrat|chart'),
    'bottle1': (['steel water bottle sport', 'reusable sports bottle', 'water bottle gym sport',
                 'insulated water bottle'], r'bottle|flask', r'poster|chart|phases|advert'),
    'bd1':     (['badminton racket closeup', 'badminton racket shuttle sport',
                 'badminton racquet strings'], r'badminton', None),
    'tn1':     (['tennis racket isolated', 'tennis racket strings closeup',
                 'tennis racquet on court', 'tennis racket equipment'],
                 r'tennis.{0,25}(racket|racquet)|(racket|racquet).{0,25}tennis',
                 r'woman|man|player|girl|boy|person|model'),
    'mat1':     (['yoga mat rolled up', 'exercise mat roll', 'yoga mat fitness equipment',
                  'rolled yoga mat'], r'\bmat\b', r'mattress|doormat|floor mat|matting|people|users|class'),
    'kb1':     (['kettlebell black cast iron', 'kettlebell weight fitness',
                 'kettlebell gym equipment'], r'kettle', r'class|masterclass|workout plan|chart'),
}

session_global = None


def s():
    global session_global
    if session_global is None:
        session_global = requests.Session()
        session_global.headers.update(fc.UA)
    return session_global


def ov_cands(term, must_rx, excl_rx):
    out = []
    for r in fp.search(term, s()):
        title = (r.get('title') or '').strip()
        lic = (r.get('license') or '').strip().lower()
        url = r.get('url') or ''
        creator = (r.get('creator') or 'Unknown').strip()
        if not url or not title:
            continue
        if not OK_LIC.search(lic) or CLIPART_SRC.search(title) or CLIPART_SRC.search(creator):
            continue
        if fp.BAD_TITLE.search(title) or (excl_rx and excl_rx.search(title)):
            continue
        if must_rx and not must_rx.search(title):
            continue
        out.append({'title': title, 'url': url, 'lic': lic.upper(),
                    'creator': creator, 'src': r.get('foreign_landing_url') or url})
    return out


def cm_cands(term, must_rx, excl_rx):
    out = []
    for pg in fc.search(term, s()):
        ii = (pg.get('imageinfo') or [{}])[0]
        title = (pg.get('title') or '').replace('File:', '').strip()
        url = ii.get('thumburl') or ii.get('url') or ''
        mime = ii.get('mime') or ''
        if not url or mime not in ('image/jpeg', 'image/png', 'image/webp'):
            continue
        meta = ii.get('extmetadata') or {}
        lic = ((meta.get('LicenseShortName') or {}).get('value') or '').strip()
        artist = re.sub('<[^>]+>', '', ((meta.get('Artist') or {}).get('value') or 'Unknown')).strip()
        if not OK_LIC.search(lic) or CLIPART_SRC.search(title) or CLIPART_SRC.search(artist):
            continue
        if fp.BAD_TITLE.search(title) or (excl_rx and excl_rx.search(title)):
            continue
        if must_rx and not must_rx.search(title):
            continue
        out.append({'title': title, 'url': url, 'lic': lic.upper(), 'creator': artist,
                    'src': ii.get('descriptionurl') or url,
                    'w': ii.get('width') or 0, 'h': ii.get('height') or 0})
    return out


def try_download(c):
    try:
        r = s().get(c['url'], timeout=40)
        if r.status_code != 200:
            return None
        im = Image.open(io.BytesIO(r.content))
        im.load()
    except Exception:
        return None
    if im.width < MIN_W or im.height < MIN_H:
        return None
    b, sh = fp.quality(im)
    if b < BRIGHT_MIN or sh < SHARP_MIN:
        print(f'      reject {c["title"][:40]!r} {im.size} bright={b:.0f} sharp={sh:.0f}')
        return None
    c = dict(c)
    c['im'] = im
    c['bright'] = b
    c['sharp'] = sh
    c['score'] = (im.width * im.height) / 1e6 + sh / 40.0 + b / 300.0
    return c


def main():
    ids = sys.argv[1:] or list(TARGETS.keys())
    existing = fc.load_map()

    for pid in ids:
        if pid not in TARGETS:
            print(pid, 'unknown'); continue
        queries, must, excl = TARGETS[pid]
        must_rx = re.compile(must, re.I)
        excl_rx = re.compile(excl, re.I) if excl else None
        best = None
        print(f'== {pid} ==')
        for term in queries:
            cands = ov_cands(term, must_rx, excl_rx) + cm_cands(term, must_rx, excl_rx)
            print(f'   "{term}" -> {len(cands)} filtered')
            for c in cands[:8]:
                got = try_download(c)
                if got and (best is None or got['score'] > best['score']):
                    best = got
                    print(f'      best so far: {got["title"][:40]} {got["im"].size} '
                          f'sharp={got["sharp"]:.0f} score={got["score"]:.2f}')
            if best and best['score'] > 1.6:
                break
            time.sleep(0.4)

        if not best:
            print(f'  {pid}: KOI ACCHE PHOTO NAHI MILA (purana rehta hai)')
            continue

        out = fp.process(best.pop('im'))
        path = os.path.join(fp.IMG_DIR, pid + '.webp')
        out.save(path, 'WEBP', quality=86, method=6)
        existing[pid] = {
            'id': pid, 'src': 'img/' + pid + '.webp', 'lqip': fp.make_lqip(out),
            'title': best['title'], 'creator': best['creator'], 'license': best['lic'],
            'license_url': '', 'source': best['src'], 'bytes': os.path.getsize(path),
        }
        print(f'  OK {pid}: {best["title"][:45]} by {best["creator"]} ({best["lic"]})')

    fc.save_map(existing)
    print('map total', len(existing))


if __name__ == '__main__':
    main()
