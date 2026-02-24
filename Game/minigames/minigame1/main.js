// P4 — Early Containment Minigame
// Converted from standalone HTML to class-based integration

(() => {
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  class MiniGameP4_EarlyContainment {
    constructor({ canvas, ctx, assets, onComplete }) {
      this.canvas = canvas;
      this.ctx = ctx;
      this.assets = assets || {};
      this.onComplete = onComplete || (() => {});

      // Config
      this.CFG = {
        durationSec: 20,
        lanes: 3,
        risePerSec: 0.08,
        jitterPerSec: 0.06,
        naturalDecayPerSec: 0.03,
        calmDurationSec: 2.2,
        calmStrength: 0.75,
        calmDropPerSec: 0.18,
        warn: 0.70,
        critical: 0.85,
        max: 1.0,
        recalibrateHoldSec: 1.0,
        recalibrateDropPerSec: 0.35,
        bg: "#0B0B0B",
        laneFill: "#111111",
        laneStroke: "rgba(242,193,78,0.25)",
        laneStrokeHot: "rgba(242,193,78,0.55)",
        textPrimary: "rgba(255,255,255,0.92)",
        textSecondary: "rgba(255,255,255,0.70)",
      };

      // State
      this.state = {
        t: 0,
        ended: false,
        msg: "Slow what's rising.",
        msgTimer: 0,
        calmLane: -1,
        calmTimer: 0,
        recalibrating: false,
        recalibTimer: 0,
        lanes: Array.from({ length: this.CFG.lanes }, () => ({
          a: 0.25 + Math.random() * 0.25,
          phase: Math.random() * Math.PI * 2
        })),
      };
    }

    laneIndexFromXY(x, y) {
      const w = this.canvas.width;
      const h = this.canvas.height;
      const padX = Math.min(60, w * 0.06);
      const padTop = Math.min(90, h * 0.10);
      const padBottom = Math.min(70, h * 0.10);

      const areaW = w - padX * 2;
      const areaH = h - padTop - padBottom;

      const gap = Math.max(18, areaW * 0.04);
      const laneW = (areaW - gap * (this.CFG.lanes - 1)) / this.CFG.lanes;

      const startX = padX;
      const startY = padTop;

      if (x < startX || x > startX + areaW || y < startY || y > startY + areaH) return -1;

      for (let i = 0; i < this.CFG.lanes; i++) {
        const lx = startX + i * (laneW + gap);
        if (x >= lx && x <= lx + laneW) return i;
      }
      return -1;
    }

    onPointerDown(x, y) {
      if (this.state.ended || this.state.recalibrating) return;

      const idx = this.laneIndexFromXY(x, y);
      if (idx >= 0) {
        this.state.calmLane = idx;
        this.state.calmTimer = this.CFG.calmDurationSec;
      }
    }

    setMsg(text, seconds = 1.0) {
      this.state.msg = text;
      this.state.msgTimer = Math.max(this.state.msgTimer, seconds);
    }

    update(dt) {
      if (this.state.ended) return;

      this.state.t += dt;
      if (this.state.t >= this.CFG.durationSec) {
        this.state.ended = true;
        this.setMsg("Stability, for now.", 999);
        setTimeout(() => this.onComplete(), 800);
        return;
      }

      if (this.state.msgTimer > 0) {
        this.state.msgTimer = Math.max(0, this.state.msgTimer - dt);
        if (this.state.msgTimer === 0) this.state.msg = "Slow what's rising.";
      }

      if (this.state.calmTimer > 0) {
        this.state.calmTimer = Math.max(0, this.state.calmTimer - dt);
        if (this.state.calmTimer === 0) this.state.calmLane = -1;
      }

      if (this.state.recalibrating) {
        this.state.recalibTimer += dt;

        for (const l of this.state.lanes) {
          l.a = Math.max(0, l.a - this.CFG.recalibrateDropPerSec * dt);
        }

        this.setMsg("Recalibrating…", 0.3);

        if (this.state.recalibTimer >= this.CFG.recalibrateHoldSec) {
          this.state.recalibrating = false;
          this.state.recalibTimer = 0;
          this.state.calmLane = 1;
          this.state.calmTimer = 1.2;
          this.setMsg("Contain early.", 1.0);
        }
        return;
      }

      let anyWarn = false;
      let allCritical = true;

      for (let i = 0; i < this.state.lanes.length; i++) {
        const l = this.state.lanes[i];

        l.phase += dt * (0.8 + i * 0.15);
        const wobble = Math.sin(l.phase) * 0.015;

        const jitter = (Math.random() - 0.5) * this.CFG.jitterPerSec;
        let rise = this.CFG.risePerSec + jitter + wobble;

        if (i === this.state.calmLane && this.state.calmTimer > 0) {
          rise *= (1 - this.CFG.calmStrength);
          l.a -= this.CFG.calmDropPerSec * dt;
        }

        l.a += rise * dt;
        l.a -= this.CFG.naturalDecayPerSec * dt;
        l.a = Math.max(0, Math.min(this.CFG.max, l.a));

        if (l.a >= this.CFG.warn) anyWarn = true;
        if (l.a < this.CFG.critical) allCritical = false;
      }

      if (anyWarn) this.setMsg("Instability increasing.", 0.7);

      if (allCritical) {
        this.state.recalibrating = true;
        this.state.recalibTimer = 0;
        this.state.calmLane = -1;
        this.state.calmTimer = 0;
        this.setMsg("Recalibrating…", 0.8);
      }
    }

    render() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = this.CFG.bg;
      ctx.fillRect(0, 0, w, h);

      // Background grain/vignette overlay
      if (this.assets.bgGrainVignette) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.drawImage(this.assets.bgGrainVignette, 0, 0, w, h);
        ctx.restore();
      }

      const padX = Math.min(60, w * 0.06);
      const padTop = Math.min(90, h * 0.10);
      const padBottom = Math.min(70, h * 0.10);

      const areaW = w - padX * 2;
      const areaH = h - padTop - padBottom;

      const gap = Math.max(18, areaW * 0.04);
      const laneW = (areaW - gap * (this.CFG.lanes - 1)) / this.CFG.lanes;

      ctx.save();
      ctx.fillStyle = this.CFG.textPrimary;
      ctx.font = `500 ${Math.max(18, Math.min(34, w * 0.03))}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.state.msg, w / 2, padTop * 0.45);
      ctx.restore();

      for (let i = 0; i < this.CFG.lanes; i++) {
        const lx = padX + i * (laneW + gap);
        const ly = padTop;
        const lw = laneW;
        const lh = areaH;

        const a = this.state.lanes[i].a;
        const isCalm = (i === this.state.calmLane && this.state.calmTimer > 0);

        // Solid charcoal underlay to prevent checkerboard artifacts
        this.roundRect(ctx, lx, ly, lw, lh, Math.min(26, lw * 0.12));
        ctx.fillStyle = "#0E0E0E";
        ctx.fill();

        // Lane fill
        this.roundRect(ctx, lx, ly, lw, lh, Math.min(26, lw * 0.12));
        ctx.fillStyle = this.CFG.laneFill;
        ctx.fill();

        // Draw glass overlay on top of lane base
        if (this.assets.laneGlassOverlay) {
          ctx.save();
          ctx.globalAlpha = 0.25;
          this.roundRect(ctx, lx, ly, lw, lh, Math.min(26, lw * 0.12));
          ctx.clip();
          this.drawImageCover(ctx, this.assets.laneGlassOverlay, lx, ly, lw, lh);
          ctx.restore();
        }

        const hot = Math.max(0, (a - this.CFG.warn) / (this.CFG.max - this.CFG.warn));
        const stroke = this.mixRGBA(this.CFG.laneStroke, this.CFG.laneStrokeHot, hot);
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2;
        ctx.stroke();

        if (isCalm) {
          ctx.save();
          ctx.globalAlpha = 0.10;
          ctx.fillStyle = "rgba(242,193,78,1)";
          this.roundRect(ctx, lx, ly, lw, lh, Math.min(26, lw * 0.12));
          ctx.fill();
          ctx.restore();
        }

        const dotX = lx + lw * 0.5;
        const dotY = ly + (1 - a) * (lh * 0.86) + lh * 0.08;

        // Subtle trail for high activity only (>0.70)
        if (a > 0.70) {
          const trailLength = 18;
          const trailAlpha = Math.min(0.08, (a - 0.70) / 0.30 * 0.08);
          const grad = ctx.createLinearGradient(dotX, dotY + 4, dotX, dotY + 4 + trailLength);
          grad.addColorStop(0, `rgba(242,193,78,${trailAlpha})`);
          grad.addColorStop(1, "rgba(242,193,78,0)");
          ctx.fillStyle = grad;
          ctx.fillRect(dotX - 1, dotY + 4, 2, trailLength);
        }

        // Procedural signal pulse (core + aura with breathing)
        this.drawSignalPulse(dotX, dotY, 10 + a * 6, isCalm ? 0.85 : 0.65, a);

        if (a >= this.CFG.critical) {
          ctx.save();
          ctx.globalAlpha = 0.12;
          ctx.fillStyle = "rgba(242,193,78,1)";
          this.roundRect(ctx, lx, ly, lw, lh, Math.min(26, lw * 0.12));
          ctx.fill();
          ctx.restore();
        }
      }

      if (this.state.ended) {
        ctx.save();
        ctx.globalAlpha = 0.10;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

      if (this.state.recalibrating) {
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
    }

    roundRect(ctx, x, y, w, h, r) {
      const rr = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    }

    drawSignalPulse(x, y, baseRadius, baseAlpha, activity) {
      const ctx = this.ctx;
      
      // Subtle breathing effect (3-6% modulation)
      const breathPhase = (this.state.t * 1.8) % (Math.PI * 2);
      const breathMod = 1 + Math.sin(breathPhase) * 0.045;
      
      const outerRadius = baseRadius * 2.8 * breathMod;
      const innerRadius = baseRadius * 0.75;
      
      ctx.save();
      
      // Outer aura (large, very low alpha)
      const auraAlpha = baseAlpha * 0.15 * breathMod;
      const auraGrad = ctx.createRadialGradient(x, y, 0, x, y, outerRadius);
      auraGrad.addColorStop(0, `rgba(242,193,78,${auraAlpha * 0.6})`);
      auraGrad.addColorStop(0.4, `rgba(242,193,78,${auraAlpha * 0.3})`);
      auraGrad.addColorStop(1, "rgba(242,193,78,0)");
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(x, y, outerRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner core (small, warm near-white center)
      const coreAlpha = baseAlpha * 0.92;
      const coreGrad = ctx.createRadialGradient(x, y, 0, x, y, innerRadius);
      coreGrad.addColorStop(0, `rgba(255,248,235,${coreAlpha})`);
      coreGrad.addColorStop(0.5, `rgba(242,193,78,${coreAlpha * 0.85})`);
      coreGrad.addColorStop(1, `rgba(242,193,78,${coreAlpha * 0.4})`);
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }

    drawImageCover(ctx, img, dx, dy, dw, dh) {
      const iw = img.width || 1;
      const ih = img.height || 1;
      const s = Math.max(dw / iw, dh / ih);
      const sw = dw / s;
      const sh = dh / s;
      const sx = (iw - sw) / 2;
      const sy = (ih - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
    }

    mixRGBA(a, b, t) {
      const pa = a.match(/rgba\(([^)]+)\)/)[1].split(",").map(s => parseFloat(s));
      const pb = b.match(/rgba\(([^)]+)\)/)[1].split(",").map(s => parseFloat(s));
      const r = pa[0] + (pb[0] - pa[0]) * t;
      const g = pa[1] + (pb[1] - pa[1]) * t;
      const bb = pa[2] + (pb[2] - pa[2]) * t;
      const aa = pa[3] + (pb[3] - pa[3]) * t;
      return `rgba(${r.toFixed(0)},${g.toFixed(0)},${bb.toFixed(0)},${aa.toFixed(2)})`;
    }
  }

  window.VizzhyMinigames = window.VizzhyMinigames || {};
  window.VizzhyMinigames.MiniGameP4_EarlyContainment = MiniGameP4_EarlyContainment;
})();
