import fs from 'fs';
import fetch from 'node-fetch';

const logPath = './data/summary_log.csv';
if (!fs.existsSync(logPath)) fs.writeFileSync(logPath, 'timestamp,model,temperature,len,summary\n');

async function summarizeText(text) {
  const res = await fetch('http://localhost:8787/api/summarize?format=json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ docId: 'adhoc', text })
  });
  const data = await res.json();
  const line = [
    new Date().toISOString(),
    data.model,
    process.env.TEMPERATURE || '0.2',
    data.summary?.length || 0,
    JSON.stringify((data.summary || '').slice(0, 80))
  ].join(',') + '\n';
  fs.appendFileSync(logPath, line);
  console.log('Logged:', line);
}

await summarizeText('Quantum computing uses qubits instead of bits.');
