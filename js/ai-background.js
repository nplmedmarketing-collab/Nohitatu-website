/* ==========================================================================
   AI Engineering & Digital Cyber Matrix Background Engine (Face-Free)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('ai-code-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = canvas.width = canvas.parentElement.offsetWidth || window.innerWidth;
  let height = canvas.height = canvas.parentElement.offsetHeight || window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = canvas.parentElement.offsetWidth || window.innerWidth;
    height = canvas.height = canvas.parentElement.offsetHeight || window.innerHeight;
  });

  const codeSnippets = [
    'import { AIModel, NeuralNet } from "@nohitatu/ai";',
    'async function optimizeRCM(claims) {',
    '  const engine = new RCMScrubber({ rules: "HIPAA_2026" });',
    '  return await engine.processBatch(claims);',
    '}',
    'const aiAgent = new AutonomousCodingAgent({',
    '  stack: ["React", "Node.js", "Python", "Cloud"],',
    '  architecture: "Serverless_Microservices"',
    '});',
    'await aiAgent.buildSaaSPlatform();',
    '01010011 01000001 01000001 01010011 01011111 01000001 01001001',
    'SELECT * FROM medical_claims WHERE status = "SCRUBBED_VALIDATED";',
    'class HealthcareEngine extends AICore { deploy() }'
  ];

  // Floating Code Particles
  const particles = [];
  const particleCount = 55;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      text: codeSnippets[Math.floor(Math.random() * codeSnippets.length)],
      speed: 0.5 + Math.random() * 0.9,
      fontSize: 12 + Math.floor(Math.random() * 6),
      opacity: 0.2 + Math.random() * 0.5,
      color: Math.random() > 0.4 ? '#56CBB9' : '#019add'
    });
  }

  // Neural Connection Nodes
  const nodes = [];
  const nodeCount = 40;
  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      radius: 2 + Math.random() * 3
    });
  }

  // Grid Lines Angle
  let gridOffset = 0;

  function render() {
    ctx.clearRect(0, 0, width, height);

    // Deep Luxe Tech Background
    ctx.fillStyle = '#021630';
    ctx.fillRect(0, 0, width, height);

    // Render Perspective Grid
    ctx.strokeStyle = 'rgba(1, 154, 221, 0.08)';
    ctx.lineWidth = 1;
    gridOffset = (gridOffset + 0.3) % 40;

    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = gridOffset; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw Neural Nodes & Synapses
    for (let i = 0; i < nodeCount; i++) {
      let n1 = nodes[i];
      n1.x += n1.vx;
      n1.y += n1.vy;

      if (n1.x < 0 || n1.x > width) n1.vx *= -1;
      if (n1.y < 0 || n1.y > height) n1.vy *= -1;

      ctx.beginPath();
      ctx.arc(n1.x, n1.y, n1.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(86, 203, 185, 0.7)';
      ctx.fill();

      for (let j = i + 1; j < nodeCount; j++) {
        let n2 = nodes[j];
        let dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
        if (dist < 170) {
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.strokeStyle = `rgba(1, 154, 221, ${0.35 * (1 - dist / 170)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    // Draw Falling AI Code Matrix Streams
    particles.forEach(p => {
      ctx.font = `${p.fontSize}px 'Consolas', 'Courier New', monospace`;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fillText(p.text, p.x, p.y);

      p.y += p.speed;
      if (p.y > height + 20) {
        p.y = -20;
        p.x = Math.random() * width;
        p.text = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
      }
    });

    ctx.globalAlpha = 1.0;
    requestAnimationFrame(render);
  }

  render();
});
