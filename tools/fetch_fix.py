#!/usr/bin/env python3
"""
Galat/unsafe photos ko theek se replace karo:
  gymg1 -> title mein 'Glovers Road' tha (gloves nahi!)
  tt1   -> sticker/PNG, real photo nahi
  shin1 -> CC BY-ND license (derivative allowed nahi)
Dono source (Openverse + Commons), strict title filter + commercial-safe license.
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

OK_LIC = re.compile(r'(CC0|^by$|^by-sa$|^pdm$|public domain|PDM|CC BY(-SA)? \d\.\d)', re.I)

TARGETS = {
    'gymg1': (['weightlifting gloves', 'training gloves workout', 'gym gloves weightlifting',
               'lifting gloves fitness'],
              r'glove',
              r'glover|road|path|stile|wood|boxing|box|\bmodel\b|female|warrior|cat|ebola|medic|'
              r'army|marine|olympic|skeleton|watch|punch|knock'),
    'tt1':   (['table tennis paddle', 'table tennis bat', 'ping pong paddle rubber',
               'table tennis racket'],
              r'table.?tennis|ping.?pong',
              r'sticker|clipart|logo|png|vector|illustrat|cartoon'),
    'shin1': (['shin guard', 'shin guards sport', 'Schienbeinschützer', 'soccer shin guards pair'],
              r'shin|schienbein',
              r'logo|sticker|clipart|illustrat|cartoon|korea|seoul|vs |\bfc\b|match'),
}


def clean_license(lic):
    return (lic or '').strip()


def candidates_openverse(term, session, must_rx, excl_rx):
    out = []
    for r in fp.search(term, session):
        title = (r.get('title') or '').strip()
        lic = clean_license(r.get('license'))
        url = r.get('url') or ''
        if not url or not title:
            continue
        if not OK_LIC.search(lic):
            continue
        if fp.BAD_TITLE.search(title) or (excl_rx and excl_rx.search(title)):
            continue
        if must_rx and not must_rx.search(title):
            continue
        out.append((title, url, lic, r.get('creator') or 'Unknown',
                    r.get('foreign_landing_url') or url))
    return out


def candidates_commons(term, session, must_rx, excl_rx):
    out = []
    for pg in fc.search(term, session):
        ii = (pg.get('imageinfo') or [{}])[0]
        title = (pg.get('title') or '').replace('File:', '').strip()
        url = ii.get('thumburl') or ii.get('url') or ''
        mime = ii.get('mime') or ''
        if not url or mime not in ('image/jpeg', 'image/png', 'image/webp'):
            continue
        meta = ii.get('extmetadata') or {}
        lic = clean_license((meta.get('LicenseShortName') or {}).get('value'))
        artist = re.sub('<[^>]+>', '', ((meta.get('Artist') or {}).get('value') or 'Unknown')).strip()
        if not OK_LIC.search(lic):
            continue
        if fp.BAD_TITLE.search(title) or (excl_rx and excl_rx.search(title)):
            continue
        if must_rx and not must_rx.search(title):
            continue
        out.append((title, url, lic, artist, ii.get('descriptionurl') or url))
    return out


def download(url, session):
    r = session.get(url, timeout=40)
    if r.status_code != 200:
        return None
    try:
        im = Image.open(io.BytesIO(r.content))
        im.load()
    except Exception:
        return None
    if im.width < 420 or im.height < 300:
        return None
    b, s = fp.quality(im)
    if b < fp.BRIGHT_MIN or s < fp.SHARP_MIN:
        print(f'    reject bright={b:.0f} sharp={s:.0f}')
        return None
    return im


def main():
    session = requests.Session()
    session.headers.update(fc.UA)
    existing = fc.load_map()
    only = set(sys.argv[1:])

    for pid, (queries, must, excl) in TARGETS.items():
        if only and pid not in only:
            continue
        if pid not in existing:
            print(pid, 'not in map, skip')
            continue
        must_rx = re.compile(must, re.I)
        excl_rx = re.compile(excl, re.I)
        hit = None
        for term in queries:
            print(f'[{pid}] openverse "{term}"')
            for title, url, lic, creator, src in candidates_openverse(term, session, must_rx, excl_rx)[:8]:
                im = download(url, session)
                if im is not None:
                    hit = {'title': title, 'license': lic.upper(), 'creator': creator, 'source': src, 'image': im}
                    break
            if hit:
                break
            print(f'[{pid}] commons "{term}"')
            for title, url, lic, creator, src in candidates_commons(term, session, must_rx, excl_rx)[:8]:
                im = download(url, session)
                if im is not None:
                    hit = {'title': title, 'license': lic.upper(), 'creator': creator, 'source': src, 'image': im}
                    break
            if hit:
                break
            time.sleep(0.5)

        if not hit:
            print(f'  {pid}: NAHI MILA')
            continue

        out = fp.process(hit.pop('image'))
        path = os.path.join(fp.IMG_DIR, pid + '.webp')
        out.save(path, 'WEBP', quality=84, method=6)
        existing[pid] = {
            'id': pid, 'src': 'img/' + pid + '.webp', 'lqip': fp.make_lqip(out),
            'title': hit['title'], 'creator': hit['creator'], 'license': hit['license'],
            'license_url': '', 'source': hit['source'],
            'bytes': os.path.getsize(path),
        }
        print(f'  OK {pid}: {hit["title"][:50]} by {hit["creator"]} ({hit["license"]})')

    fc.save_map(existing)
    print('map total', len(existing))


if __name__ == '__main__':
    main()
