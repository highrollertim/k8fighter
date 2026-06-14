// js/art-stages.js — three procedural parallax stages. Browser only.
(function (root) {
  'use strict';
  const FC = root.FC;

  function sky(ctx, vw, vh, c0, c1) {
    const g = ctx.createLinearGradient(0, 0, 0, vh);
    g.addColorStop(0, c0); g.addColorStop(1, c1);
    ctx.fillStyle = g; ctx.fillRect(0, 0, vw, vh);
  }
  function floor(ctx, vw, vh, c0, c1) {
    const g = ctx.createLinearGradient(0, FC.FLOOR_Y, 0, vh);
    g.addColorStop(0, c0); g.addColorStop(1, c1);
    ctx.fillStyle = g; ctx.fillRect(0, FC.FLOOR_Y, vw, vh - FC.FLOOR_Y);
  }

  // ─── FOREST ───────────────────────────────────────────────────────────────
  function forest(ctx, vw, vh, t) {
    const FY = FC.FLOOR_Y; // 470

    // Sky gradient – sick green/teal night
    sky(ctx, vw, vh, '#1e2b1e', '#3a4a2c');

    // Moon glow (soft halo behind moon)
    const mx = vw * 0.72, my = 108;
    const moonHalo = ctx.createRadialGradient(mx, my, 10, mx, my, 120);
    moonHalo.addColorStop(0, 'rgba(180,220,100,0.18)');
    moonHalo.addColorStop(1, 'rgba(180,220,100,0)');
    ctx.fillStyle = moonHalo; ctx.fillRect(mx - 120, my - 120, 240, 240);

    // Moon disc
    ctx.fillStyle = 'rgba(200,230,140,0.55)';
    ctx.beginPath(); ctx.arc(mx, my, 34, 0, Math.PI * 2); ctx.fill();

    // ── Layer 1: Far trees (faint, small, slow scroll)
    ctx.globalAlpha = 0.38;
    ctx.fillStyle = '#283520';
    for (let i = 0; i < 12; i++) {
      const x = ((i * 88 + t * 0.06) % (vw + 80)) - 40;
      const h = 120 + (i % 4) * 18;
      const w = 22 + (i % 3) * 4;
      ctx.beginPath();
      ctx.moveTo(x, FY); ctx.lineTo(x + w * 0.5, FY - h); ctx.lineTo(x + w, FY);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Horizontal fog band at tree line (far layer)
    const fog = ctx.createLinearGradient(0, 270, 0, 340);
    fog.addColorStop(0, 'rgba(100,130,80,0)');
    fog.addColorStop(0.4, 'rgba(90,120,70,0.22)');
    fog.addColorStop(1, 'rgba(100,130,80,0)');
    ctx.fillStyle = fog; ctx.fillRect(0, 270, vw, 70);

    // ── Layer 2: Mid trees (medium, moderate scroll)
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = '#1c2a18';
    for (let i = 0; i < 8; i++) {
      const x = ((i * 135 + t * 0.14) % (vw + 120)) - 50;
      const h = 190 + (i % 3) * 30;
      const w = 38 + (i % 4) * 6;
      ctx.beginPath();
      ctx.moveTo(x, FY); ctx.lineTo(x + w * 0.5, FY - h); ctx.lineTo(x + w, FY);
      ctx.fill();
      // extra foliage blob
      ctx.beginPath(); ctx.arc(x + w * 0.5, FY - h + 20, w * 0.45, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ── Layer 3: Near trees (dark, fast scroll, frame the sides)
    ctx.fillStyle = '#111a10';
    for (let i = 0; i < 6; i++) {
      const x = ((i * 175 + t * 0.28) % (vw + 160)) - 60;
      const h = 260 + (i % 3) * 40;
      const w = 55 + (i % 3) * 8;
      ctx.beginPath();
      ctx.moveTo(x, FY); ctx.lineTo(x + w * 0.5, FY - h); ctx.lineTo(x + w, FY);
      ctx.fill();
      ctx.beginPath(); ctx.arc(x + w * 0.5, FY - h + 24, w * 0.52, 0, Math.PI * 2); ctx.fill();
    }

    // Floor
    floor(ctx, vw, vh, '#344528', '#202e18');

    // Glowing ground mushrooms – stay fixed, back of floor
    const mushColors = ['#e86010', '#d04808', '#f07820'];
    for (let i = 0; i < 6; i++) {
      const mx2 = 80 + i * 145;
      const my2 = FY - 2;
      const cr = 10 + (i % 3) * 3;
      // glow
      const mglow = ctx.createRadialGradient(mx2, my2 - cr * 0.6, 0, mx2, my2, cr * 2.2);
      mglow.addColorStop(0, 'rgba(240,120,20,0.35)');
      mglow.addColorStop(1, 'rgba(240,120,20,0)');
      ctx.fillStyle = mglow; ctx.fillRect(mx2 - cr * 2.2, my2 - cr * 2.2, cr * 4.4, cr * 4.4);
      // cap
      ctx.fillStyle = mushColors[i % 3];
      ctx.beginPath(); ctx.ellipse(mx2, my2 - cr, cr, cr * 0.65, 0, Math.PI, 0, true); ctx.fill();
      // stem
      ctx.fillStyle = '#c8b070';
      ctx.fillRect(mx2 - cr * 0.22, my2 - cr, cr * 0.44, cr);
    }

    // Hanging vines from top edge
    ctx.strokeStyle = '#2a3d1a';
    for (let i = 0; i < 9; i++) {
      const vx = i * 112 + 30 + Math.sin(t * 0.008 + i) * 4;
      const vlen = 60 + (i % 4) * 28;
      ctx.lineWidth = 1.5 + (i % 2);
      ctx.globalAlpha = 0.65 + (i % 3) * 0.1;
      ctx.beginPath();
      ctx.moveTo(vx, 0);
      // gentle S-curve droop
      ctx.bezierCurveTo(vx + 8, vlen * 0.3, vx - 6, vlen * 0.7, vx + Math.sin(i) * 5, vlen);
      ctx.stroke();
      // a leaf nub
      ctx.fillStyle = '#3a5020';
      ctx.beginPath(); ctx.ellipse(vx + Math.sin(i) * 5, vlen, 5, 3, 0.4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.lineWidth = 1;

    // Drifting spores / fireflies (twinkle via sin(t))
    ctx.fillStyle = '#d4ff5a';
    for (let i = 0; i < 18; i++) {
      const a = t * 0.018 + i * 1.3;
      const sx = ((i * 57 + t * 0.35) % vw);
      const sy = 150 + Math.sin(a * 0.7 + i) * 140;
      const alpha = 0.15 + 0.55 * (0.5 + 0.5 * Math.sin(t * 0.04 + i * 2.1));
      ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.arc(sx, sy, 1.5 + (i % 3) * 0.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Gnarled foreground branch arcing across top edge
    ctx.strokeStyle = '#0d150c';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(-10, 30);
    ctx.bezierCurveTo(vw * 0.15, 70, vw * 0.45, 20, vw * 0.65, 55);
    ctx.bezierCurveTo(vw * 0.75, 75, vw * 0.88, 40, vw + 10, 60);
    ctx.stroke();
    // a couple of side twigs
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(vw * 0.3, 42); ctx.lineTo(vw * 0.28, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(vw * 0.58, 38); ctx.lineTo(vw * 0.62, 5); ctx.stroke();
    ctx.globalAlpha = 1; ctx.lineWidth = 1;
  }

  // ─── STREET ───────────────────────────────────────────────────────────────
  function street(ctx, vw, vh, t) {
    const FY = FC.FLOOR_Y;

    // Sky – purple night
    sky(ctx, vw, vh, '#1a1228', '#2e1f42');

    // Moon
    ctx.fillStyle = 'rgba(230,220,200,0.70)';
    ctx.beginPath(); ctx.arc(vw * 0.82, 68, 24, 0, Math.PI * 2); ctx.fill();
    const mh = ctx.createRadialGradient(vw * 0.82, 68, 10, vw * 0.82, 68, 90);
    mh.addColorStop(0, 'rgba(220,210,180,0.14)'); mh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = mh; ctx.fillRect(vw * 0.82 - 90, -22, 180, 180);

    // Telephone wires
    ctx.strokeStyle = '#120e1e';
    ctx.lineWidth = 1.5;
    for (let w = 0; w < 3; w++) {
      const y0 = 68 + w * 22;
      ctx.beginPath();
      ctx.moveTo(0, y0);
      // sagging catenary via quadratic
      ctx.quadraticCurveTo(vw * 0.25, y0 + 14, vw * 0.5, y0 + 4);
      ctx.quadraticCurveTo(vw * 0.75, y0 - 8, vw, y0 + 10);
      ctx.stroke();
    }
    ctx.lineWidth = 1;

    // Dense city skyline – back layer (shorter, faint)
    ctx.fillStyle = '#120e24';
    const bHeightsBack = [140, 100, 160, 90, 130, 110, 150, 80, 120, 95, 140, 105];
    for (let i = 0; i < 12; i++) {
      const bx = i * 82;
      const bh = bHeightsBack[i];
      ctx.fillRect(bx, FY - bh, 78, bh);
    }

    // Front layer – taller buildings with varied widths
    const bHeights = [220, 290, 170, 250, 200, 280, 180, 240, 195, 260];
    const bWidths  = [80,  65,  90,  70,  85,  60,  95,  72,  88,  68];
    ctx.fillStyle = '#1a1530';
    for (let i = 0; i < 10; i++) {
      const bx = i * 98 - 4;
      ctx.fillRect(bx, FY - bHeights[i], bWidths[i], bHeights[i]);
    }

    // Lit windows on front buildings
    for (let i = 0; i < 10; i++) {
      const bx = i * 98 - 4;
      const bh = bHeights[i];
      const bw = bWidths[i];
      const rows = Math.floor(bh / 22);
      const cols = Math.floor(bw / 14);
      for (let r = 1; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // some windows lit, seeded by position
          const lit = ((r * 7 + c * 13 + i * 3) % 5) < 2;
          if (!lit) continue;
          const wx = bx + c * 14 + 5;
          const wy = FY - bh + r * 22 + 6;
          const flicker = 0.55 + 0.35 * Math.sin(t * 0.03 + r * 0.8 + c * 1.1 + i);
          ctx.globalAlpha = flicker;
          // warm yellow-white window
          ctx.fillStyle = ((r + c + i) % 3 === 0) ? '#ffe090' : '#e0d090';
          ctx.fillRect(wx, wy, 7, 9);
        }
      }
    }
    ctx.globalAlpha = 1;

    // Neon signs (flickering alpha)
    const neonSigns = [
      { x: 72,  y: 128, w: 68, h: 14, c: '#ff5c3a', label: 'DINER'   },
      { x: 250, y: 108, w: 58, h: 14, c: '#5ae0ff', label: 'OPEN 24H' },
      { x: 440, y: 120, w: 72, h: 14, c: '#f0ff40', label: 'BAR'      },
      { x: 620, y: 100, w: 80, h: 14, c: '#e040f0', label: 'HOTEL'    },
      { x: 820, y: 115, w: 66, h: 14, c: '#ff4090', label: 'CLUB'     },
    ];
    for (const s of neonSigns) {
      const flicker = 0.55 + 0.45 * Math.sin(t * 0.07 * (1 + s.x * 0.001) + s.x * 0.04);
      ctx.globalAlpha = flicker;
      ctx.fillStyle = s.c; ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
      ctx.fillText(s.label, s.x + s.w * 0.5, s.y + 10);
    }
    ctx.globalAlpha = 1;

    // Street lamps
    for (let i = 0; i < 4; i++) {
      const lx = 140 + i * 230;
      const ly = FY - 20;
      // glow pool on the ground
      const gpool = ctx.createRadialGradient(lx, FY, 0, lx, FY, 70);
      gpool.addColorStop(0, 'rgba(255,220,120,0.22)');
      gpool.addColorStop(1, 'rgba(255,220,120,0)');
      ctx.fillStyle = gpool; ctx.fillRect(lx - 70, FY - 10, 140, 80);
      // pole
      ctx.strokeStyle = '#2a243c'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx, FY); ctx.stroke();
      // arm
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 18, ly - 18); ctx.stroke();
      // bulb halo
      const bhalo = ctx.createRadialGradient(lx + 18, ly - 20, 2, lx + 18, ly - 20, 28);
      bhalo.addColorStop(0, 'rgba(255,230,140,0.9)'); bhalo.addColorStop(1, 'rgba(255,230,140,0)');
      ctx.fillStyle = bhalo; ctx.fillRect(lx - 10, ly - 50, 60, 60);
      ctx.lineWidth = 1;
    }

    // Floor with wet neon sheen
    floor(ctx, vw, vh, '#252040', '#14102a');

    // Faint reflected neon ripples on the wet floor
    const neonReflColors = ['rgba(255,92,58,0.09)', 'rgba(90,224,255,0.07)', 'rgba(240,64,240,0.06)'];
    for (let i = 0; i < 3; i++) {
      const rx = 150 + i * 260;
      const rw = 120 + i * 30;
      const rflicker = 0.5 + 0.5 * Math.sin(t * 0.05 + i * 2.4);
      ctx.globalAlpha = rflicker;
      ctx.fillStyle = neonReflColors[i];
      ctx.fillRect(rx, FY + 4, rw, vh - FY - 4);
    }
    ctx.globalAlpha = 1;
  }

  // ─── EXPO / CON ───────────────────────────────────────────────────────────
  function con(ctx, vw, vh, t) {
    const FY = FC.FLOOR_Y;

    // Sky / hall background
    sky(ctx, vw, vh, '#283c52', '#4a6a8a');

    // Back wall band
    ctx.fillStyle = '#223044'; ctx.fillRect(0, 110, vw, 100);

    // Ceiling truss line
    ctx.strokeStyle = '#1a2a38'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, 50); ctx.lineTo(vw, 50); ctx.stroke();
    // cross-members
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const tx = i * (vw / 7);
      ctx.beginPath(); ctx.moveTo(tx, 0); ctx.lineTo(tx, 50); ctx.stroke();
    }
    ctx.lineWidth = 1;

    // Stage lights – translucent cones angling down from truss
    const lightColors = [
      'rgba(100,160,255,0.13)',
      'rgba(255,180,60,0.11)',
      'rgba(180,100,255,0.12)',
    ];
    const lightX = [vw * 0.2, vw * 0.5, vw * 0.8];
    for (let i = 0; i < 3; i++) {
      const lx = lightX[i];
      const pulse = 0.7 + 0.3 * Math.sin(t * 0.025 + i * 1.8);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = lightColors[i];
      ctx.beginPath();
      ctx.moveTo(lx, 50);
      ctx.lineTo(lx - 90, FY - 60);
      ctx.lineTo(lx + 90, FY - 60);
      ctx.closePath(); ctx.fill();
      // bright tip
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.arc(lx, 50, 5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ── Main banner row (top row of booths)
    const boothColors = ['#c0563f', '#5ad4ff', '#d4ff5a', '#e07030', '#a060e0'];
    for (let i = 0; i < 5; i++) {
      const bx = 40 + i * 186;
      ctx.fillStyle = boothColors[i % boothColors.length];
      ctx.fillRect(bx, 132, 160, 58);
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('EXPO', bx + 80, 164);
      // small decorative banner stripe
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(bx, 132, 160, 10);
    }

    // ── Second (smaller) signage row
    const smallSigns = ['COMICS', 'GAMES', 'ART', 'MERCH', 'INDIE', 'FOOD'];
    for (let i = 0; i < 6; i++) {
      const sx = 30 + i * 158;
      ctx.fillStyle = boothColors[(i + 2) % boothColors.length];
      ctx.globalAlpha = 0.75;
      ctx.fillRect(sx, 200, 130, 32);
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(255,255,255,0.80)';
      ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(smallSigns[i], sx + 65, 220);
    }

    // Crowd silhouette row (rounded heads) along back wall
    ctx.fillStyle = '#172334';
    for (let i = 0; i < 28; i++) {
      const hx = i * 35 + 8;
      const hy = 242;
      const hr = 9 + (i % 3) * 3;
      // head
      ctx.beginPath(); ctx.arc(hx, hy, hr, Math.PI, 0, false); ctx.fill();
      // shoulder nub
      ctx.fillRect(hx - hr, hy, hr * 2, 10);
    }

    // Mid booth structures (front row)
    for (let i = 0; i < 4; i++) {
      const bx = i * 240 + 40;
      ctx.fillStyle = '#2e3d50';
      ctx.fillRect(bx, 285, 190, FY - 285);
      // booth top trim
      ctx.fillStyle = boothColors[i % boothColors.length];
      ctx.globalAlpha = 0.55;
      ctx.fillRect(bx, 285, 190, 12);
      ctx.globalAlpha = 1;
      // simple table shape inside booth
      ctx.fillStyle = '#3a4d62';
      ctx.fillRect(bx + 20, FY - 50, 150, 8);
      ctx.fillRect(bx + 30, FY - 50, 8, 50);
      ctx.fillRect(bx + 152, FY - 50, 8, 50);
    }

    // Floor
    floor(ctx, vw, vh, '#5a4e40', '#3c342a');

    // Glossy floor reflection sheen (horizontal highlight strip)
    const sheen = ctx.createLinearGradient(0, FY, 0, FY + 40);
    sheen.addColorStop(0, 'rgba(255,255,255,0.10)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen; ctx.fillRect(0, FY, vw, 40);

    // Faint booth color reflections on floor
    for (let i = 0; i < 4; i++) {
      const bx = i * 240 + 40;
      ctx.globalAlpha = 0.07 + 0.04 * Math.sin(t * 0.02 + i);
      ctx.fillStyle = boothColors[i % boothColors.length];
      ctx.fillRect(bx + 20, FY, 150, vh - FY);
    }
    ctx.globalAlpha = 1;
  }

  // ─── PUBLIC API ───────────────────────────────────────────────────────────
  function draw(ctx, idx, vw, vh, t) {
    t = t || 0;
    if (idx === 1) street(ctx, vw, vh, t);
    else if (idx === 2) con(ctx, vw, vh, t);
    else forest(ctx, vw, vh, t);
  }

  root.ArtStages = { draw, COUNT: 3 };
})(window);
