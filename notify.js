/* ============================================================
   Sport Dukaan — naya order alert (owner ke browser ke liye)
   Chime + desktop notification + title flash + toast.
   localStorage watch + poll. Sirf tab ke andar kaam karta hai.
   ============================================================ */
(function () {
  'use strict';
  const SEEN = 'sport_alert_seen';
  const KEY = 'sport_orders';
  let handle = null;
  let mounted = false;
  let enabled = false;
  let audio = null;
  let baseTitle = document.title;
  let flashTimer = null;

  function seenSet() {
    try { return new Set(JSON.parse(localStorage.getItem(SEEN) || '[]')); }
    catch (e) { return new Set(); }
  }
  function saveSeen(s) {
    try { localStorage.setItem(SEEN, JSON.stringify([...s])); } catch (e) {}
  }

  function tone() {
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      const t = audio.currentTime;
      [880, 1174, 1568].forEach(function (f, i) {
        const o = audio.createOscillator();
        const g = audio.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t + i * 0.12);
        g.gain.exponentialRampToValueAtTime(0.22, t + i * 0.12 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 0.5);
        o.connect(g); g.connect(audio.destination);
        o.start(t + i * 0.12); o.stop(t + i * 0.12 + 0.55);
      });
      return true;
    } catch (e) { return false; }
  }

  function flashTitle() {
    let on = false;
    flashTimer = setInterval(function () {
      document.title = on ? baseTitle : '🔔 NAYA ORDER — Sport Dukaan';
      on = !on;
    }, 900);
    window.addEventListener('focus', stopFlash);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) stopFlash();
    });
  }
  function stopFlash() {
    if (flashTimer) { clearInterval(flashTimer); flashTimer = null; }
    document.title = baseTitle;
  }

  function notify(o) {
    if (!enabled) return;
    tone();
    flashTitle();
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Naya order — Sport Dukaan', {
          body: (o.customer && o.customer.name ? o.customer.name : 'Customer') +
                ' • ₹' + (o.total || 0) + ' • ' + (o.id || ''),
          tag: 'sport-order-' + (o.id || Math.random())
        });
      }
    } catch (e) {}
    if (typeof window.toast === 'function') {
      window.toast('🔔 Naya order: ' + (o.id || '') + ' — ₹' + (o.total || 0), 'ok');
    }
  }

  function checkNow() {
    let list;
    try { list = JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch (e) { return; }
    const seen = seenSet();
    let fresh = null;
    list.forEach(function (o) { if (o && o.id && !seen.has(o.id)) { seen.add(o.id); fresh = o; } });
    if (fresh) {
      saveSeen(seen);
      if (typeof window.reloadOrders === 'function') window.reloadOrders();
      notify(fresh);
    }
  }

  function startWatch() {
    if (handle) return;
    window.addEventListener('storage', function (e) {
      if (e.key === KEY) checkNow();
    });
    handle = setInterval(checkNow, 2500);
  }

  window.OrderNotify = {
    mount: function () {
      if (mounted) return;
      mounted = true;
      const seen = seenSet();
      (JSON.parse(localStorage.getItem(KEY) || '[]')).forEach(function (o) {
        if (o && o.id) seen.add(o.id);
      });
      saveSeen(seen);
      startWatch();
    },
    unmount: function () {
      mounted = false;
      if (handle) { clearInterval(handle); handle = null; }
      stopFlash();
    },
    enable: function () {
      enabled = true;
      try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch (e) {}
      tone();
      return true;
    },
    disable: function () { enabled = false; stopFlash(); return true; },
    isOn: function () { return enabled; },
    test: function () { tone(); flashTitle(); notify({ id: 'TEST', total: 0, customer: { name: 'Test' } }); },
    checkNow: checkNow
  };
})();
