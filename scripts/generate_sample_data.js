import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.resolve(__dirname, '../sample-data');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const points = [];
const now = Date.now();
const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
const intervalMs = 30 * 60 * 1000; // 30 minutes interval = 336 points
const startTime = now - sevenDaysMs;

for (let t = startTime; t <= now; t += intervalMs) {
  const elapsedDays = (t - startTime) / (24 * 60 * 60 * 1000);
  const hourOfDay = new Date(t).getHours();

  // Diurnal load cycle: peak between 9am and 6pm (industrial shift)
  let baseCurrent = 80.0;
  if (hourOfDay >= 8 && hourOfDay <= 18) {
    baseCurrent = 190.0 + Math.sin((hourOfDay - 8) / 10 * Math.PI) * 45.0;
  } else {
    baseCurrent = 40.0 + Math.sin(hourOfDay / 24 * 2 * Math.PI) * 20.0;
  }
  const current_A = Number(Math.max(0, baseCurrent + (Math.random() - 0.5) * 8.0).toFixed(2));

  // Progressive slight relaxation starting at day 4
  let baseForce = 12050;
  if (elapsedDays > 4) {
    baseForce -= (elapsedDays - 4) * 850; // Decays down to ~9500 N by day 7
  }
  const force_N = Math.round(baseForce + (Math.random() - 0.5) * 60);

  // Resistance with slight micro-constriction and oxidation rise on day 5+
  let resistance_mOhm = 0.040;
  if (elapsedDays > 4) {
    resistance_mOhm += (12050 - force_N) * 0.000002;
  }
  if (elapsedDays > 5.5) {
    resistance_mOhm += (elapsedDays - 5.5) * 0.008; // Creeping to 0.052 mΩ
  }
  resistance_mOhm = Number((resistance_mOhm + (Math.random() - 0.5) * 0.001).toFixed(4));

  // Voltage drop (mV) = R (mΩ) * I (A)
  const vDrop_mV = current_A < 1.0 ? 0.02 : Number((resistance_mOhm * current_A).toFixed(3));

  // Ambient temperature (diurnal 26 to 34 °C)
  const tempAmbient_C = Number((28.0 + Math.sin((hourOfDay - 6) / 24 * 2 * Math.PI) * 4.5 + (Math.random() - 0.5) * 0.5).toFixed(1));

  // Joint temperature: Ambient + Joulean thermal rise (I^2 * R factor)
  const jouleFactor = (current_A / 200.0) ** 2 * (resistance_mOhm / 0.040);
  const tempRise_C = Number((current_A < 1.0 ? 0.5 : (8.0 * jouleFactor + (Math.random() - 0.5) * 0.5)).toFixed(1));
  const tempJoint_C = Number((tempAmbient_C + tempRise_C).toFixed(1));

  // Derived Power Loss (W)
  const powerLoss_W = current_A < 1.0 ? 0 : Number(((vDrop_mV * current_A) / 1000).toFixed(3));

  // JHI Calculation
  const rScore = Math.max(0, Math.min(100, 100 * (1 - (resistance_mOhm - 0.040) / (0.095 - 0.040))));
  const fScore = Math.max(0, Math.min(100, 100 * ((force_N - 5000) / (12000 - 5000))));
  const tScore = Math.max(0, Math.min(100, 100 * (1 - (tempRise_C - 8.0) / (45.0 - 8.0))));
  const pScore = Math.max(0, Math.min(100, 100 * (1 - powerLoss_W / 5.0)));
  const jhi = Math.max(0, Math.min(100, Math.round(0.35 * rScore + 0.30 * tScore + 0.25 * fScore + 0.10 * pScore)));

  const status = jhi >= 80 ? 'HEALTHY' : jhi >= 50 ? 'WARNING' : 'CRITICAL';

  points.push({
    timestamp: t,
    isoTime: new Date(t).toISOString(),
    vDrop_mV,
    current_A,
    force_N,
    tempJoint_C,
    tempAmbient_C,
    resistance_mOhm: current_A < 1.0 ? null : resistance_mOhm,
    resistanceStatusText: current_A < 1.0 ? 'Insufficient current' : `${resistance_mOhm.toFixed(3)} mΩ`,
    powerLoss_W,
    tempRise_C,
    jhi,
    status
  });
}

// 1. Write JSON
fs.writeFileSync(
  path.join(targetDir, '7day_telemetry.json'),
  JSON.stringify(points, null, 2),
  'utf-8'
);

// 2. Write CSV
const csvHeaders = [
  'timestamp',
  'isoTime',
  'vDrop_mV',
  'current_A',
  'force_N',
  'tempJoint_C',
  'tempAmbient_C',
  'resistance_mOhm',
  'powerLoss_W',
  'tempRise_C',
  'jhi',
  'status'
];

const csvRows = points.map(p => [
  p.timestamp,
  p.isoTime,
  p.vDrop_mV,
  p.current_A,
  p.force_N,
  p.tempJoint_C,
  p.tempAmbient_C,
  p.resistance_mOhm !== null ? p.resistance_mOhm : '',
  p.powerLoss_W,
  p.tempRise_C,
  p.jhi,
  p.status
].join(','));

fs.writeFileSync(
  path.join(targetDir, '7day_telemetry.csv'),
  [csvHeaders.join(','), ...csvRows].join('\n'),
  'utf-8'
);

console.log(`Generated ${points.length} sample points for 7 days in sample-data/`);
