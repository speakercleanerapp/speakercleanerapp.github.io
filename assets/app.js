/* Speaker Cleaner - Web Audio tone generator. MIT License. */
(function () {
  'use strict';
  var MODES = {
    water: { label: 'Water eject (165 Hz)', stages: [{ name: '165 Hz water-eject tone', dur: 30, kind: 'tone', f: 165 }] },
    sweep: { label: 'Low sweep & pulse', stages: [
      { name: 'Low-frequency sweep', dur: 20, kind: 'sweep', f1: 60, f2: 320 },
      { name: 'Pulse bursts', dur: 15, kind: 'pulse', f: 150, rate: 4 }] },
    auto: { label: 'Auto clean cycle', stages: [
      { name: 'Stage 1 of 5: warm-up sweep', dur: 12, kind: 'sweep', f1: 100, f2: 250 },
      { name: 'Stage 2 of 5: 165 Hz water eject', dur: 25, kind: 'tone', f: 165 },
      { name: 'Stage 3 of 5: pulse bursts', dur: 15, kind: 'pulse', f: 165, rate: 3 },
      { name: 'Stage 4 of 5: deep rumble sweep', dur: 15, kind: 'sweep', f1: 55, f2: 140 },
      { name: 'Stage 5 of 5: final 165 Hz pass', dur: 13, kind: 'tone', f: 165 }] },
    dust: { label: 'Dust cleaner (200–1500 Hz)', stages: [
      { name: 'Rising steps 200 to 1500 Hz', dur: 24, kind: 'steps', fs: [200, 250, 320, 400, 500, 630, 800, 1000, 1250, 1500], amp: 0.8 },
      { name: 'Falling steps 1500 to 200 Hz', dur: 24, kind: 'steps', fs: [1500, 1250, 1000, 800, 630, 500, 400, 320, 250, 200], amp: 0.8 },
      { name: 'Low flush at 165 Hz', dur: 8, kind: 'tone', f: 165 }] },
    vibe: { label: 'Vibration clean', vibrate: true, stages: [
      { name: 'Slow pulses with vibration', dur: 15, kind: 'pulse', f: 130, rate: 2 },
      { name: 'Rumble sweep 70 to 200 Hz', dur: 15, kind: 'sweep', f1: 70, f2: 200 },
      { name: 'Fast pulses at 165 Hz', dur: 10, kind: 'pulse', f: 165, rate: 4 }] },
    lrtest: { label: 'Left / right test', fixedPan: true, stages: [
      { name: 'Left speaker', dur: 3, kind: 'tone', f: 440, amp: 0.5, pan: 'left' },
      { name: 'Right speaker', dur: 3, kind: 'tone', f: 440, amp: 0.5, pan: 'right' },
      { name: 'Both speakers', dur: 3, kind: 'tone', f: 440, amp: 0.5, pan: 'both' },
      { name: 'Left speaker', dur: 3, kind: 'tone', f: 660, amp: 0.5, pan: 'left' },
      { name: 'Right speaker', dur: 3, kind: 'tone', f: 660, amp: 0.5, pan: 'right' },
      { name: 'Both speakers', dur: 3, kind: 'tone', f: 660, amp: 0.5, pan: 'both' }] },
    fsweep: { label: 'Frequency sweep', stages: [{ name: 'Sweep 50 Hz to 16 kHz', dur: 24, kind: 'glide', f1: 50, f2: 16000, amp: 0.45 }] }
  };
  var VIB = [400, 180, 400, 180, 400, 180, 400, 180, 400, 180];

  var ctx = null, master = null, gL = null, gR = null, osc = null, env = null;
  var running = false, endAt = 0, startAt = 0, raf = 0, stopTimer = 0, vibTimer = 0, current = null;
  var $ = function (id) { return document.getElementById(id); };
  var btn = $('sc-main');
  if (!btn) return;
  var statusEl = $('sc-status'), stageEl = $('sc-stage'), timeEl = $('sc-time'), hzEl = $('sc-hz'),
      bar = $('sc-bar'), vol = $('sc-vol'), volOut = $('sc-vol-out'), vibBox = $('sc-vib'), vibNote = $('sc-vib-note');
  var modeInputs = document.querySelectorAll('input[name="sc-mode"]');
  var chInputs = document.querySelectorAll('input[name="sc-ch"]');
  var canVibrate = typeof navigator.vibrate === 'function';

  function checked(list, dflt) { for (var i = 0; i < list.length; i++) if (list[i].checked) return list[i].value; return dflt; }
  function mode() { return checked(modeInputs, 'water'); }
  function channel() { return checked(chInputs, 'both'); }
  function totalDur(m) { return MODES[m].stages.reduce(function (a, s) { return a + s.dur; }, 0); }
  function fmt(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function fmtHz(f) { return f >= 1000 ? (f / 1000).toFixed(f >= 10000 ? 0 : 1) + ' kHz' : Math.round(f) + ' Hz'; }
  function lr(pan) { return pan === 'left' ? [1, 0] : pan === 'right' ? [0, 1] : [1, 1]; }

  function ensureCtx() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = vol.value / 100;
      var merger = ctx.createChannelMerger(2);
      gL = ctx.createGain(); gR = ctx.createGain();
      gL.connect(merger, 0, 0); gR.connect(merger, 0, 1);
      merger.connect(master); master.connect(ctx.destination);
    }
    if (ctx.state !== 'running' && ctx.resume) ctx.resume();
    return ctx;
  }

  function setPan(pan, t, smooth) {
    var v = lr(pan);
    [gL.gain, gR.gain].forEach(function (p, i) {
      if (smooth) { p.cancelScheduledValues(t); p.setTargetAtTime(v[i], t, 0.03); }
      else p.setValueAtTime(v[i], t);
    });
  }

  function schedule(stages, t0) {
    osc = ctx.createOscillator(); env = ctx.createGain();
    osc.type = 'sine';
    osc.connect(env); env.connect(gL); env.connect(gR);
    var g = env.gain, f = osc.frequency, t = t0;
    gL.gain.cancelScheduledValues(t0); gR.gain.cancelScheduledValues(t0);
    g.setValueAtTime(0.0001, t);
    g.exponentialRampToValueAtTime(stages[0].amp || 1, t + 0.08);
    stages.forEach(function (s) {
      var end = t + s.dur, a = s.amp || 1;
      setPan(s.pan || channel(), t, false);
      if (s.kind === 'tone') {
        f.setValueAtTime(s.f, t); g.setValueAtTime(a, t + (t === t0 ? 0.08 : 0));
      } else if (s.kind === 'sweep') {
        f.setValueAtTime(s.f1, t); g.setValueAtTime(a, t + (t === t0 ? 0.08 : 0));
        var up = true;
        for (var x = t + 4; x <= end + 0.001; x += 4) { f.exponentialRampToValueAtTime(up ? s.f2 : s.f1, x); up = !up; }
      } else if (s.kind === 'glide') {
        f.setValueAtTime(s.f1, t); g.setValueAtTime(a, t + (t === t0 ? 0.08 : 0));
        f.exponentialRampToValueAtTime(s.f2, end);
      } else if (s.kind === 'steps') {
        var sd = s.dur / s.fs.length;
        s.fs.forEach(function (fr, i) {
          var ts = t + i * sd;
          f.setValueAtTime(fr, ts);
          g.setValueAtTime(a, ts + (ts === t0 ? 0.08 : 0.02));
          g.setTargetAtTime(a * 0.35, ts + sd - 0.12, 0.02);
        });
        g.setValueAtTime(a, end - 0.01);
      } else if (s.kind === 'pulse') {
        f.setValueAtTime(s.f, t);
        var per = 1 / s.rate;
        for (var p = t; p < end - 0.01; p += per) { if (p !== t0) g.setValueAtTime(a, p); g.setTargetAtTime(0.05 * a, p + per * 0.55, 0.015); }
        g.setValueAtTime(a, end - 0.01);
      }
      t = end;
    });
    g.setValueAtTime(stages[stages.length - 1].amp || 1, t - 0.1);
    g.exponentialRampToValueAtTime(0.0001, t);
    osc.start(t0); osc.stop(t + 0.05);
    return t;
  }

  function stageAt(el) {
    var acc = 0, st = current.stages;
    for (var i = 0; i < st.length; i++) { if (el < acc + st[i].dur) return [st[i], el - acc]; acc += st[i].dur; }
    var last = st[st.length - 1]; return [last, last.dur];
  }
  function freqAt(s, x) {
    if (s.kind === 'tone' || s.kind === 'pulse') return s.f;
    if (s.kind === 'steps') return s.fs[Math.min(s.fs.length - 1, Math.floor(x / (s.dur / s.fs.length)))];
    if (s.kind === 'glide') return s.f1 * Math.pow(s.f2 / s.f1, Math.min(1, x / s.dur));
    var leg = Math.floor(x / 4), fr = (x % 4) / 4, up = leg % 2 === 0;
    var a = up ? s.f1 : s.f2, b = up ? s.f2 : s.f1;
    return a * Math.pow(b / a, fr);
  }

  function tick() {
    if (!running) return;
    var now = ctx.currentTime, el = Math.max(0, now - startAt), sa = stageAt(el);
    timeEl.textContent = fmt(endAt - now);
    bar.style.width = Math.min(100, (el / (endAt - startAt)) * 100) + '%';
    stageEl.textContent = sa[0].name;
    if (hzEl) hzEl.textContent = fmtHz(freqAt(sa[0], sa[1]));
    raf = requestAnimationFrame(tick);
  }

  function vibOn() { return canVibrate && vibBox && vibBox.checked; }
  function startVib() {
    stopVib();
    if (!vibOn()) return;
    navigator.vibrate(VIB);
    vibTimer = setInterval(function () { if (vibOn()) navigator.vibrate(VIB); }, 2900);
  }
  function stopVib() { clearInterval(vibTimer); vibTimer = 0; if (canVibrate) try { navigator.vibrate(0); } catch (e) {} }

  function setUI(on, msg) {
    running = on;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.classList.toggle('on', on);
    btn.querySelector('.lbl').textContent = on ? 'Stop' : 'Start';
    document.body.classList.toggle('playing', on);
    for (var i = 0; i < modeInputs.length; i++) modeInputs[i].disabled = on;
    statusEl.textContent = msg;
  }

  function start() {
    if (!ensureCtx()) { statusEl.textContent = 'Sorry, this browser does not support Web Audio.'; return; }
    current = MODES[mode()];
    startAt = ctx.currentTime + 0.05;
    endAt = schedule(current.stages, startAt);
    var ch = current.fixedPan ? '' : (channel() === 'both' ? ' on both speakers' : ' on the ' + channel() + ' speaker');
    setUI(true, 'Playing: ' + current.label + ch + (vibOn() ? ' with vibration' : '') + '.');
    startVib();
    clearTimeout(stopTimer);
    stopTimer = setTimeout(function () { finish(true); }, (endAt - ctx.currentTime) * 1000 + 150);
    cancelAnimationFrame(raf); tick();
  }

  function finish(done) {
    clearTimeout(stopTimer); cancelAnimationFrame(raf); stopVib();
    if (osc) {
      try {
        var n = ctx.currentTime;
        env.gain.cancelScheduledValues(n);
        env.gain.setValueAtTime(Math.max(env.gain.value, 0.0001), n);
        env.gain.exponentialRampToValueAtTime(0.0001, n + 0.06);
        osc.stop(n + 0.08);
      } catch (e) {}
      osc = null;
    }
    bar.style.width = done ? '100%' : '0%';
    timeEl.textContent = fmt(totalDur(mode()));
    stageEl.textContent = done ? 'Complete' : 'Stopped';
    if (hzEl) hzEl.textContent = '–';
    setUI(false, done ? 'Finished. Wipe the grille, then test with music or a voice clip. Repeat once if needed.' : 'Stopped. Tap Start to run again.');
  }

  function refreshIdle() {
    var m = MODES[mode()];
    timeEl.textContent = fmt(totalDur(mode())); bar.style.width = '0%'; stageEl.textContent = m.label;
    var chWrap = $('sc-ch-wrap');
    if (chWrap) chWrap.classList.toggle('dim', !!m.fixedPan);
  }

  btn.addEventListener('click', function () { running ? finish(false) : start(); });
  vol.addEventListener('input', function () {
    volOut.textContent = vol.value + '%';
    if (master) master.gain.setTargetAtTime(vol.value / 100, ctx.currentTime, 0.02);
  });
  for (var i = 0; i < modeInputs.length; i++) modeInputs[i].addEventListener('change', function () {
    if (vibBox && canVibrate && MODES[mode()].vibrate) vibBox.checked = true;
    refreshIdle();
  });
  for (var j = 0; j < chInputs.length; j++) chInputs[j].addEventListener('change', function () {
    if (running && !current.fixedPan) {
      setPan(channel(), ctx.currentTime, true);
      statusEl.textContent = 'Now playing on ' + (channel() === 'both' ? 'both speakers' : 'the ' + channel() + ' speaker') + '.';
    }
  });
  if (vibBox) {
    if (!canVibrate) {
      vibBox.checked = false; vibBox.disabled = true;
      if (vibNote) vibNote.textContent = 'Vibration is not available in this browser. iPhone and iPad browsers do not allow websites to vibrate, so the tone runs on its own and still works.';
    } else {
      if (MODES[mode()].vibrate) vibBox.checked = true;
      vibBox.addEventListener('change', function () { if (running) { vibBox.checked ? startVib() : stopVib(); } });
    }
  }
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && ctx && running && ctx.state !== 'running') ctx.resume();
    if (document.hidden) stopVib(); else if (running) startVib();
  });
  refreshIdle();
})();
