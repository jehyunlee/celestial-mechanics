// ═══════════════════════════════════════════════════════════
// Celestial Mechanics Interactive Simulations
// ═══════════════════════════════════════════════════════════

// ── Utility ──
const TAU = 2 * Math.PI;
const DEG = Math.PI / 180;
function lerp(a, b, t) { return a + (b - a) * t; }

// ═══════════════════════════════════════════════════════════
// 1. Gravitational Force Simulation
// ═══════════════════════════════════════════════════════════
(function() {
  const canvas = document.getElementById('gravityCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const distSlider = document.getElementById('gravityDist');
  const massSlider = document.getElementById('gravityMass');
  const info = document.getElementById('gravityInfo');

  const G = 6.674e-11;
  const M_sun = 1.989e30, M_earth = 5.972e24, M_moon = 7.342e22;

  function draw() {
    const distFactor = parseFloat(distSlider.value);
    const massFactor = parseFloat(massSlider.value);
    ctx.clearRect(0, 0, W, H);

    // Background stars
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.5})`;
      ctx.beginPath();
      ctx.arc((i * 137.5) % W, (i * 97.3) % H, 0.5 + Math.random(), 0, TAU);
      ctx.fill();
    }

    const cx = W / 2, cy = H / 2;
    const sunX = cx - 140, earthX = cx + 60 * distFactor, moonX = earthX + 60;

    // Sun
    const sunR = 30;
    const grad = ctx.createRadialGradient(sunX, cy, 5, sunX, cy, sunR + 10);
    grad.addColorStop(0, '#fff7a0');
    grad.addColorStop(0.5, '#ffcc00');
    grad.addColorStop(1, 'rgba(255,150,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(sunX, cy, sunR + 10, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffdd44';
    ctx.beginPath(); ctx.arc(sunX, cy, sunR, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '11px Noto Sans KR';
    ctx.textAlign = 'center';
    ctx.fillText('태양', sunX, cy + sunR + 16);

    // Earth
    const earthR = 14 * massFactor;
    ctx.fillStyle = '#4488cc';
    ctx.beginPath(); ctx.arc(earthX, cy, earthR, 0, TAU); ctx.fill();
    ctx.fillStyle = '#66bb88';
    ctx.beginPath(); ctx.arc(earthX, cy - 2, earthR * 0.6, 0.2, 2.2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('지구', earthX, cy + earthR + 16);

    // Moon
    const moonR = 6;
    ctx.fillStyle = '#bbb';
    ctx.beginPath(); ctx.arc(moonX, cy, moonR, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('달', moonX, cy + moonR + 16);

    // Force vectors
    const r_se = 1.496e11 * distFactor;
    const r_em = 3.844e8;
    const F_se = G * M_sun * (M_earth * massFactor) / (r_se * r_se);
    const F_em = G * (M_earth * massFactor) * M_moon / (r_em * r_em);

    // Sun→Earth force arrow
    const arrowLen_se = Math.min(80, F_se / 1e18);
    drawArrow(ctx, earthX - earthR - 4, cy, earthX - earthR - 4 - arrowLen_se, cy, '#ff6644', 3);
    ctx.fillStyle = '#ff8866'; ctx.font = '10px monospace';
    ctx.fillText(`F = ${F_se.toExponential(2)} N`, (sunX + earthX) / 2, cy - 30);

    // Earth→Moon force arrow
    const arrowLen_em = Math.min(40, F_em / 1e16);
    drawArrow(ctx, moonX - moonR - 2, cy, moonX - moonR - 2 - arrowLen_em, cy, '#44ccff', 2);
    ctx.fillStyle = '#66ddff'; ctx.font = '10px monospace';
    ctx.fillText(`F = ${F_em.toExponential(2)} N`, (earthX + moonX) / 2, cy + 36);

    if (info) {
      info.textContent = `태양-지구 거리: ${(distFactor).toFixed(1)} AU | 지구 질량: ${massFactor.toFixed(1)}x | 태양-지구 인력: ${F_se.toExponential(2)} N | 지구-달 인력: ${F_em.toExponential(2)} N`;
    }
  }

  function drawArrow(ctx, x1, y1, x2, y2, color, w) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const len = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
    if (len < 5) return;
    ctx.strokeStyle = color; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 8 * Math.cos(angle - 0.4), y2 - 8 * Math.sin(angle - 0.4));
    ctx.lineTo(x2 - 8 * Math.cos(angle + 0.4), y2 - 8 * Math.sin(angle + 0.4));
    ctx.fill();
  }

  distSlider.addEventListener('input', draw);
  massSlider.addEventListener('input', draw);
  draw();
})();

// ═══════════════════════════════════════════════════════════
// 2. Orbital Motion Simulation (Sun-Earth-Moon)
// ═══════════════════════════════════════════════════════════
(function() {
  const canvas = document.getElementById('orbitalCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;

  const playBtn = document.getElementById('orbitalPlayPause');
  const speedSlider = document.getElementById('orbitalSpeed');
  const info = document.getElementById('orbitalInfo');

  let running = true, time = 0;
  const earthOrbitR = 180, moonOrbitR = 32;
  const earthPeriod = 365.25, moonPeriod = 27.32;
  let trail = [];

  playBtn.addEventListener('click', () => {
    running = !running;
    playBtn.textContent = running ? '⏸ 일시정지' : '▶ 재생';
    if (running) animate();
  });

  function animate() {
    if (!running) return;
    const speed = parseFloat(speedSlider.value);
    time += speed;

    ctx.fillStyle = 'rgba(10,14,39,0.15)';
    ctx.fillRect(0, 0, W, H);

    // Stars (only on first frame or when cleared)
    if (time < speed * 2) {
      ctx.fillStyle = '#0a0e27'; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 80; i++) {
        ctx.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.4})`;
        ctx.beginPath();
        ctx.arc((i * 137.5 + 33) % W, (i * 97.3 + 17) % H, 0.5 + Math.random() * 0.5, 0, TAU);
        ctx.fill();
      }
    }

    // Orbit paths
    ctx.strokeStyle = 'rgba(100,150,255,0.15)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, earthOrbitR, 0, TAU); ctx.stroke();

    // Earth position (elliptical approximation e=0.0167)
    const earthAngle = TAU * time / earthPeriod;
    const e = 0.0167;
    const earthR = earthOrbitR * (1 - e * e) / (1 + e * Math.cos(earthAngle));
    const earthX = cx + earthR * Math.cos(earthAngle);
    const earthY = cy + earthR * Math.sin(earthAngle);

    // Moon orbit path
    ctx.strokeStyle = 'rgba(200,200,200,0.12)'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.arc(earthX, earthY, moonOrbitR, 0, TAU); ctx.stroke();

    // Moon position
    const moonAngle = TAU * time / moonPeriod;
    const moonX = earthX + moonOrbitR * Math.cos(moonAngle);
    const moonY = earthY + moonOrbitR * Math.sin(moonAngle);

    // Earth trail
    trail.push({ x: earthX, y: earthY });
    if (trail.length > 600) trail.shift();
    if (trail.length > 2) {
      ctx.strokeStyle = 'rgba(68,136,204,0.3)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(trail[0].x, trail[0].y);
      for (let i = 1; i < trail.length; i++) {
        if (Math.abs(trail[i].x - trail[i-1].x) < 50) ctx.lineTo(trail[i].x, trail[i].y);
        else ctx.moveTo(trail[i].x, trail[i].y);
      }
      ctx.stroke();
    }

    // Sun
    const sunGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 28);
    sunGrad.addColorStop(0, '#fff7a0');
    sunGrad.addColorStop(0.6, '#ffcc00');
    sunGrad.addColorStop(1, 'rgba(255,150,0,0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath(); ctx.arc(cx, cy, 28, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffdd44';
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, TAU); ctx.fill();

    // Earth
    ctx.fillStyle = '#4488cc';
    ctx.beginPath(); ctx.arc(earthX, earthY, 8, 0, TAU); ctx.fill();
    ctx.fillStyle = '#66bb88';
    ctx.beginPath(); ctx.arc(earthX, earthY - 1, 5, 0.3, 2.5); ctx.fill();

    // Axial tilt indicator
    const tiltAngle = 23.44 * DEG;
    ctx.strokeStyle = '#88ccff'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(earthX, earthY - 12);
    ctx.lineTo(earthX + 4 * Math.sin(tiltAngle), earthY - 12 - 4 * Math.cos(tiltAngle));
    ctx.stroke();

    // Moon
    ctx.fillStyle = '#ccc';
    ctx.beginPath(); ctx.arc(moonX, moonY, 4, 0, TAU); ctx.fill();

    // Labels
    ctx.fillStyle = '#fff'; ctx.font = '11px Noto Sans KR'; ctx.textAlign = 'center';
    ctx.fillText('태양', cx, cy + 30);
    ctx.fillText('지구', earthX, earthY + 16);
    ctx.fillStyle = '#aaa'; ctx.font = '9px Noto Sans KR';
    ctx.fillText('달', moonX, moonY + 10);

    // Date display
    const dayOfYear = Math.floor(time % earthPeriod);
    const months = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
    const monthDays = [31,28,31,30,31,30,31,31,30,31,30,31];
    let d = dayOfYear, m = 0;
    while (m < 11 && d >= monthDays[m]) { d -= monthDays[m]; m++; }
    ctx.fillStyle = '#7ec8e3'; ctx.font = '12px monospace'; ctx.textAlign = 'left';
    ctx.fillText(`${months[m]} ${d+1}일 (${dayOfYear}일차)`, 10, 20);

    if (info) info.textContent = `경과: ${dayOfYear}일 | 지구 공전각: ${(earthAngle * 180 / Math.PI % 360).toFixed(1)}° | 달 위상각: ${(moonAngle * 180 / Math.PI % 360).toFixed(1)}°`;

    requestAnimationFrame(animate);
  }

  // Initial stars
  ctx.fillStyle = '#0a0e27'; ctx.fillRect(0, 0, W, H);
  animate();
})();

// ═══════════════════════════════════════════════════════════
// 3. Solar Irradiance Simulation (Seoul / Jakarta / London)
// ═══════════════════════════════════════════════════════════
(function() {
  const canvas = document.getElementById('irradianceCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const daySlider = document.getElementById('daySlider');
  const info = document.getElementById('irradianceInfo');

  const S0 = 1361; // solar constant W/m²
  const tilt = 23.44 * DEG;

  // City data: latitude, color, monthly weather clearness factor (Jan-Dec)
  // Based on typical monthly sunshine hours / possible sunshine hours
  const cities = [
    { name: '서울',    nameEn: 'Seoul',   lat: 37.5, color: '#ffaa44', colorDim: 'rgba(255,170,68,0.35)',
      weather: [0.52, 0.53, 0.50, 0.48, 0.49, 0.36, 0.28, 0.32, 0.44, 0.53, 0.50, 0.52],
      note: '장마·태풍(6-9월)' },
    { name: '자카르타', nameEn: 'Jakarta', lat: -6.2, color: '#ff5566', colorDim: 'rgba(255,85,102,0.35)',
      weather: [0.38, 0.38, 0.42, 0.48, 0.52, 0.55, 0.58, 0.60, 0.56, 0.48, 0.40, 0.36],
      note: '우기(11-3월)' },
    { name: '런던',    nameEn: 'London',  lat: 51.5, color: '#44aaff', colorDim: 'rgba(68,170,255,0.35)',
      weather: [0.22, 0.28, 0.33, 0.38, 0.40, 0.42, 0.42, 0.40, 0.36, 0.28, 0.22, 0.18],
      note: '연중 흐림' },
  ];

  function solarDeclination(day) {
    return tilt * Math.sin(TAU / 365 * (day - 81));
  }

  function maxElevation(day, latDeg) {
    const latR = latDeg * DEG;
    const dec = solarDeclination(day);
    return Math.asin(Math.sin(latR) * Math.sin(dec) + Math.cos(latR) * Math.cos(dec));
  }

  function dayLength(day, latDeg) {
    const latR = latDeg * DEG;
    const dec = solarDeclination(day);
    const cosHA = -Math.tan(latR) * Math.tan(dec);
    if (cosHA < -1) return 24;
    if (cosHA > 1) return 0;
    return 2 * Math.acos(cosHA) / TAU * 24;
  }

  function clearSkyIrradiance(day, latDeg) {
    const elev = maxElevation(day, latDeg);
    if (elev <= 0) return 0;
    const AM = 1 / Math.sin(elev);
    const transmission = Math.pow(0.7, Math.pow(AM, 0.678));
    return S0 * Math.sin(elev) * transmission;
  }

  function weatherFactor(day, weatherArr) {
    // Interpolate monthly weather factor to daily
    const monthDays = [31,28,31,30,31,30,31,31,30,31,30,31];
    let d = day, m = 0;
    while (m < 11 && d >= monthDays[m]) { d -= monthDays[m]; m++; }
    const frac = d / monthDays[m];
    const next = (m + 1) % 12;
    return weatherArr[m] * (1 - frac) + weatherArr[next] * frac;
  }

  function actualIrradiance(day, city) {
    return clearSkyIrradiance(day, city.lat) * weatherFactor(day, city.weather);
  }

  function draw() {
    const currentDay = parseInt(daySlider.value);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0f1525'; ctx.fillRect(0, 0, W, H);

    // ── Left: Earth orbit diagram ──
    const lW = W * 0.32, lCx = lW / 2, lCy = H / 2;
    const orbitR = Math.min(lW, H) * 0.32;

    // Sun
    const sunGrad = ctx.createRadialGradient(lCx, lCy, 3, lCx, lCy, 16);
    sunGrad.addColorStop(0, '#fff7a0');
    sunGrad.addColorStop(0.7, '#ffcc00');
    sunGrad.addColorStop(1, 'rgba(255,150,0,0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath(); ctx.arc(lCx, lCy, 16, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffdd44';
    ctx.beginPath(); ctx.arc(lCx, lCy, 9, 0, TAU); ctx.fill();

    // Orbit
    ctx.strokeStyle = 'rgba(100,150,255,0.2)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(lCx, lCy, orbitR, 0, TAU); ctx.stroke();

    // Season labels
    ctx.fillStyle = '#556'; ctx.font = '9px Noto Sans KR'; ctx.textAlign = 'center';
    ctx.fillText('하지', lCx, lCy - orbitR - 6);
    ctx.fillText('동지', lCx, lCy + orbitR + 12);
    ctx.fillText('춘분', lCx + orbitR + 6, lCy);
    ctx.fillText('추분', lCx - orbitR - 6, lCy);

    // Earth position
    const angle = TAU * (currentDay - 80) / 365;
    const ex = lCx + orbitR * Math.cos(angle);
    const ey = lCy - orbitR * Math.sin(angle);
    ctx.fillStyle = '#4488cc';
    ctx.beginPath(); ctx.arc(ex, ey, 6, 0, TAU); ctx.fill();

    // Axial tilt
    ctx.strokeStyle = '#88ccff'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ex - 4 * Math.sin(tilt), ey - 4 * Math.cos(tilt));
    ctx.lineTo(ex + 10 * Math.sin(tilt), ey + 10 * Math.cos(tilt));
    ctx.stroke();

    // ── Right: Irradiance chart (3 cities) ──
    const rX = W * 0.36, rW = W * 0.61, rY = 14, rH = H - 40;
    const chartL = rX + 38, chartR = rX + rW - 6;
    const chartT = rY + 6, chartB = rY + rH - 24;
    const chartW = chartR - chartL, chartH = chartB - chartT;

    // Axes
    ctx.strokeStyle = '#556'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartL, chartT); ctx.lineTo(chartL, chartB); ctx.lineTo(chartR, chartB);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = '#889'; ctx.font = '8px monospace'; ctx.textAlign = 'right';
    for (let v = 0; v <= 1000; v += 200) {
      const y = chartB - (v / 1000) * chartH;
      ctx.fillText(v + '', chartL - 3, y + 3);
      ctx.strokeStyle = 'rgba(100,100,120,0.15)';
      ctx.beginPath(); ctx.moveTo(chartL, y); ctx.lineTo(chartR, y); ctx.stroke();
    }
    ctx.fillStyle = '#889'; ctx.font = '9px Noto Sans KR';
    ctx.save(); ctx.translate(rX + 6, (chartT + chartB) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center'; ctx.fillText('일사량 (W/m²)', 0, 0);
    ctx.restore();

    // X-axis labels
    const monthLabels = ['1','2','3','4','5','6','7','8','9','10','11','12'];
    ctx.fillStyle = '#889'; ctx.font = '8px Noto Sans KR'; ctx.textAlign = 'center';
    for (let m = 0; m < 12; m++) {
      const x = chartL + (m + 0.5) / 12 * chartW;
      ctx.fillText(monthLabels[m] + '월', x, chartB + 12);
    }

    // Monsoon/typhoon season band for Seoul (Jun-Sep)
    const junStart = chartL + (151 / 365) * chartW;
    const sepEnd = chartL + (273 / 365) * chartW;
    ctx.fillStyle = 'rgba(100,100,255,0.06)';
    ctx.fillRect(junStart, chartT, sepEnd - junStart, chartH);
    ctx.fillStyle = 'rgba(100,150,255,0.3)'; ctx.font = '8px Noto Sans KR';
    ctx.textAlign = 'center';
    ctx.fillText('장마·태풍', (junStart + sepEnd) / 2, chartT + 10);

    // Draw curves for each city
    cities.forEach((city, ci) => {
      // Clear-sky (dashed, dimmer)
      ctx.strokeStyle = city.colorDim; ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      for (let d = 0; d < 365; d++) {
        const x = chartL + d / 365 * chartW;
        const y = chartB - clearSkyIrradiance(d, city.lat) / 1000 * chartH;
        d === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Actual (solid, bright)
      ctx.strokeStyle = city.color; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let d = 0; d < 365; d++) {
        const x = chartL + d / 365 * chartW;
        const y = chartB - actualIrradiance(d, city) / 1000 * chartH;
        d === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    // Current day marker
    const cdX = chartL + currentDay / 365 * chartW;
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath(); ctx.moveTo(cdX, chartT); ctx.lineTo(cdX, chartB); ctx.stroke();
    ctx.setLineDash([]);

    // Current day dots for each city
    cities.forEach(city => {
      const irr = actualIrradiance(currentDay, city);
      const y = chartB - irr / 1000 * chartH;
      ctx.fillStyle = city.color;
      ctx.beginPath(); ctx.arc(cdX, y, 3.5, 0, TAU); ctx.fill();
    });

    // Legend (top-right of chart)
    const legX = chartR - 125, legY = chartT + 4;
    ctx.font = '9px Noto Sans KR'; ctx.textAlign = 'left';
    cities.forEach((city, i) => {
      const y = legY + i * 14;
      // Solid line
      ctx.strokeStyle = city.color; ctx.lineWidth = 2; ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(legX, y + 4); ctx.lineTo(legX + 14, y + 4); ctx.stroke();
      // Dashed line
      ctx.strokeStyle = city.colorDim; ctx.lineWidth = 1; ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.moveTo(legX + 16, y + 4); ctx.lineTo(legX + 28, y + 4); ctx.stroke();
      ctx.setLineDash([]);
      // Label
      ctx.fillStyle = city.color;
      ctx.fillText(`${city.name} (${city.lat > 0 ? city.lat+'°N' : Math.abs(city.lat)+'°S'})`, legX + 32, y + 7);
    });
    ctx.fillStyle = '#667'; ctx.font = '8px Noto Sans KR';
    ctx.fillText('실선=실질 / 점선=이론', legX, legY + 48);

    // Info
    const months2 = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
    const monthDays2 = [31,28,31,30,31,30,31,31,30,31,30,31];
    let dd = currentDay, mm = 0;
    while (mm < 11 && dd >= monthDays2[mm]) { dd -= monthDays2[mm]; mm++; }

    const seoulClear = clearSkyIrradiance(currentDay, 37.5);
    const seoulActual = actualIrradiance(currentDay, cities[0]);
    const jakartaActual = actualIrradiance(currentDay, cities[1]);
    const londonActual = actualIrradiance(currentDay, cities[2]);

    if (info) info.textContent = `${months2[mm]} ${dd+1}일 | 서울: ${seoulActual.toFixed(0)} W/m² (이론 ${seoulClear.toFixed(0)}) | 자카르타: ${jakartaActual.toFixed(0)} | 런던: ${londonActual.toFixed(0)}`;
  }

  daySlider.addEventListener('input', draw);
  draw();
})();

// ═══════════════════════════════════════════════════════════
// 4. Lunar Phase Simulation
// ═══════════════════════════════════════════════════════════
(function() {
  const canvas = document.getElementById('lunarCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const daySlider = document.getElementById('lunarDay');
  const info = document.getElementById('lunarInfo');

  const synodicPeriod = 29.53;
  const phaseNames = ['삭 (신월)', '초승달', '상현달', '상현망간', '망 (보름달)', '하현망간', '하현달', '그믐달'];

  function draw() {
    const day = parseFloat(daySlider.value);
    const phase = (day % synodicPeriod) / synodicPeriod; // 0-1
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0e27'; ctx.fillRect(0, 0, W, H);

    // ── Top view: Sun→Earth→Moon ──
    const topCx = W * 0.35, topCy = H * 0.45;
    const moonOrbit = 100;

    // Sun direction (far left)
    ctx.fillStyle = '#ffcc00'; ctx.font = '11px Noto Sans KR'; ctx.textAlign = 'center';
    const sunArrowX = topCx - 160;
    ctx.fillText('☀ 태양광', sunArrowX, topCy - 10);
    ctx.strokeStyle = '#ffcc44'; ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = topCy - 40 + i * 20;
      ctx.beginPath(); ctx.moveTo(sunArrowX + 30, y); ctx.lineTo(topCx - moonOrbit - 20, y); ctx.stroke();
      // arrowhead
      ctx.beginPath();
      ctx.moveTo(topCx - moonOrbit - 20, y);
      ctx.lineTo(topCx - moonOrbit - 14, y - 3);
      ctx.lineTo(topCx - moonOrbit - 14, y + 3);
      ctx.fill();
    }

    // Earth
    ctx.fillStyle = '#4488cc';
    ctx.beginPath(); ctx.arc(topCx, topCy, 10, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '10px Noto Sans KR';
    ctx.fillText('지구', topCx, topCy + 22);

    // Moon orbit
    ctx.strokeStyle = 'rgba(200,200,200,0.15)'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.arc(topCx, topCy, moonOrbit, 0, TAU); ctx.stroke();

    // Moon position (phase 0 = new moon = between Earth and Sun)
    const moonAngle = TAU * phase; // 0=new moon (left), 0.5=full moon (right)
    const moonX = topCx - moonOrbit * Math.cos(moonAngle);
    const moonY = topCy - moonOrbit * Math.sin(moonAngle);

    ctx.fillStyle = '#ccc';
    ctx.beginPath(); ctx.arc(moonX, moonY, 8, 0, TAU); ctx.fill();
    ctx.fillStyle = '#aaa'; ctx.font = '9px Noto Sans KR';
    ctx.fillText('달', moonX, moonY + 16);

    // Sunlit side indicator on moon
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath(); ctx.arc(moonX, moonY, 8, -Math.PI/2, Math.PI/2); ctx.fill();

    // Phase position markers
    ctx.fillStyle = '#445'; ctx.font = '9px Noto Sans KR';
    ctx.fillText('삭', topCx - moonOrbit, topCy - 12);
    ctx.fillText('상현', topCx, topCy - moonOrbit - 8);
    ctx.fillText('망', topCx + moonOrbit, topCy - 12);
    ctx.fillText('하현', topCx, topCy + moonOrbit + 14);

    // ── Right: Moon appearance from Earth ──
    const moonViewX = W * 0.78, moonViewY = H * 0.45, moonViewR = 55;

    // Moon disk
    ctx.fillStyle = '#e8e4d8';
    ctx.beginPath(); ctx.arc(moonViewX, moonViewY, moonViewR, 0, TAU); ctx.fill();

    // Surface texture
    ctx.fillStyle = '#ccc8b8';
    ctx.beginPath(); ctx.arc(moonViewX - 15, moonViewY - 10, 12, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(moonViewX + 10, moonViewY + 15, 8, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(moonViewX + 20, moonViewY - 20, 6, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(moonViewX - 5, moonViewY + 25, 10, 0, TAU); ctx.fill();

    // Shadow overlay using clipping + ellipse terminator
    ctx.save();
    ctx.beginPath(); ctx.arc(moonViewX, moonViewY, moonViewR, 0, TAU); ctx.clip();

    // The terminator (shadow boundary) is an ellipse when projected onto the disk.
    // cos(phase * TAU) determines the terminator's x-extent:
    //   phase=0 (new): cos=1 → terminator at right edge → all dark
    //   phase=0.25 (FQ): cos=0 → terminator at center → left half dark
    //   phase=0.5 (full): cos=-1 → terminator at left edge → no dark
    const c = Math.cos(phase * TAU);
    const rx = Math.max(Math.abs(c) * moonViewR, 0.1); // ellipse x-radius

    ctx.fillStyle = '#0a0e27';
    ctx.beginPath();

    if (phase < 0.5) {
      // WAXING: dark on LEFT side, lit on right
      // Left limb (semicircle): top → LEFT → bottom
      ctx.arc(moonViewX, moonViewY, moonViewR, -Math.PI/2, Math.PI/2, true);
      // Terminator (half-ellipse): bottom → top
      //   c > 0 (crescent): curves right → large shadow → anticlockwise=true (through right)
      //   c < 0 (gibbous): curves left → small shadow → anticlockwise=false (through left)
      ctx.ellipse(moonViewX, moonViewY, rx, moonViewR, 0, Math.PI/2, -Math.PI/2, c > 0);
    } else {
      // WANING: dark on RIGHT side, lit on left
      // Right limb (semicircle): top → RIGHT → bottom
      ctx.arc(moonViewX, moonViewY, moonViewR, -Math.PI/2, Math.PI/2, false);
      // Terminator (half-ellipse): bottom → top
      //   c < 0 (gibbous): curves right → overlap with limb → small shadow → anticlockwise=true
      //   c > 0 (crescent): curves left → large shadow → anticlockwise=false
      ctx.ellipse(moonViewX, moonViewY, rx, moonViewR, 0, Math.PI/2, -Math.PI/2, c < 0);
    }
    ctx.fill();
    ctx.restore();

    // Moon label
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Noto Sans KR'; ctx.textAlign = 'center';
    const phaseIdx = Math.floor(phase * 8) % 8;
    ctx.fillText(phaseNames[phaseIdx], moonViewX, moonViewY + moonViewR + 24);

    // Illumination percentage
    const illumPct = phase <= 0.5 ? phase * 2 * 100 : (1 - (phase - 0.5) * 2) * 100;
    ctx.fillStyle = '#aab'; ctx.font = '11px monospace';
    ctx.fillText(`${illumPct.toFixed(0)}% 조명`, moonViewX, moonViewY + moonViewR + 42);

    // Moonrise/set info
    const riseHour = Math.floor((phase * 24 + 6) % 24);
    const setHour = Math.floor((phase * 24 + 18) % 24);

    if (info) info.textContent = `${day.toFixed(1)}일차 | 위상: ${phaseNames[phaseIdx]} | 조명: ${illumPct.toFixed(0)}% | 월출: ~${riseHour}시 | 월몰: ~${setHour}시`;
  }

  daySlider.addEventListener('input', draw);
  draw();
})();

// ═══════════════════════════════════════════════════════════
// 5. Eclipse Simulation
// ═══════════════════════════════════════════════════════════
(function() {
  const canvas = document.getElementById('eclipseCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const typeSelect = document.getElementById('eclipseType');
  const inclSlider = document.getElementById('eclipseIncl');
  const info = document.getElementById('eclipseInfo');

  function draw() {
    const type = typeSelect.value;
    const inclination = parseFloat(inclSlider.value);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0e27'; ctx.fillRect(0, 0, W, H);

    const cy = H / 2;
    const moonOffset = inclination * 2; // pixels offset from ecliptic

    if (type === 'solar') {
      // Solar Eclipse: Sun -- Moon -- Earth (side view)
      const sunX = 80, moonX = W * 0.52, earthX = W - 100;
      const sunR = 40, moonR = 12, earthR = 18;

      // Sun
      const sg = ctx.createRadialGradient(sunX, cy, 5, sunX, cy, sunR + 8);
      sg.addColorStop(0, '#fff7a0'); sg.addColorStop(0.7, '#ffcc00');
      sg.addColorStop(1, 'rgba(255,150,0,0)');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(sunX, cy, sunR + 8, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffdd44';
      ctx.beginPath(); ctx.arc(sunX, cy, sunR, 0, TAU); ctx.fill();

      // Light rays (cone)
      ctx.strokeStyle = 'rgba(255,200,50,0.08)'; ctx.lineWidth = 1;
      for (let i = -8; i <= 8; i++) {
        ctx.beginPath();
        ctx.moveTo(sunX + sunR, cy + i * 4);
        ctx.lineTo(earthX, cy + i * 20);
        ctx.stroke();
      }

      // Shadow cone (umbra)
      if (Math.abs(moonOffset) < 20) {
        ctx.fillStyle = 'rgba(0,0,30,0.3)';
        ctx.beginPath();
        ctx.moveTo(moonX, cy + moonOffset - moonR);
        ctx.lineTo(earthX + 30, cy + moonOffset - moonR * 2.5);
        ctx.lineTo(earthX + 30, cy + moonOffset + moonR * 2.5);
        ctx.lineTo(moonX, cy + moonOffset + moonR);
        ctx.fill();

        // Umbra (darker center)
        ctx.fillStyle = 'rgba(0,0,20,0.5)';
        ctx.beginPath();
        ctx.moveTo(moonX, cy + moonOffset - moonR * 0.5);
        ctx.lineTo(earthX + 10, cy + moonOffset - moonR * 0.8);
        ctx.lineTo(earthX + 10, cy + moonOffset + moonR * 0.8);
        ctx.lineTo(moonX, cy + moonOffset + moonR * 0.5);
        ctx.fill();
      }

      // Moon
      ctx.fillStyle = '#888';
      ctx.beginPath(); ctx.arc(moonX, cy + moonOffset, moonR, 0, TAU); ctx.fill();

      // Earth
      ctx.fillStyle = '#4488cc';
      ctx.beginPath(); ctx.arc(earthX, cy, earthR, 0, TAU); ctx.fill();
      ctx.fillStyle = '#66bb88';
      ctx.beginPath(); ctx.arc(earthX, cy - 2, 11, 0.2, 2.2); ctx.fill();

      // Ecliptic line
      ctx.strokeStyle = 'rgba(255,100,100,0.3)'; ctx.lineWidth = 0.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
      ctx.setLineDash([]);

      // Labels
      ctx.fillStyle = '#fff'; ctx.font = '12px Noto Sans KR'; ctx.textAlign = 'center';
      ctx.fillText('태양', sunX, cy + sunR + 18);
      ctx.fillText('달', moonX, cy + moonOffset + moonR + 18);
      ctx.fillText('지구', earthX, cy + earthR + 18);
      ctx.fillStyle = '#ff6666'; ctx.font = '10px Noto Sans KR';
      ctx.fillText('황도면', W - 40, cy - 6);

      const eclipseOccurs = Math.abs(moonOffset) < earthR;
      if (info) info.textContent = `일식 (Solar Eclipse) | 달 궤도 경사: ${inclination.toFixed(1)}° | ${eclipseOccurs ? '✓ 일식 발생!' : '✗ 일식 불발 (달이 황도면에서 벗어남)'}`;

    } else {
      // Lunar Eclipse: Sun -- Earth -- Moon (side view)
      const sunX = 80, earthX = W * 0.48, moonX = W - 100;
      const sunR = 40, earthR = 18, moonR = 10;

      // Sun
      const sg = ctx.createRadialGradient(sunX, cy, 5, sunX, cy, sunR + 8);
      sg.addColorStop(0, '#fff7a0'); sg.addColorStop(0.7, '#ffcc00');
      sg.addColorStop(1, 'rgba(255,150,0,0)');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(sunX, cy, sunR + 8, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffdd44';
      ctx.beginPath(); ctx.arc(sunX, cy, sunR, 0, TAU); ctx.fill();

      // Earth's shadow cone
      ctx.fillStyle = 'rgba(0,0,30,0.25)';
      ctx.beginPath();
      ctx.moveTo(earthX, cy - earthR);
      ctx.lineTo(W, cy - earthR * 3);
      ctx.lineTo(W, cy + earthR * 3);
      ctx.lineTo(earthX, cy + earthR);
      ctx.fill();

      // Umbra
      ctx.fillStyle = 'rgba(0,0,20,0.4)';
      ctx.beginPath();
      ctx.moveTo(earthX, cy - earthR * 0.6);
      ctx.lineTo(W - 30, cy - earthR * 1.5);
      ctx.lineTo(W - 30, cy + earthR * 1.5);
      ctx.lineTo(earthX, cy + earthR * 0.6);
      ctx.fill();

      // Earth
      ctx.fillStyle = '#4488cc';
      ctx.beginPath(); ctx.arc(earthX, cy, earthR, 0, TAU); ctx.fill();
      ctx.fillStyle = '#66bb88';
      ctx.beginPath(); ctx.arc(earthX, cy - 2, 11, 0.2, 2.2); ctx.fill();

      // Moon
      const moonY = cy + moonOffset;
      ctx.fillStyle = '#ccc';
      ctx.beginPath(); ctx.arc(moonX, moonY, moonR, 0, TAU); ctx.fill();

      // If in shadow, darken moon
      if (Math.abs(moonOffset) < earthR * 1.5) {
        const shadowFactor = 1 - Math.abs(moonOffset) / (earthR * 1.5);
        ctx.fillStyle = `rgba(180,60,30,${shadowFactor * 0.7})`;
        ctx.beginPath(); ctx.arc(moonX, moonY, moonR, 0, TAU); ctx.fill();
      }

      // Ecliptic line
      ctx.strokeStyle = 'rgba(255,100,100,0.3)'; ctx.lineWidth = 0.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
      ctx.setLineDash([]);

      // Labels
      ctx.fillStyle = '#fff'; ctx.font = '12px Noto Sans KR'; ctx.textAlign = 'center';
      ctx.fillText('태양', sunX, cy + sunR + 18);
      ctx.fillText('지구', earthX, cy + earthR + 18);
      ctx.fillText('달', moonX, moonY + moonR + 18);

      const eclipseOccurs = Math.abs(moonOffset) < earthR * 1.5;
      if (info) info.textContent = `월식 (Lunar Eclipse) | 달 궤도 경사: ${inclination.toFixed(1)}° | ${eclipseOccurs ? '✓ 월식 발생! (달이 붉게 물듦)' : '✗ 월식 불발'}`;
    }
  }

  typeSelect.addEventListener('change', draw);
  inclSlider.addEventListener('input', draw);
  draw();
})();

// ═══════════════════════════════════════════════════════════
// 5b. Eclipse Observer Simulation (Seoul, 37.5°N)
// ═══════════════════════════════════════════════════════════
(function() {
  const canvas = document.getElementById('eclipseObsCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const eventSelect = document.getElementById('eclipseEvent');
  const timeSlider = document.getElementById('eclipseTime');
  const info = document.getElementById('eclipseObsInfo');

  // Real eclipse data visible from Seoul area (UTC+9)
  // {name, type, date, startH, maxH, endH, maxMag, sunAlt, desc}
  const eclipseEvents = [
    { id: 'solar_20350902', name: '2035-09-02 개기일식', type: 'solar', kind: 'total',
      date: '2035년 9월 2일', startH: 8.8, maxH: 9.95, endH: 11.2, maxMag: 1.02,
      sunAltStart: 35, sunAltMax: 47, sunAltEnd: 57,
      desc: '한반도에서 관측 가능한 개기일식. 개기식 지속시간 약 2분 10초. 북한 평양~원산 부근이 개기식 중심대.' },
    { id: 'solar_20300601', name: '2030-06-01 금환일식', type: 'solar', kind: 'annular',
      date: '2030년 6월 1일', startH: 15.5, maxH: 16.8, endH: 17.9, maxMag: 0.89,
      sunAltStart: 52, sunAltMax: 38, sunAltEnd: 22,
      desc: '서울에서 부분일식(식분 ~0.89)으로 관측. 금환일식 중심대는 일본 남부.' },
    { id: 'solar_20280722', name: '2028-07-22 부분일식', type: 'solar', kind: 'partial',
      date: '2028년 7월 22일', startH: 17.0, maxH: 17.8, endH: 18.5, maxMag: 0.36,
      sunAltStart: 30, sunAltMax: 20, sunAltEnd: 10,
      desc: '서울에서 부분일식(식분 ~0.36). 해질녘에 태양 우측 상단이 가려짐.' },
    { id: 'lunar_20250914', name: '2025-09-07 개기월식', type: 'lunar', kind: 'total',
      date: '2025년 9월 7일', startH: 23.3, maxH: 1.5, endH: 3.7, maxMag: 1.36,
      moonAltStart: 35, moonAltMax: 28, moonAltEnd: 15,
      desc: '한국에서 전 과정 관측 가능한 개기월식. 달이 붉게 물드는 "블러드 문".' },
    { id: 'lunar_20261231', name: '2028-12-31 개기월식', type: 'lunar', kind: 'total',
      date: '2028년 12월 31일', startH: 22.1, maxH: 0.5, endH: 2.9, maxMag: 1.22,
      moonAltStart: 60, moonAltMax: 65, moonAltEnd: 55,
      desc: '연말 밤하늘의 개기월식. 달이 높이 떠있어 최적의 관측 조건.' },
  ];

  function getEvent() {
    const idx = parseInt(eventSelect.value);
    return eclipseEvents[idx] || eclipseEvents[0];
  }

  // Populate select
  eclipseEvents.forEach((ev, i) => {
    const opt = document.createElement('option');
    opt.value = i; opt.textContent = ev.name;
    eventSelect.appendChild(opt);
  });

  function draw() {
    const ev = getEvent();
    const t = parseFloat(timeSlider.value); // 0-1 progress through eclipse
    ctx.clearRect(0, 0, W, H);

    const isSolar = ev.type === 'solar';
    const currentH = ev.startH + t * (ev.endH - ev.startH);
    const hours = Math.floor(currentH % 24);
    const mins = Math.floor((currentH % 1) * 60);

    // Sky gradient based on time and eclipse
    const isNight = !isSolar;
    if (isSolar) {
      // Daytime sky, darken during max eclipse
      const maxT = (ev.maxH - ev.startH) / (ev.endH - ev.startH);
      const distToMax = Math.abs(t - maxT);
      const eclipseDarkness = Math.max(0, 1 - distToMax * 4) * ev.maxMag;
      const skyBright = Math.max(0.1, 1 - eclipseDarkness * 0.8);
      const r = Math.floor(100 * skyBright);
      const g = Math.floor(160 * skyBright);
      const b = Math.floor(230 * skyBright);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, 0, W, H);
      // Stars visible during total eclipse
      if (eclipseDarkness > 0.9) {
        for (let i = 0; i < 30; i++) {
          ctx.fillStyle = `rgba(255,255,255,${eclipseDarkness - 0.8})`;
          ctx.beginPath();
          ctx.arc((i * 97 + 20) % W, (i * 61 + 10) % (H * 0.6), 1, 0, TAU);
          ctx.fill();
        }
      }
    } else {
      // Night sky
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#0a0e27'); grad.addColorStop(1, '#1a1a30');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 50; i++) {
        ctx.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.4})`;
        ctx.beginPath();
        ctx.arc((i * 137 + 30) % W, (i * 89 + 15) % (H * 0.65), 0.6, 0, TAU);
        ctx.fill();
      }
    }

    // Ground / horizon
    ctx.fillStyle = isSolar ? '#2a5a2a' : '#1a2a1a';
    ctx.fillRect(0, H * 0.78, W, H * 0.22);
    // Skyline silhouette
    ctx.fillStyle = isSolar ? '#1a3a1a' : '#0a1a0a';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.78);
    for (let x = 0; x <= W; x += 20) {
      ctx.lineTo(x, H * 0.78 - Math.sin(x * 0.02) * 8 - Math.random() * 3);
    }
    ctx.lineTo(W, H * 0.78);
    ctx.fill();

    // Seoul landmark hint
    ctx.fillStyle = isSolar ? '#1a3a1a' : '#0a1a0a';
    ctx.fillRect(W * 0.45, H * 0.68, 6, H * 0.10); // tower
    ctx.beginPath();
    ctx.arc(W * 0.45 + 3, H * 0.67, 8, 0, TAU); ctx.fill();

    // Calculate celestial body position
    const altStart = isSolar ? ev.sunAltStart : ev.moonAltStart;
    const altMax = isSolar ? ev.sunAltMax : ev.moonAltMax;
    const altEnd = isSolar ? ev.sunAltEnd : ev.moonAltEnd;
    const alt = altStart + t * (altEnd - altStart); // simplified linear interpolation
    const bodyY = H * 0.78 - (alt / 90) * H * 0.70;
    const bodyX = W * 0.2 + t * W * 0.6;

    if (isSolar) {
      // ── Solar eclipse view from Seoul ──
      const sunR = 36;
      const maxT = (ev.maxH - ev.startH) / (ev.endH - ev.startH);
      // Moon moves across sun disk
      const moonPhase = (t - maxT) * 3; // -1.5 to 1.5 normalized
      const moonOffsetX = moonPhase * sunR * 1.2;
      const moonOffsetY = -moonPhase * sunR * 0.3; // slight diagonal

      // Sun glow
      const glowR = sunR + 15;
      const sg = ctx.createRadialGradient(bodyX, bodyY, sunR * 0.8, bodyX, bodyY, glowR);
      sg.addColorStop(0, 'rgba(255,200,50,0.3)');
      sg.addColorStop(1, 'rgba(255,200,50,0)');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(bodyX, bodyY, glowR, 0, TAU); ctx.fill();

      // Corona (visible near totality)
      const distMax = Math.abs(t - maxT);
      if (distMax < 0.15 && ev.kind === 'total') {
        const coronaAlpha = Math.max(0, 1 - distMax * 10);
        for (let a = 0; a < TAU; a += 0.15) {
          const cLen = sunR * (1.5 + 0.5 * Math.sin(a * 7));
          const cg = ctx.createLinearGradient(
            bodyX + sunR * 0.8 * Math.cos(a), bodyY + sunR * 0.8 * Math.sin(a),
            bodyX + cLen * Math.cos(a), bodyY + cLen * Math.sin(a));
          cg.addColorStop(0, `rgba(255,255,255,${coronaAlpha * 0.5})`);
          cg.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.strokeStyle = cg; ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(bodyX + sunR * 0.9 * Math.cos(a), bodyY + sunR * 0.9 * Math.sin(a));
          ctx.lineTo(bodyX + cLen * Math.cos(a), bodyY + cLen * Math.sin(a));
          ctx.stroke();
        }
      }

      // Sun disk
      ctx.fillStyle = '#ffdd44';
      ctx.beginPath(); ctx.arc(bodyX, bodyY, sunR, 0, TAU); ctx.fill();

      // Moon disk overlapping
      ctx.fillStyle = '#1a1a2a';
      const moonR = sunR * (ev.kind === 'annular' ? 0.92 : 1.02);
      ctx.beginPath(); ctx.arc(bodyX + moonOffsetX, bodyY + moonOffsetY, moonR, 0, TAU); ctx.fill();

    } else {
      // ── Lunar eclipse view from Seoul ──
      const moonR = 32;
      const maxT = (ev.maxH - ev.startH) / (ev.endH - ev.startH);
      const eclipseProgress = 1 - Math.abs(t - maxT) / maxT; // 0 at start/end, 1 at max

      // Moon disk (bright)
      ctx.fillStyle = '#e8e4d8';
      ctx.beginPath(); ctx.arc(bodyX, bodyY, moonR, 0, TAU); ctx.fill();

      // Mare (surface features)
      ctx.fillStyle = '#ccc8b8';
      ctx.beginPath(); ctx.arc(bodyX - 8, bodyY - 5, 7, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(bodyX + 6, bodyY + 8, 5, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(bodyX + 12, bodyY - 10, 4, 0, TAU); ctx.fill();

      // Earth's shadow sweeping across
      ctx.save();
      ctx.beginPath(); ctx.arc(bodyX, bodyY, moonR, 0, TAU); ctx.clip();

      // Shadow enters from left
      const shadowCx = bodyX - moonR * 2.5 + eclipseProgress * moonR * 2.5;
      const shadowR = moonR * 2.2;

      // Penumbral shadow
      const penGrad = ctx.createRadialGradient(shadowCx, bodyY, shadowR * 0.5, shadowCx, bodyY, shadowR);
      penGrad.addColorStop(0, 'rgba(0,0,0,0.7)');
      penGrad.addColorStop(0.6, 'rgba(80,20,10,0.5)');
      penGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = penGrad;
      ctx.beginPath(); ctx.arc(shadowCx, bodyY, shadowR, 0, TAU); ctx.fill();

      // Blood moon tint at maximum
      if (eclipseProgress > 0.6) {
        const tint = (eclipseProgress - 0.6) / 0.4;
        ctx.fillStyle = `rgba(180,50,20,${tint * 0.5})`;
        ctx.beginPath(); ctx.arc(bodyX, bodyY, moonR, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }

    // Time and info display
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Noto Sans KR'; ctx.textAlign = 'left';
    ctx.fillText(`서울 관측 시각: ${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')} KST`, 12, 22);
    ctx.font = '11px Noto Sans KR'; ctx.fillStyle = '#ddd';
    ctx.fillText(`고도: ${alt.toFixed(1)}°`, 12, 40);
    ctx.fillText(ev.date, 12, 56);

    // Event type badge
    ctx.fillStyle = isSolar ? '#ff8844' : '#8844ff';
    const badge = isSolar ? (ev.kind === 'total' ? '개기일식' : ev.kind === 'annular' ? '금환일식' : '부분일식')
                          : (ev.kind === 'total' ? '개기월식' : '부분월식');
    ctx.font = 'bold 12px Noto Sans KR'; ctx.textAlign = 'right';
    ctx.fillText(badge, W - 12, 22);

    // Compass direction
    ctx.fillStyle = '#aaa'; ctx.font = '10px Noto Sans KR'; ctx.textAlign = 'center';
    ctx.fillText('남', W * 0.5, H * 0.78 + 16);
    ctx.fillText('동', W * 0.08, H * 0.78 + 16);
    ctx.fillText('서', W * 0.92, H * 0.78 + 16);

    if (info) info.textContent = ev.desc;
  }

  eventSelect.addEventListener('change', () => { timeSlider.value = 0; draw(); });
  timeSlider.addEventListener('input', draw);
  draw();
})();

// ═══════════════════════════════════════════════════════════
// 6. Geocentric vs Heliocentric Comparison
// ═══════════════════════════════════════════════════════════
(function() {
  const geoCanvas = document.getElementById('geoCanvas');
  const helioCanvas = document.getElementById('helioCanvas');
  if (!geoCanvas || !helioCanvas) return;
  const gCtx = geoCanvas.getContext('2d');
  const hCtx = helioCanvas.getContext('2d');
  const gW = geoCanvas.width, gH = geoCanvas.height;
  const hW = helioCanvas.width, hH = helioCanvas.height;

  const playBtn = document.getElementById('compPlayPause');
  const speedSlider = document.getElementById('compSpeed');
  const info = document.getElementById('compInfo');

  let running = true, time = 0;
  const earthPeriod = 365.25, marsPeriod = 687;

  // Mars trail in geocentric view
  let marsGeoTrail = [];

  playBtn.addEventListener('click', () => {
    running = !running;
    playBtn.textContent = running ? '⏸ 일시정지' : '▶ 재생';
    if (running) animate();
  });

  function drawStars(ctx, w, h) {
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.15 + Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.arc((i * 137.5 + 50) % w, (i * 97.3 + 30) % h, 0.5, 0, TAU);
      ctx.fill();
    }
  }

  function animate() {
    if (!running) return;
    const speed = parseFloat(speedSlider.value);
    time += speed;

    const earthAngle = TAU * time / earthPeriod;
    const marsAngle = TAU * time / marsPeriod;

    // ── Heliocentric (right) ──
    hCtx.fillStyle = '#0a0e27'; hCtx.fillRect(0, 0, hW, hH);
    drawStars(hCtx, hW, hH);
    const hCx = hW / 2, hCy = hH / 2;
    const earthR = 90, marsR = 135;

    // Orbits
    hCtx.strokeStyle = 'rgba(68,136,204,0.2)'; hCtx.lineWidth = 0.5;
    hCtx.beginPath(); hCtx.arc(hCx, hCy, earthR, 0, TAU); hCtx.stroke();
    hCtx.strokeStyle = 'rgba(204,100,68,0.2)';
    hCtx.beginPath(); hCtx.arc(hCx, hCy, marsR, 0, TAU); hCtx.stroke();

    // Sun
    hCtx.fillStyle = '#ffdd44';
    hCtx.beginPath(); hCtx.arc(hCx, hCy, 10, 0, TAU); hCtx.fill();

    // Earth
    const eX = hCx + earthR * Math.cos(earthAngle);
    const eY = hCy + earthR * Math.sin(earthAngle);
    hCtx.fillStyle = '#4488cc';
    hCtx.beginPath(); hCtx.arc(eX, eY, 5, 0, TAU); hCtx.fill();

    // Mars
    const mX = hCx + marsR * Math.cos(marsAngle);
    const mY = hCy + marsR * Math.sin(marsAngle);
    hCtx.fillStyle = '#cc6644';
    hCtx.beginPath(); hCtx.arc(mX, mY, 4, 0, TAU); hCtx.fill();

    // Sight line
    hCtx.strokeStyle = 'rgba(255,255,100,0.2)'; hCtx.lineWidth = 0.5;
    hCtx.setLineDash([3, 3]);
    hCtx.beginPath(); hCtx.moveTo(eX, eY); hCtx.lineTo(mX, mY); hCtx.stroke();
    hCtx.setLineDash([]);

    // Labels
    hCtx.fillStyle = '#fff'; hCtx.font = '9px Noto Sans KR'; hCtx.textAlign = 'center';
    hCtx.fillText('태양', hCx, hCy + 18);
    hCtx.fillText('지구', eX, eY + 12);
    hCtx.fillText('화성', mX, mY + 12);

    // ── Geocentric (left) ──
    gCtx.fillStyle = '#0a0e27'; gCtx.fillRect(0, 0, gW, gH);
    drawStars(gCtx, gW, gH);
    const gCx = gW / 2, gCy = gH / 2;

    // Earth at center
    gCtx.fillStyle = '#4488cc';
    gCtx.beginPath(); gCtx.arc(gCx, gCy, 8, 0, TAU); gCtx.fill();
    gCtx.fillStyle = '#fff'; gCtx.font = '9px Noto Sans KR'; gCtx.textAlign = 'center';
    gCtx.fillText('지구', gCx, gCy + 18);

    // Sun orbits Earth in geocentric model
    const sunGeoAngle = earthAngle; // Sun appears to orbit Earth
    const sunGeoR = 80;
    const sunGeoX = gCx + sunGeoR * Math.cos(sunGeoAngle);
    const sunGeoY = gCy + sunGeoR * Math.sin(sunGeoAngle);
    gCtx.fillStyle = '#ffdd44';
    gCtx.beginPath(); gCtx.arc(sunGeoX, sunGeoY, 8, 0, TAU); gCtx.fill();
    gCtx.fillStyle = '#fff'; gCtx.font = '9px Noto Sans KR';
    gCtx.fillText('태양', sunGeoX, sunGeoY + 15);
    gCtx.strokeStyle = 'rgba(255,220,68,0.15)';
    gCtx.beginPath(); gCtx.arc(gCx, gCy, sunGeoR, 0, TAU); gCtx.stroke();

    // Mars in geocentric: relative position
    const marsRelX = mX - eX; // Mars position relative to Earth
    const marsRelY = mY - eY;
    const marsRelDist = Math.sqrt(marsRelX * marsRelX + marsRelY * marsRelY);
    const marsRelAngle = Math.atan2(marsRelY, marsRelX);

    // Scale to fit canvas
    const marsGeoR = marsRelDist * 0.7;
    const marsGeoX = gCx + marsGeoR * Math.cos(marsRelAngle);
    const marsGeoY = gCy + marsGeoR * Math.sin(marsRelAngle);

    // Mars trail (shows epicycloid / retrograde)
    marsGeoTrail.push({ x: marsGeoX, y: marsGeoY });
    if (marsGeoTrail.length > 800) marsGeoTrail.shift();

    gCtx.strokeStyle = 'rgba(204,100,68,0.4)'; gCtx.lineWidth = 1;
    gCtx.beginPath();
    for (let i = 0; i < marsGeoTrail.length; i++) {
      const p = marsGeoTrail[i];
      i === 0 ? gCtx.moveTo(p.x, p.y) : gCtx.lineTo(p.x, p.y);
    }
    gCtx.stroke();

    gCtx.fillStyle = '#cc6644';
    gCtx.beginPath(); gCtx.arc(marsGeoX, marsGeoY, 4, 0, TAU); gCtx.fill();
    gCtx.fillStyle = '#fff'; gCtx.font = '9px Noto Sans KR';
    gCtx.fillText('화성', marsGeoX, marsGeoY + 12);

    // Epicycle explanation circle (visual only, approximate)
    if (marsGeoTrail.length > 100) {
      // Show that the trail forms loops
      gCtx.fillStyle = 'rgba(255,200,100,0.5)'; gCtx.font = '10px Noto Sans KR';
      gCtx.fillText('↺ 역행운동', gCx, gH - 12);
    }

    // Check retrograde
    const prevAngle = marsGeoTrail.length > 5 ?
      Math.atan2(marsGeoTrail[marsGeoTrail.length-5].y - gCy, marsGeoTrail[marsGeoTrail.length-5].x - gCx) : marsRelAngle;
    const angleDiff = marsRelAngle - prevAngle;
    const isRetrograde = angleDiff < -0.001 || (angleDiff > Math.PI);

    if (info) {
      const dayNum = Math.floor(time % (earthPeriod * 2));
      info.textContent = `${dayNum}일 | ${isRetrograde ? '⚠ 역행 중 (Retrograde)' : '순행 중 (Prograde)'} | 화성의 궤적이 고리 모양을 그리는 것은 지구 공전 때문입니다`;
    }

    requestAnimationFrame(animate);
  }

  gCtx.fillStyle = '#0a0e27'; gCtx.fillRect(0, 0, gW, gH);
  hCtx.fillStyle = '#0a0e27'; hCtx.fillRect(0, 0, hW, hH);
  animate();
})();

// ═══════════════════════════════════════════════════════════
// KaTeX auto-render
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(document.body, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '\\(', right: '\\)', display: false}
      ],
      throwOnError: false
    });
  }
});
