#!/usr/bin/env python3
"""
Final curation: exact Commons filenames se download (search noise se bachne ke liye).
Licenses pehle se check ki hain. Sirf filename dena hota hai.
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

API = 'https://commons.wikimedia.org/w/api.php'

# id -> (File: title, license)
FILES = {
    'shuttle1': ('Koogan badminton feather shuttlecock 01.JPG', 'Public domain'),
    'bottle1':  ('MVP-sports-snacks-water-bottle (15093546478).jpg', 'CC BY 2.0'),
    'kb1':      ('Cast Iron Russian kettlebell.jpg', 'CC BY-SA 4.0'),
    'gloves1':  ('Cricket gloves in a store, RR Nagar, Bangalore (2026).jpg', 'CC BY-SA 4.0'),
    'bd1':      ('Badminton racket.jpg', 'CC BY-SA 4.0'),
    'tn1':      ('Tennis Racket and Balls.jpg', 'CC BY-SA 3.0'),
}

s = requests.Session()
s.headers.update(fc.UA)


def meta(title):
    r = s.get(API, params={
        'action': 'query', 'format': 'json', 'titles': 'File:' + title,
        'prop': 'imageinfo', 'iiprop': 'url|size|mime|extmetadata',
        'iiurlwidth': '1000', 'iiextmetadatafilter': 'LicenseShortName|Artist',
    }, timeout=30)
    pages = (r.json().get('query') or {}).get('pages') or {}
    pg = list(pages.values())[0]
    ii = (pg.get('imageinfo') or [{}])[0]
    em = ii.get('extmetadata') or {}
    artist = re.sub('<[^>]+>', '', ((em.get('Artist') or {}).get('value') or 'Unknown')).strip()
    lic = ((em.get('LicenseShortName') or {}).get('value') or '').strip()
    return ii.get('thumburl') or ii.get('url'), ii.get('descriptionurl') or '', artist, lic


def main():
    existing = fc.load_map()
    for pid, (title, expect_lic) in FILES.items():
        print(f'== {pid} <- {title}')
        url, desc, artist, lic = meta(title)
        if not url:
            print('   no url'); continue
        resp = s.get(url, timeout=40)
        im = Image.open(io.BytesIO(resp.content)); im.load()
        if im.width < 600 or im.height < 420:
            print(f'   too small {im.size}'); continue
        b, sh = fp.quality(im)
        print(f'   {im.size} bright={b:.0f} sharp={sh:.0f} by {artist} ({lic})')
        out = fp.process(im)
        path = os.path.join(fp.IMG_DIR, pid + '.webp')
        out.save(path, 'WEBP', quality=86, method=6)
        existing[pid] = {
            'id': pid, 'src': 'img/' + pid + '.webp', 'lqip': fp.make_lqip(out),
            'title': title.replace('File:', ''), 'creator': artist,
            'license': lic.upper(), 'license_url': '',
            'source': desc, 'bytes': os.path.getsize(path),
        }
        time.sleep(0.4)

    fc.save_map(existing)
    print('map total', len(existing))


if __name__ == '__main__':
    main()
