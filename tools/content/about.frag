<h2 id="what">What Speaker Cleaner is</h2>
<p>Speaker Cleaner is a small, free website that plays carefully designed tones to help clear water, dust and lint from phone speaker grilles. It started from a simple idea: the speaker in your phone is already a tiny air pump, so with the right sound it can help clean itself, without installing an app or creating an account.</p>
<p>All sounds are generated live in your browser with the Web Audio API. There are no audio files to download, no microphone access, no cookies, no tracking and no advertising. The whole site is a handful of static files, which keeps it fast on slow connections and lets it work on almost any phone, tablet or computer made in the last several years.</p>

<h2 id="tools">The tools</h2>
<ul>
<li><a href="/water-eject/">Water eject</a> – a steady 165 Hz tone and an 80-second auto clean cycle for wet speakers.</li>
<li><a href="/dust-cleaner/">Dust cleaner</a> – a stepped 200–1500 Hz tone band for lint and fine dust.</li>
<li><a href="/vibration-cleaner/">Vibration cleaner</a> – rhythmic pulses combined with the phone's vibration motor where supported.</li>
<li><a href="/speaker-test/">Speaker test</a> – a left / right channel test and a 50 Hz to 16 kHz sweep.</li>
</ul>
<p>Every mode supports left, right or both speaker selection, a tone level control, and a clear start and stop button.</p>

<h2 id="principles">How we build it</h2>
<ul>
<li><strong>Honest about limits.</strong> Sound can move loose water and debris; it cannot fix a torn speaker or corrosion. Each page explains when to stop and seek repair.</li>
<li><strong>Safety first.</strong> Tones fade in and out to avoid pops, volumes are moderate by default, and the guides repeatedly remind you to keep the phone away from your ears.</li>
<li><strong>Accessible.</strong> Controls are real buttons and form fields with labels, status updates are announced to screen readers, and animations respect reduced-motion settings.</li>
<li><strong>Open source.</strong> The code is published under the MIT License on <a href="https://github.com/speakercleanerapp/speakercleanerapp.github.io">GitHub</a>, so anyone can see exactly what the site does.</li>
</ul>

<h2 id="disclaimer">Disclaimer</h2>
<p>Speaker Cleaner is provided as is, without any warranty. It is not affiliated with any phone manufacturer. If your device was submerged for a long time, exposed to salt water or other liquids, or shows signs of damage, follow the manufacturer's guidance and consider a qualified repair service.</p>
