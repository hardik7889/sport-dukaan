#!/usr/bin/env python3
"""Aakhri 2 products ke liye broad Commons search."""
import os
import sys
import time
import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fetch_photos as fp          # noqa: E402
import fetch_commons as fc         # noqa: E402

EXTRA = {
    'vest1':  (['tank top men', 'sleeveless shirt sport', 'bodybuilding tank top',
                'men tank top athletic', 'stringer tank gym'],
               r'tank|vest|sleeveless|stringer|singlet', None),
    'gymg1':  (['lifting gloves', 'workout gloves fitness', 'fitness gloves training',
                'weight lifting straps gloves', 'gym gloves weightlifting'],
               r'glove', None),
}


def main():
    session = requests.Session()
    session.headers.update(fc.UA)
    existing = fc.load_map()
    found = {}
    used = set()

    for pid, spec in EXTRA.items():
        if pid in existing:
            print('already have', pid)
            continue
        print('==', pid, '(extra commons) ==')
        hit = fc.pick(pid, spec, session, used)
        if not hit:
            print('  NAHI MILI:', pid)
            continue
        out = fp.process(hit.pop('image'))
        path = os.path.join(fp.IMG_DIR, pid + '.webp')
        out.save(path, 'WEBP', quality=84, method=6)
        hit['src'] = 'img/' + pid + '.webp'
        hit['lqip'] = fp.make_lqip(out)
        hit['bytes'] = os.path.getsize(path)
        found[pid] = hit
        print(f'  OK {hit["src"]} {hit["bytes"]//1024}KB by {hit["creator"]} ({hit["license"]})')
        time.sleep(0.6)

    existing.update(found)
    fc.save_map(existing)
    print('total now', len(existing))
    print('missing:', [i for i in fp.SPECS if i not in existing])


if __name__ == '__main__':
    main()
