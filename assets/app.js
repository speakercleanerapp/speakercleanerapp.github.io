/* Speaker Cleaner - Web Audio tone generator. MIT License. */
(function () {
  'use strict';
  var ctx = null, master = null, osc = null, env = null;
  var running = false, endAt = 0, startAt = 0, raf = 0, stopTimer = 0, current = null;

  var MODES = {
    water: { label: 'Water eject (165 Hz)', stages: [{ name: '165 Hz water-eject tone', dur: 30, kind: 'tone', f: 165 }] },
    sweep: { label: 'Low sweep & pulse', stages: [
      { name: 'Low-frequency sweep', dur: 20, kind: 'sweep', f1: 60, f2: 320 },
      { name: 'Pulse bursts', dur: 15, kind: 'pulse', f: 150, rate: 4 }
    ] },
    auto: { label: 'Auto clean cycle', stages: [
      { name: 'Stage 1 of 5: warm-up sweep', dur: 12, kind: 'sweep', f1: 100, f2: 250 },
      { name: 'Stage 2 of 5: 165 Hz water eject', dur: 25, kind: 'tone', f: 165 },
      { name: 'Stage 3 of 5: pulse bursts', dur: 15, kind: 'pulse', f: 165, rate: 3 },
      { name: 'Stage 4 of 5: deep rumble sweep', dur: 15, kind: 'sweep', f1: 55, f2: 140 },
      { name: 'Stage 5 of 5: final 165 Hz pass', dur: 13, kind: 'tone', f: 165 }
    ] }
  };

  var $ = function (id) { return document.getElementById(id); };
  var btn = $('sc-main'), statusEl = $('sc-status'), stageEl = $('sc-stage'),
      timeEl = $('sc-time'), bar = $('sc-bar'), vol = $('sc-vol'), volOut = $('sc-vol-out');
  var modeInputs = document.querySelectorAll('input[name="sc-mode"]');

  function selectedMode() {
    for (var i = 0; i < modeInputs.length; i++) if (modeInputs[i].checked) return modeInputs[i].value;
    return 'water';
  }
  function totalDur(m) { return MODES[m].stages.reduce(function (a, s) { return a + s.dur; }, 0); }
  function fmt(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }

  function ensureCtx() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = vol.value / 100;
      master.connect(ctx.destination);
    }
    if (ctx.state !== 'running' && ctx.resume) ctx.resume();
    return ctx;
  }

  function schedule(stages, t0) {
    osc = ctx.createOscillator();
    env = ctx.createGain();
    osc.type = 'sine';
    osc.connect(env); env.connect(master);
    var g = env.gain, f = osc.frequency, t = t0;
    g.setValueAtTime(0.0001, t);
    g.exponentialRampToValueAtTime(1, t + 0.08);
    stages.forEach(function (s) {
      var end = t + s.dur;
      if (s.kind === 'tone') {
        f.setValueAtTime(s.f, t);
        g.setValueAtTime(1, t);
      } else if (s.kind === 'sweep') {
        // sweep up and down repeatedly in 4-second legs
        f.setValueAtTime(s.f1, t);
        g.setValueAtTime(1, t);
        var leg = 4, up = true;
        for (var x = t + leg; x <= end + 0.001; x += leg) {
          f.exponentialRampToValueAtTime(up ? s.f2 : s.f1, x);
          up = !up;
        }
      } else if (s.kind === 'pulse') {
        f.setValueAtTime(s.f, t);
        var per = 1 / s.rate;
        for (var p = t; p < end - 0.01; p += per) {
          g.setValueAtTime(1, p);
          g.setTargetAtTime(0.05, p + per * 0.55, 0.015);
        }
        g.setValueAtTime(1, end - 0.01);
      }
      t = end;
    });
    g.setValueAtTime(1, t - 0.1);
    g.exponentialRampToValueAtTime(0.0001, t);
    osc.start(t0);
    osc.stop(t + 0.05);
    return t;
  }

  function stageAt(elapsed) {
    var acc = 0, st = current.stages;
    for (var i = 0; i < st.length; i++) { acc += st[i].dur; if (elapsed < acc) return st[i]; }
    return st[st.length - 1];
  }

  function tick() {
    if (!running) return;
    var now = ctx.currentTime, total = endAt - startAt, el = now - startAt;
    timeEl.textContent = fmt(endAt - now);
    bar.style.width = Math.min(100, (el / total) * 100) + '%';
    stageEl.textContent = stageAt(el).name;
    raf = requestAnimationFrame(tick);
  }

  function setUI(on, msg) {
    running = on;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.classList.toggle('on', on);
    btn.querySelector('.lbl').textContent = on ? 'Stop' : 'Start cleaning';
    document.body.classList.toggle('playing', on);
    for (var i = 0; i < modeInputs.length; i++) modeInputs[i].disabled = on;
    statusEl.textContent = msg;
  }

  function start() {
    if (!ensureCtx()) { statusEl.textContent = 'Sorry, this browser does not support Web Audio.'; return; }
    var m = selectedMode();
    current = MODES[m];
    startAt = ctx.currentTime + 0.05;
    endAt = schedule(current.stages, startAt);
    setUI(true, 'Playing: ' + current.label + '. Point the speaker down.');
    clearTimeout(stopTimer);
    stopTimer = setTimeout(function () { finish(true); }, (endAt - ctx.currentTime) * 1000 + 150);
    cancelAnimationFrame(raf); tick();
  }

  function finish(done) {
    clearTimeout(stopTimer); cancelAnimationFrame(raf);
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
    timeEl.textContent = fmt(totalDur(selectedMode()));
    stageEl.textContent = done ? 'Cycle complete' : 'Stopped';
    setUI(false, done ? 'Finished. Wipe the grille and test with music. Repeat once if it still sounds muffled.' : 'Stopped. Tap Start to run again.');
  }

  btn.addEventListener('click', function () { running ? finish(false) : start(); });
  vol.addEventListener('input', function () {
    volOut.textContent = vol.value + '%';
    if (master) master.gain.setTargetAtTime(vol.value / 100, ctx.currentTime, 0.02);
  });
  for (var i = 0; i < modeInputs.length; i++) modeInputs[i].addEventListener('change', function () {
    timeEl.textContent = fmt(totalDur(selectedMode())); bar.style.width = '0%';
    stageEl.textContent = MODES[selectedMode()].label;
  });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && ctx && running && ctx.state !== 'running') ctx.resume();
  });
  timeEl.textContent = fmt(totalDur(selectedMode()));
})();
