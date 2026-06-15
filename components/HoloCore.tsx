'use client';

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface HoloCoreProps {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  response: string;
}

export default function HoloCore({ isListening, isProcessing, transcript, response }: HoloCoreProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; maxLife: number; size: number}>>([]);
  const linesRef = useRef<Array<{x1: number; y1: number; x2: number; y2: number; life: number; maxLife: number; angle: number; speed: number}>>([]);

  useEffect(() => {
    if (transcript) burstConfetti();
  }, [transcript]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let time = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const crossOrbiters: Array<{axis: 'h' | 'v' | 'd1' | 'd2'; radius: number; speed: number; phase: number; size: number}> = [];
    for (let i = 0; i < 60; i++) {
      crossOrbiters.push({
        axis: ['h', 'v', 'd1', 'd2'][i % 4] as 'h' | 'v' | 'd1' | 'd2',
        radius: 12 + (i % 8) * 10 + Math.sin(i) * 4,
        speed: (0.4 + i * 0.1) * (i % 3 === 0 ? -1 : 1),
        phase: (i * Math.PI * 2) / 60,
        size: 1 + (i % 3) * 1.5
      });
    }

    const sweepLines: Array<{angle: number; offset: number; speed: number; length: number; alpha: number}> = [];
    for (let i = 0; i < 20; i++) {
      sweepLines.push({
        angle: (i * Math.PI) / 10,
        offset: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.8,
        length: 0.2 + Math.random() * 0.5,
        alpha: 0.2 + Math.random() * 0.5
      });
    }

    const animate = () => {
      time += 0.016;
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;
      const cx = w / 2;
      const cy = h / 2;
      const intensity = isProcessing ? 6 : isListening ? 3.5 : 1.5;
      const maxR = Math.min(w, h) * 0.4;

      ctx.clearRect(0, 0, w, h);

      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      bgGrad.addColorStop(0, `rgba(60,8,0,${0.8 * intensity})`);
      bgGrad.addColorStop(0.5, `rgba(25,2,0,${0.4 * intensity})`);
      bgGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      for (let r = 0; r < 16; r++) {
        const sides = 3 + r;
        const radius = 15 + r * 9;
        const axisType = r % 4;
        
        ctx.save();
        ctx.translate(cx, cy);
        
        switch(axisType) {
          case 0: ctx.rotate(time * (0.8 + r * 0.25) * intensity); break;
          case 1: ctx.rotate(time * (0.7 + r * 0.3) * intensity * -1); ctx.scale(1, 0.25 + Math.sin(time + r) * 0.3); break;
          case 2: ctx.rotate(time * (0.9 + r * 0.2) * intensity); ctx.scale(0.25 + Math.cos(time + r) * 0.3, 1); break;
          case 3: ctx.rotate(time * (0.6 + r * 0.35) * intensity * -1); ctx.scale(0.45, 0.45); break;
        }
        
        ctx.strokeStyle = `rgba(255,${60 + r * 6},0,${0.2 + r * 0.04})`;
        ctx.lineWidth = 0.8 + (r % 3) * 0.4;
        ctx.shadowColor = '#ff4400';
        ctx.shadowBlur = 8 * intensity;
        ctx.setLineDash([5 + r * 2, 15 + r * 3]);
        ctx.lineDashOffset = time * 80 * intensity * (r % 2 === 0 ? 1 : -1);
        
        ctx.beginPath();
        for (let s = 0; s <= sides; s++) {
          const angle = (s / sides) * Math.PI * 2 - Math.PI / 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      crossOrbiters.forEach((orb) => {
        const angle = time * orb.speed * intensity + orb.phase;
        let ox = cx;
        let oy = cy;
        
        switch(orb.axis) {
          case 'h': ox = cx + Math.cos(angle) * orb.radius * 1.4; oy = cy + Math.sin(angle) * orb.radius * 0.25; break;
          case 'v': ox = cx + Math.cos(angle) * orb.radius * 0.25; oy = cy + Math.sin(angle) * orb.radius * 1.4; break;
          case 'd1': ox = cx + Math.cos(angle) * orb.radius * 0.9; oy = cy + Math.sin(angle) * orb.radius * 0.9; break;
          case 'd2': ox = cx + Math.cos(angle) * orb.radius * 0.9; oy = cy + Math.sin(angle) * orb.radius * -0.9; break;
        }
        
        for (let t = 1; t <= 3; t++) {
          const ta = angle - t * 0.05;
          let tx = cx;
          let ty = cy;
          switch(orb.axis) {
            case 'h': tx = cx + Math.cos(ta) * orb.radius * 1.4; ty = cy + Math.sin(ta) * orb.radius * 0.25; break;
            case 'v': tx = cx + Math.cos(ta) * orb.radius * 0.25; ty = cy + Math.sin(ta) * orb.radius * 1.4; break;
            case 'd1': tx = cx + Math.cos(ta) * orb.radius * 0.9; ty = cy + Math.sin(ta) * orb.radius * 0.9; break;
            case 'd2': tx = cx + Math.cos(ta) * orb.radius * 0.9; ty = cy + Math.sin(ta) * orb.radius * -0.9; break;
          }
          ctx.fillStyle = `rgba(255,60,0,${(1 - t / 3) * 0.3})`;
          ctx.beginPath();
          ctx.arc(tx, ty, orb.size * (1 - t * 0.2), 0, Math.PI * 2);
          ctx.fill();
        }
        
        const orbGlow = ctx.createRadialGradient(ox, oy, 0, ox, oy, orb.size * 2);
        orbGlow.addColorStop(0, 'rgba(255,180,100,0.95)');
        orbGlow.addColorStop(0.5, 'rgba(255,60,10,0.5)');
        orbGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = orbGlow;
        ctx.shadowColor = '#ff4400';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(ox, oy, orb.size * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      sweepLines.forEach((sweep) => {
        const sweepPhase = (time * sweep.speed + sweep.offset) % (Math.PI * 2);
        const sweepRadius = maxR * 0.65;
        const midX = cx + Math.cos(sweep.angle) * sweepRadius * Math.cos(sweepPhase);
        const midY = cy + Math.sin(sweep.angle) * sweepRadius * Math.sin(sweepPhase);
        const perpAngle = sweep.angle + Math.PI / 2;
        const halfLen = maxR * sweep.length;
        
        const x1 = midX + Math.cos(perpAngle) * halfLen;
        const y1 = midY + Math.sin(perpAngle) * halfLen;
        const x2 = midX - Math.cos(perpAngle) * halfLen;
        const y2 = midY - Math.sin(perpAngle) * halfLen;
        
        const lineGrad = ctx.createLinearGradient(x1, y1, x2, y2);
        lineGrad.addColorStop(0, 'rgba(255,50,0,0)');
        lineGrad.addColorStop(0.5, `rgba(255,100,30,${sweep.alpha * intensity})`);
        lineGrad.addColorStop(1, 'rgba(255,50,0,0)');
        
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#ff3300';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      for (let a = 0; a < 24; a++) {
        const arcCx = cx + Math.sin(time * 0.9 + a * 1.2) * maxR * 0.35;
        const arcCy = cy + Math.cos(time * 0.7 + a * 0.9) * maxR * 0.35;
        const arcRadius = 18 + (a % 5) * 14;
        const arcStart = time * (1 + a * 0.35) * intensity * (a % 2 === 0 ? 1 : -1);
        const arcLen = 0.6 + Math.sin(time * 3 + a) * 0.35;
        const arcAlpha = 0.35 + Math.sin(time * 4 + a * 0.7) * 0.25;
        
        ctx.strokeStyle = `rgba(255,${80 + a * 5},0,${arcAlpha * intensity})`;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#ff4400';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(arcCx, arcCy, arcRadius, arcStart, arcStart + arcLen);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      if (Math.random() < 0.4 * intensity) {
        const startAngle = Math.random() * Math.PI * 2;
        const lineLen = 15 + Math.random() * 70;
        linesRef.current.push({
          x1: cx + Math.cos(startAngle) * 8,
          y1: cy + Math.sin(startAngle) * 8,
          x2: cx + Math.cos(startAngle) * (8 + lineLen),
          y2: cy + Math.sin(startAngle) * (8 + lineLen),
          life: 0, maxLife: 15 + Math.random() * 35,
          angle: Math.random() * Math.PI * 2,
          speed: 1.5 + Math.random() * 5
        });
      }

      linesRef.current = linesRef.current.filter(l => {
        l.life++;
        const progress = l.life / l.maxLife;
        if (progress > 1) return false;
        const alpha = (1 - progress) * 0.7;
        
        const midX = (l.x1 + l.x2) / 2;
        const midY = (l.y1 + l.y2) / 2;
        const dx = l.x2 - l.x1;
        const dy = l.y2 - l.y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        
        ctx.save();
        ctx.translate(midX, midY);
        ctx.rotate(time * l.speed * intensity * (l.angle > Math.PI ? 1 : -1));
        
        ctx.strokeStyle = `rgba(255,120,40,${alpha})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ff4400';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(-len / 2, 0);
        ctx.lineTo(len / 2, 0);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
        return true;
      });

      for (let i = 0; i < 80; i++) {
        const beamAngle = (i * Math.PI * 2) / 80 + time * 0.3 * intensity * (i % 3 === 0 ? -1 : 1);
        const innerR = 8;
        const outerR = maxR * (0.35 + Math.sin(time * 5 + i * 0.4) * 0.25);
        const beamAlpha = 0.04 + Math.abs(Math.sin(time * 4 + i * 0.5)) * 0.08;
        
        ctx.strokeStyle = `rgba(255,60,0,${beamAlpha * intensity})`;
        ctx.lineWidth = 0.4;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(beamAngle) * innerR, cy + Math.sin(beamAngle) * innerR);
        ctx.lineTo(cx + Math.cos(beamAngle) * outerR, cy + Math.sin(beamAngle) * outerR);
        ctx.stroke();
      }

      for (let i = 0; i < 250; i++) {
        const sparkDir = i % 4;
        let px = cx;
        let py = cy;
        
        switch(sparkDir) {
          case 0: px = cx + ((time * 40 + i * 7) % 440) - 220; py = cy + Math.sin(time * 3 + i * 0.2) * maxR * 0.45; break;
          case 1: px = cx + Math.cos(time * 3 + i * 0.2) * maxR * 0.45; py = cy + ((time * 40 + i * 7) % 440) - 220; break;
          case 2: { const d1 = ((time * 40 + i * 7) % 440) - 220; px = cx + d1 * 0.7; py = cy + d1 * 0.7; break; }
          case 3: { const d2 = ((time * 40 + i * 7) % 440) - 220; px = cx + d2 * 0.7; py = cy - d2 * 0.7; break; }
        }
        
        if (Math.abs(px - cx) > maxR * 0.75 || Math.abs(py - cy) > maxR * 0.75) continue;
        
        const sparkAlpha = 0.12 + Math.abs(Math.sin(time * 4 + i * 0.3)) * 0.25;
        ctx.fillStyle = `rgba(255,${60 + (i * 2) % 100},0,${sparkAlpha})`;
        ctx.beginPath();
        ctx.arc(px, py, 0.3 + Math.random() * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let d = 0; d < 28; d++) {
        const pattern = d % 3;
        let sx = cx;
        let sy = cy;
        let rot = 0;
        const shardSize = 4 + Math.sin(d) * 2;
        
        switch(pattern) {
          case 0: {
            const circAngle = time * 0.8 * intensity + d * 0.3;
            sx = cx + Math.cos(circAngle) * (30 + (d % 4) * 9);
            sy = cy + Math.sin(circAngle) * (30 + (d % 4) * 9) * 0.5;
            rot = time * 4 * (d % 2 === 0 ? 1 : -1);
            break;
          }
          case 1: {
            const fig8 = time * 0.7 * intensity + d * 0.4;
            sx = cx + Math.sin(fig8) * 55;
            sy = cy + Math.sin(fig8 * 2) * 35;
            rot = time * 3.5;
            break;
          }
          case 2: {
            const zig = time * 0.9 * intensity + d;
            sx = cx + Math.cos(zig) * (35 + Math.sin(zig * 3) * 22);
            sy = cy + Math.sin(zig * 0.7) * 45;
            rot = time * 5 * (d % 2 === 0 ? 1 : -1);
            break;
          }
        }
        
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(rot);
        
        const shardAlpha = 0.4 + Math.sin(time * 4 + d) * 0.25;
        ctx.strokeStyle = `rgba(255,80,20,${shardAlpha * intensity})`;
        ctx.lineWidth = 1.2;
        ctx.shadowColor = '#ff3300';
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.moveTo(0, -shardSize);
        ctx.lineTo(shardSize * 0.7, 0);
        ctx.lineTo(0, shardSize * 0.7);
        ctx.lineTo(-shardSize * 0.7, 0);
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      if (isProcessing && Math.random() < 0.95) {
        for (let b = 0; b < 8; b++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 3 + Math.random() * 6;
          particlesRef.current.push({
            x: cx, y: cy, z: 0,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            vz: (Math.random() - 0.5) * 4,
            life: 0, maxLife: 12 + Math.random() * 22,
            size: 1 + Math.random() * 3
          });
        }
      }

      particlesRef.current = particlesRef.current.filter(p => {
        p.life++; p.x += p.vx; p.y += p.vy; p.vx *= 0.95; p.vy *= 0.95;
        const alpha = 1 - p.life / p.maxLife;
        if (alpha <= 0) return false;
        const pGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
        pGrad.addColorStop(0, `rgba(255,140,30,${alpha})`);
        pGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = pGrad;
        ctx.shadowColor = '#ff4400';
        ctx.shadowBlur = 8 * alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        return true;
      });

      const coreSize = maxR * 0.07;
      
      const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize * 3.5);
      coreGlow.addColorStop(0, `rgba(255,100,20,${0.95 * intensity})`);
      coreGlow.addColorStop(0.4, `rgba(255,40,5,${0.5 * intensity})`);
      coreGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = coreGlow;
      ctx.shadowColor = '#ff4400';
      ctx.shadowBlur = 50 * intensity;
      ctx.beginPath();
      ctx.arc(cx, cy, coreSize * 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.save(); ctx.translate(cx, cy);
      ctx.rotate(time * 4 * intensity);
      ctx.strokeStyle = `rgba(255,100,20,${0.9 * intensity})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ff3300'; ctx.shadowBlur = 25;
      ctx.beginPath();
      for (let s = 0; s <= 8; s++) {
        const a = (s / 8) * Math.PI * 2;
        s === 0 ? ctx.moveTo(Math.cos(a) * coreSize, Math.sin(a) * coreSize) : ctx.lineTo(Math.cos(a) * coreSize, Math.sin(a) * coreSize);
      }
      ctx.closePath(); ctx.stroke();
      
      ctx.rotate(-time * 6 * intensity);
      ctx.strokeStyle = `rgba(255,160,80,${0.6 * intensity})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let s = 0; s <= 6; s++) {
        const a = (s / 6) * Math.PI * 2;
        s === 0 ? ctx.moveTo(Math.cos(a) * coreSize * 0.55, Math.sin(a) * coreSize * 0.55) : ctx.lineTo(Math.cos(a) * coreSize * 0.55, Math.sin(a) * coreSize * 0.55);
      }
      ctx.closePath(); ctx.stroke();
      ctx.shadowBlur = 0; ctx.restore();

      const dotGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize * 0.25);
      dotGrad.addColorStop(0, 'rgba(255,255,240,1)');
      dotGrad.addColorStop(0.5, 'rgba(255,150,40,0.8)');
      dotGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = dotGrad;
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 40;
      ctx.beginPath();
      ctx.arc(cx, cy, coreSize * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (isProcessing || isListening) {
        for (let w = 0; w < (isProcessing ? 8 : 4); w++) {
          const phase = (time * 120 + w * (80 / (isProcessing ? 8 : 4))) % 80;
          const rippleR = coreSize + phase;
          ctx.strokeStyle = `rgba(255,50,0,${(1 - phase / 80) * (isProcessing ? 0.6 : 0.3)})`;
          ctx.lineWidth = 2.5 - phase / 80;
          ctx.shadowColor = '#ff3300'; ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(cx, cy, rippleR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      animFrame = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resize);
    };
  }, [isListening, isProcessing]);

  const burstConfetti = () => {
    confetti({
      particleCount: 200,
      spread: 360,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#ff4400', '#ff2200', '#ff6600', '#ff3300', '#cc0000', '#ff5500'],
      ticks: 40,
      gravity: 0.05,
      scalar: 4,
      shapes: ['circle', 'square'],
      drift: 3,
    });
  };

  return (
    <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-visible">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className={`text-[5px] tracking-[0.8em] transition-all duration-300 ${
            isProcessing ? 'text-[#ff4400] animate-pulse' : isListening ? 'text-[#ff3300]/70' : 'text-[#ff2200]/10'
          }`}
            style={{ textShadow: isProcessing ? '0 0 50px #ff4400, 0 0 100px #ff2200' : 'none' }}
          >
            {isProcessing ? '◆◆ EXECUTING ◆◆' : isListening ? '◆ LISTENING ◆' : 'J.A.R.V.I.S. ONLINE'}
          </p>
        </div>
      </div>
    </div>
  );
}