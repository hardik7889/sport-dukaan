#!/usr/bin/env python3
"""
Sport Dukaan — real product photo pipeline
Openverse (CC-licensed) se product photos fetch, quality gate, process,
LQIP + JS map emit.

Chalane ka tarika:
    python tools/fetch_photos.py            # sab products
    python tools/fetch_photos.py bat1 fb1   # sirf ye
"""
import os
import re
import sys
import json
import time
import base64
import io
import argparse

import requests
from PIL import Image, ImageStat, ImageFilter, ImageEnhance, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, 'img')
MAP_FILE = os.path.join(ROOT, 'product-photos.js')

API = 'https://api.openverse.org/v1/images/'
UA = {'User-Agent': 'SportDukaan/1.0 (small shop demo; contact sharmap8853@gmail.com)'}

# license priority — commercial-safe pehle
LIC_RANK = {'cc0': 0, 'pdm': 0, 'by': 1, 'by-sa': 2, 'by-nd': 3}
LIC_BAD = re.compile(r'nc|unknown|no-derivative', re.I)

W, H = 900, 640          # card aspect ~1.4
BRIGHT_MIN = 78
SHARP_MIN = 16

BAD_TITLE = re.compile(
    r'cartoon|clipart|clip-art|logo|illustrat|painting|poster|advert|billboard|'
    r'banner|infographic|vector|emoji|icon set|wallpaper|screenshot|collage',
    re.I)

# id -> (search queries in order, must-match regex, extra exclude regex)
SPECS = {
    'bat1':     (['cricket bat', 'cricket batting', 'cricket player bat'], r'cricket.{0,25}bat|bat.{0,25}cricket', None),
    'bat2':     (['cricket bat english willow', 'cricket bat', 'cricket bats'], r'(english|willow|kashmir|cricket).{0,25}bat|bat.{0,25}(english|willow|cricket)', r'baseball'),

    'ball1':    (['cricket ball', 'cricket ball red leather', 'cricket ball sport'], r'(cricket).{0,30}(ball)|(ball).{0,30}(cricket)', None),
    'gloves1':  (['batting gloves cricket', 'cricket gloves', 'batting gloves sport'], r'glove', None),
    'helmet1':  (['cricket helmet', 'cricket head guard', 'cricket headguard'], r'helmet|head ?guard|headguard', None),
    'stumps1':  (['cricket stumps', 'cricket stumps bails', 'cricket wicket'], r'stump|wicket|bail', None),
    'kitbag1':  (['sports duffel bag gym', 'sports kit bag', 'duffel bag sport'], r'bag', r'backpack|handbag|purse|luggage|golf'),

    'fb1':      (['football soccer ball', 'soccer ball football', 'football ball sport'], r'(football|soccer).{0,30}ball|ball.{0,30}(football|soccer)', None),
    'boots1':   (['football boots', 'soccer cleats', 'football shoes'], r'boot|cleat|football shoe', None),
    'shin1':    (['shin guards soccer', 'shin guard football', 'shin pads soccer'], r'shin', None),
    'gk1':      (['goalkeeper gloves', 'goalie gloves', 'goalkeeper training'], r'goal ?keep|goalie|keeper', None),

    'bd1':      (['badminton racket', 'badminton racquet', 'badminton shuttlecock racket'], r'badminton', None),
    'shuttle1': (['badminton shuttlecock', 'shuttlecock badminton', 'badminton shuttle'], r'shuttle', None),
    'tn1':      (['tennis racket', 'tennis racquet', 'tennis racket sport'], r'tennis.{0,25}(racket|racquet)|(racket|racquet).{0,25}tennis', None),
    'tt1':      (['table tennis paddle', 'table tennis bat', 'ping pong paddle'], r'table.?tennis|ping.?pong', None),

    'db1':      (['dumbbell', 'dumbbells gym', 'dumbbell weight set'], r'dumbbell', None),
    'rope1':    (['skipping rope', 'jump rope fitness', 'speed rope'], r'rop|jump', None),
    'mat1':     (['yoga mat', 'exercise mat rolled', 'yoga mat fitness'], r'\bmat\b', r'mattress|doormat|floor mat|matting'),
    'kb1':      (['kettlebell', 'kettlebell workout', 'kettle bell weight'], r'kettle', None),
    'band1':    (['resistance bands exercise', 'elastic resistance bands', 'workout bands loop'], r'resistance|elastic band|workout band', None),

    'jersey1':  (['sports jersey t shirt', 'football jersey shirt', 'soccer jersey'], r'jersey', None),
    'pant1':    (['track pants', 'sweatpants sports', 'joggers athletic pants'], r'track|sweatpant|jogger|trouser|pant', None),
    'cap1':     (['baseball cap', 'sports cap hat', 'cap hat sport'], r'\bcap\b|baseball hat|bucket hat', r'captain|cable'),
    'shoes1':   (['running shoes', 'athletic sneakers', 'running trainers'], r'shoe|sneaker|trainer|runner', None),
    'vest1':    (['tank top men gym', 'gym vest sleeveless', 'sleeveless tank top sport'], r'tank|vest|sleeveless|stringer', None),

    'bb1':      (['basketball ball', 'basketball orange sport', 'basketball court'], r'basketball', None),
    'vb1':      (['volleyball ball', 'volleyball beach sport', 'volley ball'], r'volley', None),
    'hk1':      (['field hockey stick', 'hockey stick grass', 'ice hockey stick'], r'hockey', None),
    'bottle1':  (['sport water bottle', 'reusable water bottle', 'water bottle gym'], r'bottle|flask', None),
    'gymg1':    (['weightlifting gloves', 'gym gloves training', 'training gloves gym'], r'glove', None),
}


def log(*a):
    print(*a, flush=True)


def search(term, session, tries=4):
    for i in range(tries):
        try:
            r = session.get(API, params={
                'q': term, 'per_page': 25, 'page': 1,
                'license_type': 'commercial',
            }, timeout=30)
            if r.status_code == 200:
                return r.json().get('results', [])
        except Exception as e:
            log('   search error:', e)
        time.sleep(1.5 * (i + 1))
    return []


def quality(im):
    g = im.convert('L')
    bright = ImageStat.Stat(g).mean[0]
    sharp = ImageStat.Stat(g.filter(ImageFilter.FIND_EDGES)).stddev[0]
    return bright, sharp


def edge_falloff(size, strength=0.34, power=2.4):
    """White centre -> black corners, blurred ellipse ke saath (fast, numpy-free)."""
    w, h = size
    m = Image.new('L', size, 0)
    d = ImageDraw.Draw(m)
    px, py = int(w * strength), int(h * strength)
    d.ellipse([px, py, w - px, h - py], fill=255)
    m = m.filter(ImageFilter.GaussianBlur(int(min(w, h) * 0.22)))
    return m


def auto_level(im, target=140):
    mean = ImageStat.Stat(im.convert('L')).mean[0]
    if mean <= 1:
        return im
    return ImageEnhance.Brightness(im).enhance(max(0.85, min(2.1, target / mean)))


def process(im):
    im = im.convert('RGB')
    sw, sh = im.size
    target = W / H
    if sw / sh > target:
        nw = int(sh * target)
        left = (sw - nw) // 2
        im = im.crop((left, 0, left + nw, sh))
    else:
        nh = int(sw / target)
        top = int((sh - nh) * 0.38)
        im = im.crop((0, top, sw, top + nh))
    im = im.resize((W, H), Image.LANCZOS)
    im = auto_level(im, 140)
    im = ImageEnhance.Color(im).enhance(1.12)
    im = ImageEnhance.Contrast(im).enhance(1.05)
    im = Image.composite(im, Image.new('RGB', (W, H), (12, 16, 30)), edge_falloff((W, H)))
    return im


def make_lqip(im):
    small = im.resize((28, 20), Image.LANCZOS).filter(ImageFilter.GaussianBlur(2))
    buf = io.BytesIO()
    small.save(buf, 'WEBP', quality=45, method=4)
    return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()


def fetch_one(pid, spec, session, used, lock=None):
    queries, must, excl = spec
    must_rx = re.compile(must, re.I) if must else None
    excl_rx = re.compile(excl, re.I) if excl else None

    for term in queries:
        results = search(term, session)
        log(f'  [{pid}] "{term}" -> {len(results)} hits')
        cands = []
        for r in results:
            title = (r.get('title') or '').strip()
            lic = (r.get('license') or '').lower()
            url = r.get('url') or ''
            if not url or not title:
                continue
            key = title.lower()
            with lock:
                if key in used:
                    continue
            if BAD_TITLE.search(title):
                continue
            if must_rx and not must_rx.search(title):
                continue
            if excl_rx and excl_rx.search(title):
                continue
            rank = LIC_RANK.get(lic, 9)
            cands.append((rank, r))
        cands.sort(key=lambda x: x[0])

        for rank, r in cands[:12]:
            url = r['url']
            try:
                resp = session.get(url, timeout=40)
                if resp.status_code != 200:
                    continue
                im = Image.open(io.BytesIO(resp.content))
                if im.width < 500 or im.height < 380:
                    continue
                b, s = quality(im)
                if b < BRIGHT_MIN or s < SHARP_MIN:
                    log(f'    reject {r.get("title")[:50]!r} bright={b:.0f} sharp={s:.0f}')
                    continue
                with lock:
                    used.add(title.lower())
                return {
                    'id': pid,
                    'image': im,
                    'title': r.get('title'),
                    'creator': r.get('creator') or 'Unknown',
                    'license': r.get('license') or 'unknown',
                    'license_url': r.get('license_url') or '',
                    'source': r.get('foreign_landing_url') or url,
                    'bright': round(b, 1),
                    'sharp': round(s, 1),
                }
            except Exception as e:
                log('    dl error:', e)
                continue
        time.sleep(0.8)
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('ids', nargs='*')
    ap.add_argument('-j', '--jobs', type=int, default=4)
    args = ap.parse_args()

    ids = args.ids or list(SPECS.keys())
    os.makedirs(IMG_DIR, exist_ok=True)

    import threading
    from concurrent.futures import ThreadPoolExecutor

    lock = threading.Lock()
    used = set()
    found = {}

    def work(pid):
        session = requests.Session()
        session.headers.update(UA)
        log(f'== {pid} ==')
        hit = fetch_one(pid, SPECS[pid], session, used, lock)
        if not hit:
            log(f'  [{pid}] KOI PHOTO NAHI MILI')
            return
        out = process(hit.pop('image'))
        path = os.path.join(IMG_DIR, pid + '.webp')
        with lock:
            out.save(path, 'WEBP', quality=84, method=6)
            hit['src'] = 'img/' + pid + '.webp'
            hit['lqip'] = make_lqip(out)
            hit['bytes'] = os.path.getsize(path)
            found[pid] = hit
        log(f'  OK {hit["src"]} {hit["bytes"]//1024}KB bright={hit["bright"]} sharp={hit["sharp"]} '
            f'by {hit["creator"]} ({hit["license"]})')

    with ThreadPoolExecutor(max_workers=args.jobs) as ex:
        list(ex.map(work, ids))

    # map emit — purana map merge karo taaki partial run par baaki na jaye
    existing = {}
    if os.path.exists(MAP_FILE):
        try:
            txt = open(MAP_FILE, encoding='utf-8').read()
            body = txt[txt.index('{'):txt.rindex('}') + 1]
            existing = json.loads(body.replace('\\/', '/'))
        except Exception:
            existing = {}
    existing.update(found)

    lines = ['/* Generated by tools/fetch_photos.py — CC-licensed product photos (Openverse).',
             '   Attribution: creator + license key har entry mein hai. */',
             'window.PRODUCT_PHOTOS = ' + json.dumps(existing, ensure_ascii=False, indent=2) + ';']
    open(MAP_FILE, 'w', encoding='utf-8').write('\n'.join(lines))

    log('')
    log(f'=== done: {len(found)}/{len(ids)} new, map mein total {len(existing)} ===')
    missing = [i for i in SPECS if i not in existing]
    if missing:
        log('missing:', ', '.join(missing))


if __name__ == '__main__':
    main()
