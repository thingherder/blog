/* ===========================================================
   Echo Sinclair — generative editorial art
   On-brand recreations of the originals' intent (contemplative
   line-art: cairns, horizons, reefs, contours) rendered in the
   design system's warm-paper palette. Deterministic per slug.
   Exports window.EchoArt (React component) + window.echoArtSVG.
   =========================================================== */
(function () {
  /* seeded PRNG -------------------------------------------------- */
  function hashStr(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* warm palettes drawn only from design-system tokens ---------- */
  const PALETTES = [
    { g: "#F1ECDE", line: "#234B30", mid: "#4F7A53", soft: "#8AA886", accent: "#BE8A2C" }, // pine / ember
    { g: "#E8E3D2", line: "#143324", mid: "#4F7A53", soft: "#8AA886", accent: "#B06A41" }, // deep / clay
    { g: "#ECE5D5", line: "#4F7A53", mid: "#A89A82", soft: "#C9C1AC", accent: "#234B30" }, // stone / pine
    { g: "#E3EADC", line: "#234B30", mid: "#4F7A53", soft: "#8AA886", accent: "#BE8A2C" }, // sage tint
    { g: "#EFEADC", line: "#143324", mid: "#4F7A53", soft: "#A89A82", accent: "#BE8A2C" },
  ];

  const W = 800, H = 500;
  const r2 = (n) => Math.round(n * 100) / 100;

  /* --- archetype: cairn (the totem) ----------------------------- */
  function cairn(R, p) {
    const cx = 400 + (R() - 0.5) * 60;
    let s = "";
    // distant ridges
    for (let k = 0; k < 2; k++) {
      const base = 250 + k * 26, amp = 38 - k * 12;
      let d = `M0 ${base}`;
      for (let x = 0; x <= W; x += 80) d += ` L${x} ${r2(base - Math.sin(x / 120 + k * 2 + R()) * amp - R() * 10)}`;
      d += ` L${W} ${H} L0 ${H} Z`;
      s += `<path d="${d}" fill="${k === 0 ? p.soft : p.mid}" opacity="${0.16 + k * 0.06}"/>`;
    }
    // sun / moon
    const sunY = 120 + R() * 40;
    s += `<circle cx="${r2(cx + 150)}" cy="${r2(sunY)}" r="46" fill="none" stroke="${p.accent}" stroke-width="1.5" opacity="0.55"/>`;
    // ground line
    s += `<line x1="0" y1="372" x2="${W}" y2="372" stroke="${p.line}" stroke-width="1" opacity="0.3"/>`;
    // the stack
    let y = 366, w = 78;
    const n = 5 + Math.floor(R() * 3);
    for (let i = 0; i < n; i++) {
      const rx = w / 2, ry = Math.max(8, rx * 0.36);
      const ox = (R() - 0.5) * 10;
      const marker = i === Math.floor(n / 2);
      s += `<ellipse cx="${r2(cx + ox)}" cy="${r2(y)}" rx="${r2(rx)}" ry="${r2(ry)}" fill="${marker ? p.accent : "none"}" fill-opacity="${marker ? 0.14 : 0}" stroke="${marker ? p.accent : p.line}" stroke-width="${marker ? 2 : 1.7}" opacity="${marker ? 0.85 : 0.78}"/>`;
      y -= ry * 2 + 5 + R() * 3;
      w *= 0.82 + R() * 0.05;
    }
    // scattered stones
    for (let i = 0; i < 5; i++) {
      const sx = R() * W, sr = 3 + R() * 5;
      s += `<ellipse cx="${r2(sx)}" cy="${r2(376 + R() * 8)}" rx="${r2(sr)}" ry="${r2(sr * 0.5)}" fill="${p.mid}" opacity="0.28"/>`;
    }
    return s;
  }

  /* --- archetype: contour map ----------------------------------- */
  function contours(R, p) {
    const cx = 300 + R() * 260, cy = 200 + R() * 120;
    const seedAng = [];
    for (let i = 0; i < 12; i++) seedAng.push(0.55 + R() * 0.7);
    let s = "";
    const rings = 8 + Math.floor(R() * 3);
    for (let r = 0; r < rings; r++) {
      const scale = 26 + r * 26;
      let d = "";
      for (let i = 0; i <= 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        const wob = seedAng[i % 12];
        const rad = scale * (0.7 + wob * 0.5);
        const x = cx + Math.cos(a) * rad * 1.25;
        const y = cy + Math.sin(a) * rad * 0.82;
        d += (i === 0 ? "M" : "L") + r2(x) + " " + r2(y) + " ";
      }
      d += "Z";
      const isPeak = r === 0;
      s += `<path d="${d}" fill="none" stroke="${r % 3 === 0 ? p.line : p.mid}" stroke-width="${isPeak ? 1.6 : 1.1}" opacity="${r2(0.7 - r * 0.045)}"/>`;
    }
    s += `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="3.4" fill="${p.accent}"/>`;
    return s;
  }

  /* --- archetype: ripples (water / reef) ------------------------ */
  function ripples(R, p) {
    const ox = 300 + R() * 240, oy = 300 + R() * 80;
    let s = `<line x1="0" y1="${r2(oy)}" x2="${W}" y2="${r2(oy)}" stroke="${p.line}" stroke-width="1" opacity="0.28"/>`;
    const n = 7 + Math.floor(R() * 3);
    for (let i = 1; i <= n; i++) {
      const rx = i * (30 + R() * 8), ry = rx * 0.34;
      s += `<ellipse cx="${r2(ox)}" cy="${r2(oy)}" rx="${r2(rx)}" ry="${r2(ry)}" fill="none" stroke="${i % 2 ? p.mid : p.soft}" stroke-width="1.2" opacity="${r2(0.6 - i * 0.05)}"/>`;
    }
    // overhead arcs (sky echo)
    for (let i = 1; i <= 3; i++) {
      const rad = 60 + i * 46;
      s += `<path d="M${r2(ox - rad)} ${r2(oy - 0)} A ${r2(rad)} ${r2(rad)} 0 0 1 ${r2(ox + rad)} ${r2(oy)}" fill="none" stroke="${p.line}" stroke-width="1" opacity="${r2(0.2 - i * 0.03)}"/>`;
    }
    s += `<circle cx="${r2(ox)}" cy="${r2(oy)}" r="4" fill="${p.accent}"/>`;
    return s;
  }

  /* --- archetype: horizon + sun --------------------------------- */
  function horizonSun(R, p) {
    const sunX = 240 + R() * 320, sunY = 230 + R() * 40, rad = 70 + R() * 26;
    let s = `<circle cx="${r2(sunX)}" cy="${r2(sunY)}" r="${r2(rad)}" fill="${p.accent}" opacity="0.13"/>`;
    s += `<circle cx="${r2(sunX)}" cy="${r2(sunY)}" r="${r2(rad)}" fill="none" stroke="${p.accent}" stroke-width="1.5" opacity="0.5"/>`;
    // layered hills
    const layers = 4;
    for (let k = 0; k < layers; k++) {
      const base = 280 + k * 44, amp = 30 + R() * 24;
      let d = `M0 ${r2(base)}`;
      const ph = R() * 6;
      for (let x = 0; x <= W; x += 40) d += ` L${x} ${r2(base - Math.sin(x / (140 - k * 18) + ph) * amp)}`;
      d += ` L${W} ${H} L0 ${H} Z`;
      const tones = [p.soft, p.mid, p.mid, p.line];
      s += `<path d="${d}" fill="${tones[k]}" opacity="${r2(0.2 + k * 0.16)}"/>`;
    }
    return s;
  }

  /* --- archetype: strata / weave -------------------------------- */
  function strata(R, p) {
    let s = "";
    let y = 70;
    const bands = 5 + Math.floor(R() * 2);
    for (let b = 0; b < bands; b++) {
      const lines = 3 + Math.floor(R() * 3);
      const gap = 7 + R() * 3;
      const amp = 6 + R() * 14;
      const ph = R() * 6;
      const accent = b === Math.floor(R() * bands);
      for (let l = 0; l < lines; l++) {
        let d = `M0 ${r2(y)}`;
        for (let x = 0; x <= W; x += 26) d += ` L${x} ${r2(y - Math.sin(x / 90 + ph + l * 0.4) * amp)}`;
        s += `<path d="${d}" fill="none" stroke="${accent ? p.accent : (b % 2 ? p.line : p.mid)}" stroke-width="${accent ? 1.6 : 1.1}" opacity="${accent ? 0.6 : r2(0.42 - b * 0.02)}"/>`;
        y += gap;
      }
      y += 22 + R() * 16;
      if (y > H - 30) break;
    }
    return s;
  }

  /* --- archetype: branches / mycelium --------------------------- */
  function branches(R, p) {
    let s = `<line x1="0" y1="430" x2="${W}" y2="430" stroke="${p.line}" stroke-width="1" opacity="0.25"/>`;
    const tips = [];
    function grow(x, y, ang, len, depth) {
      if (depth <= 0 || len < 10) { tips.push([x, y]); return; }
      const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
      s += `<line x1="${r2(x)}" y1="${r2(y)}" x2="${r2(x2)}" y2="${r2(y2)}" stroke="${depth > 3 ? p.line : p.mid}" stroke-width="${r2(Math.max(0.8, depth * 0.5))}" opacity="${r2(0.4 + depth * 0.07)}"/>`;
      const branchN = 2 + (R() < 0.4 ? 1 : 0);
      for (let i = 0; i < branchN; i++) {
        const spread = (R() - 0.5) * 1.1;
        grow(x2, y2, ang + spread, len * (0.66 + R() * 0.14), depth - 1);
      }
    }
    const roots = 2 + Math.floor(R() * 2);
    for (let i = 0; i < roots; i++) {
      const bx = 200 + (i + R()) * (400 / roots);
      grow(bx, 430, -Math.PI / 2 + (R() - 0.5) * 0.5, 70 + R() * 28, 5);
    }
    tips.forEach((t) => { if (R() < 0.5) s += `<circle cx="${r2(t[0])}" cy="${r2(t[1])}" r="${r2(2 + R() * 2)}" fill="${p.accent}" opacity="0.8"/>`; });
    return s;
  }

  const ARCHES = { cairn, contours, ripples, horizonSun, strata, branches };

  /* motif keyword → archetype (thematic resonance) --------------- */
  const MOTIF = [
    [/cairn|stigmerg|ghost|wak|stranger|shrug|reject|name|queried|resemblance|compliance/, "cairn"],
    [/watershed|cartograph|almanac|sextant|sundial|dowsing|plumb|keel|anchor|ballast|map|grammar/, "contours"],
    [/reef|tide|well|prism|sounding|pendulum|fugue|estuary|riverbed|river|water|whetstone|darkroom/, "ripples"],
    [/clearing|hearth|lantern|threshold|borrowed-light|kiln|bellows|hinge|lintel|mountain|fallow|reaching|light/, "horizonSun"],
    [/loom|quilt|mosaic|patina|compost|palimpsest|draft|mortar|splice|seam|graft|knot|dialect|sourdough|margin|scaffold|ugly|relay/, "strata"],
    [/mycelium|canopy|trellis|chorus|thread|family|greenhouse|lichen|molt|apprentice|understudy|tuning|hinge|whole|upstream/, "branches"],
  ];
  function pickArche(slug, R) {
    for (const [re, name] of MOTIF) if (re.test(slug)) return name;
    const keys = Object.keys(ARCHES);
    return keys[Math.floor(R() * keys.length)];
  }

  function echoArtSVG(seedStr) {
    const slug = (seedStr || "echo").toLowerCase();
    const R = mulberry32(hashStr(slug));
    const p = PALETTES[Math.floor(R() * PALETTES.length)];
    const arche = pickArche(slug, R);
    const inner = ARCHES[arche](R, p);
    // grain / vignette
    const grain = `<rect width="${W}" height="${H}" fill="url(#esArtVig${1})" opacity="0.5"/>`;
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <defs>
        <radialGradient id="esArtGrad" cx="50%" cy="38%" r="80%">
          <stop offset="0%" stop-color="${p.g}"/>
          <stop offset="100%" stop-color="${shade(p.g, -8)}"/>
        </radialGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#esArtGrad)"/>
      ${inner}
    </svg>`;
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function EchoArt({ seed, className, style }) {
    const html = React.useMemo(() => echoArtSVG(seed), [seed]);
    return <div className={"es-art " + (className || "")} style={style} dangerouslySetInnerHTML={{ __html: html }} />;
  }

  window.echoArtSVG = echoArtSVG;
  window.EchoArt = EchoArt;
})();
