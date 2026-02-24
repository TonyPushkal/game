// P2 — Slow the Noise Minigame
// Hold-to-stabilize overlay minigame

(() => {
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  class MiniGameP2_SlowNoise {
    constructor({ canvas, ctx, assets, onComplete }) {
      this.canvas = canvas;
      this.ctx = ctx;
      this.assets = assets || {};
      this.onComplete = onComplete || (() => {});

      // Config
      this.CFG = {
        durationSec: 20,
        focusDrainPerSec: 0.35,
        focusRechargePerSec: 0.18,
        noiseDecreasePerSec: 0.25,
        noiseIncreasePerSec: 0.08,
        clearThreshold: 0.35,
        lowFocusThreshold: 0.15,
        bg: "#0B0B0B",
        textPrimary: "rgba(255,255,255,0.92)",
        textSecondary: "rgba(255,255,255,0.70)",
      };

      // State
      this.state = {
        t: 0,
        focus: 0.75,
        noiseLevel: 0.65,
        clearTime: 0,
        holding: false,
        ended: false,
        msg: "Slow the noise.",
        msgTimer: 0,
      };

      // Pointer state
      this.pointerDown = false;
    }

    onPointerDown(x, y) {
      if (this.state.ended) return;
      
      const w = this.canvas.width;
      const h = this.canvas.height;
      
      // Check if pointer is in button area (lower third of screen)
      const buttonY = h * 0.65;
      if (y >= buttonY) {
        this.pointerDown = true;
        this.state.holding = true;
      }
    }

    onPointerUp(x, y) {
      this.pointerDown = false;
      this.state.holding = false;
    }

    isDone() {
      return this.state.ended;
    }

    setMsg(text, seconds = 1.0) {
      this.state.msg = text;
      this.state.msgTimer = Math.max(this.state.msgTimer, seconds);
    }

    update(dt) {
      if (this.state.ended) return;

      this.state.t += dt;

      // End condition
      if (this.state.t >= this.CFG.durationSec) {
        this.state.ended = true;
        this.setMsg("Clearer — not complete.", 999);
        setTimeout(() => this.onComplete(), 800);
        return;
      }

      // Message timer decay
      if (this.state.msgTimer > 0) {
        this.state.msgTimer = Math.max(0, this.state.msgTimer - dt);
        if (this.state.msgTimer === 0) this.state.msg = "Slow the noise.";
      }

      // Focus mechanics
      if (this.state.holding) {
        this.state.focus = Math.max(0, this.state.focus - this.CFG.focusDrainPerSec * dt);
        
        // Only reduce noise if we have focus
        if (this.state.focus > 0) {
          this.state.noiseLevel = Math.max(0, this.state.noiseLevel - this.CFG.noiseDecreasePerSec * dt);
        }
      } else {
        this.state.focus = Math.min(1, this.state.focus + this.CFG.focusRechargePerSec * dt);
        this.state.noiseLevel = Math.min(1, this.state.noiseLevel + this.CFG.noiseIncreasePerSec * dt);
      }

      // Clear time accumulation
      if (this.state.noiseLevel < this.CFG.clearThreshold) {
        this.state.clearTime += dt;
      }

      // Soft consequence
      if (this.state.focus < this.CFG.lowFocusThreshold && this.state.holding) {
        this.setMsg("Short bursts.", 0.6);
      }
    }

    render() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      // Background
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

      // Panel dimensions
      const panelW = Math.min(w * 0.85, 600);
      const panelH = Math.min(h * 0.35, 220);
      const panelX = (w - panelW) / 2;
      const panelY = h * 0.25;

      // Panel background
      if (this.assets.waveformPanelBg) {
        ctx.drawImage(this.assets.waveformPanelBg, panelX, panelY, panelW, panelH);
      } else {
        ctx.fillStyle = "rgba(20,20,20,0.85)";
        this.roundRect(ctx, panelX, panelY, panelW, panelH, 12);
        ctx.fill();
      }

      // Waveform (procedural, alive)
      this.drawWaveform(panelX, panelY, panelW, panelH);

      // Focus meter (simple bar at top)
      const meterW = panelW * 0.8;
      const meterH = 6;
      const meterX = panelX + (panelW - meterW) / 2;
      const meterY = panelY - 20;

      ctx.fillStyle = "rgba(255,255,255,0.15)";
      this.roundRect(ctx, meterX, meterY, meterW, meterH, 3);
      ctx.fill();

      ctx.fillStyle = "rgba(242,193,78,0.75)";
      this.roundRect(ctx, meterX, meterY, meterW * this.state.focus, meterH, 3);
      ctx.fill();

      // Hold button (lower third)
      const buttonY = h * 0.65;
      const buttonSize = Math.min(w * 0.18, 100);
      const buttonX = w / 2;

      if (this.state.holding && this.assets.playPressed) {
        ctx.drawImage(this.assets.playPressed, buttonX - buttonSize / 2, buttonY - buttonSize / 2, buttonSize, buttonSize);
      } else if (this.assets.playIdle) {
        ctx.drawImage(this.assets.playIdle, buttonX - buttonSize / 2, buttonY - buttonSize / 2, buttonSize, buttonSize);
      } else {
        // Fallback: simple circle
        ctx.save();
        ctx.fillStyle = this.state.holding ? "rgba(242,193,78,0.5)" : "rgba(242,193,78,0.3)";
        ctx.beginPath();
        ctx.arc(buttonX, buttonY, buttonSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(242,193,78,0.8)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      // Headline text
      ctx.save();
      ctx.fillStyle = this.CFG.textPrimary;
      ctx.font = `500 ${Math.max(18, Math.min(28, w * 0.028))}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.state.msg, w / 2, h * 0.12);
      ctx.restore();

      // Instruction hint (subtle)
      if (!this.state.ended && this.state.t < 3) {
        ctx.save();
        ctx.fillStyle = this.CFG.textSecondary;
        ctx.font = `400 ${Math.max(14, Math.min(18, w * 0.018))}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
        ctx.textAlign = "center";
        const alpha = this.state.t < 2 ? 1 : (3 - this.state.t);
        ctx.globalAlpha = alpha * 0.7;
        ctx.fillText("Hold to stabilize", w / 2, buttonY + buttonSize / 2 + 30);
        ctx.restore();
      }
    }

    drawWaveform(panelX, panelY, panelW, panelH) {
      const ctx = this.ctx;
      const centerY = panelY + panelH / 2;
      const points = 60;
      const spacing = panelW / (points - 1);
      
      // Base amplitude driven by noise level
      const baseAmp = panelH * 0.25 * this.state.noiseLevel;
      
      ctx.save();
      ctx.strokeStyle = "rgba(242,193,78,0.75)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      for (let i = 0; i < points; i++) {
        const x = panelX + i * spacing;
        
        // Multiple sine waves for organic feel
        const freq1 = 0.08 + this.state.noiseLevel * 0.05;
        const freq2 = 0.15 + this.state.noiseLevel * 0.08;
        const phase = this.state.t * 1.2;
        
        const wave1 = Math.sin((i * freq1 + phase) * Math.PI * 2);
        const wave2 = Math.sin((i * freq2 + phase * 0.7) * Math.PI * 2) * 0.5;
        
        // Jitter increases with noise
        const jitter = (Math.random() - 0.5) * this.state.noiseLevel * 0.3;
        
        const y = centerY + (wave1 + wave2 + jitter) * baseAmp;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      
      ctx.stroke();
      ctx.restore();
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
  }

  // Expose to the world
  window.VizzhyMinigames = window.VizzhyMinigames || {};
  window.VizzhyMinigames.MiniGameP2_SlowNoise = MiniGameP2_SlowNoise;
})();
