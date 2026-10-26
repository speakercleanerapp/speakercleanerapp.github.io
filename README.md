# Speaker Cleaner

A free, browser-based speaker cleaner that plays low-frequency tones to help push water droplets and loose dust out of phone speaker grilles.

Live site: https://speakercleanerapp.github.io/

## Features

- **Water eject** – steady 165 Hz sine tone (30 s)
- **Sweep & pulse** – 60–320 Hz sweep followed by rhythmic 150 Hz bursts (35 s)
- **Auto clean cycle** – five stages over about 80 seconds
- **Dust cleaner** – stepped 200–1500 Hz tone band (56 s)
- **Vibration clean** – pulse tones plus the Vibration API where supported (Android)
- **Speaker test** – left / right channel test and a 50 Hz–16 kHz sweep
- Left / right / both speaker selection for every mode (ChannelMerger routing)
- Start/stop with clear status, progress bar, and tone-level slider
- Works on iOS Safari (audio starts on tap), Android, and desktop browsers
- No frameworks, no tracking, no cookies, no build step

## How it works

Tones are synthesised in real time with the Web Audio API (`OscillatorNode` + `GainNode` automation). Nothing is downloaded or recorded.

## Project structure

```
index.html, water-eject/, dust-cleaner/, vibration-cleaner/, speaker-test/,
about/, contact/, privacy.html   Generated pages (inline CSS, JSON-LD)
assets/app.js                    Tone generator and UI logic
tools/build.py                   Page generator
tools/content/                   Page text fragments and FAQ data
404.html, favicon.svg, og.png, robots.txt, sitemap.xml
```

Edit content in `tools/content/`, then rebuild:

```
python3 tools/build.py
```

## Feedback

Bug reports and ideas: [GitHub Issues](https://github.com/speakercleanerapp/speakercleanerapp.github.io/issues).

## Local development

Open `index.html` directly, or serve the folder:

```
python3 -m http.server 8000
```

## Disclaimer

Sound can only move loose water or debris. It cannot repair hardware damage. Keep devices away from your ears while tones play.

## License

MIT – see [LICENSE](LICENSE).
