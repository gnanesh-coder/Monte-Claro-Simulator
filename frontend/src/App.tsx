import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { FileDown, TrendingUp, AlertTriangle, Activity, Play, UploadCloud } from 'lucide-react';
import { runMonteCarloSimulation } from './lib/monteCarlo';
import type { SimulationParams, SimulationResults } from './lib/monteCarlo';
import { parseStockCSV } from './lib/csvParser';
import './App.css';

function App() {
  const [params, setParams] = useState<SimulationParams>({
    initialPrice: 100,
    expectedReturn: 0.15,
    volatility: 0.25,
    timeSteps: 252,
    numSimulations: 10000,
  });

  const [results, setResults] = useState<SimulationResults | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const handleSimulate = () => {
    setIsSimulating(true);
    // Use setTimeout to allow UI to render the loading state
    setTimeout(() => {
      const simResults = runMonteCarloSimulation(params);
      setResults(simResults);
      setIsSimulating(false);
    }, 50);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const parsedData = parseStockCSV(text);
      if (parsedData.error) {
        alert(parsedData.error);
        return;
      }
      setParams(prev => {
        const newParams = {
          ...prev,
          initialPrice: parsedData.initialPrice,
          expectedReturn: parsedData.expectedReturn,
          volatility: parsedData.volatility
        };
        // Auto-run simulation after short delay so state sets first
        setTimeout(() => {
          setIsSimulating(true);
          setTimeout(() => {
            setResults(runMonteCarloSimulation(newParams));
            setIsSimulating(false);
          }, 50);
        }, 0);
        return newParams;
      });
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  // Run initial simulation on mount
  useEffect(() => {
    handleSimulate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = (val: number) => `$${val.toFixed(2)}`;
  const formatPercent = (val: number) => `${val.toFixed(2)}%`;

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!results) return [];
    
    // We have chartPaths: number[][] where each array is a simulation path
    // Recharts expects an array of objects: { step: 0, path0: 100, path1: 100, ... }
    const data = [];
    for (let t = 0; t <= params.timeSteps; t++) {
      const stepData: any = { step: t };
      results.chartPaths.forEach((path, idx) => {
        stepData[`path${idx}`] = path[t];
      });
      data.push(stepData);
    }
    return data;
  }, [results, params.timeSteps]);

  const handleDownload = () => {
    if (!results) return;
    setIsExporting(true);

    const fc = (v: number) => `$${v.toFixed(2)}`;
    const fp = (v: number) => `${v.toFixed(2)}%`;
    const expectedRet = ((results.meanPrice - params.initialPrice) / params.initialPrice) * 100;
    const bestRet = ((results.maxPrice - params.initialPrice) / params.initialPrice) * 100;
    const worstRet = ((results.minPrice - params.initialPrice) / params.initialPrice) * 100;

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>Monte Carlo Simulation Report</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Inter,sans-serif;background:#0f172a;color:#f8fafc;padding:40px;font-size:13px}
.bar{height:4px;background:linear-gradient(to right,#3b82f6,#06b6d4);border-radius:2px;margin-bottom:28px}
h1{font-size:26px;font-weight:700;color:#60a5fa;margin-bottom:6px}
.sub{color:#94a3b8;font-size:11px;margin-bottom:28px}
.sub span{margin-right:14px}
h2{font-size:12px;font-weight:600;color:#60a5fa;text-transform:uppercase;letter-spacing:.08em;margin:24px 0 10px}
hr{border:none;border-top:1px solid rgba(255,255,255,.08);margin:20px 0}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.card{background:rgba(30,41,59,.9);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:14px 16px}
.lbl{color:#94a3b8;font-size:11px;margin-bottom:5px}
.val{font-size:19px;font-weight:700}
.success{color:#10b981}.danger{color:#ef4444}.cyan{color:#06b6d4}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:10px}
table{width:100%;border-collapse:collapse}
td{padding:9px 4px;border-bottom:1px solid rgba(255,255,255,.06)}
td:last-child{text-align:right;font-weight:600}
tr:last-child td{border-bottom:none}
.footer{margin-top:32px;padding-top:14px;border-top:1px solid rgba(255,255,255,.08);color:#475569;font-size:10px;text-align:center}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="bar"></div>
<h1>Monte Carlo Simulation Report</h1>
<p class="sub">
  <span>Initial Price: ${fc(params.initialPrice)}</span>
  <span>Expected Return: ${fp(params.expectedReturn * 100)}</span>
  <span>Volatility: ${fp(params.volatility * 100)}</span>
  <span>Simulations: ${params.numSimulations.toLocaleString()}</span>
  <span>Time Steps: ${params.timeSteps} days</span>
</p>
<h2>Key Metrics</h2>
<div class="grid">
  <div class="card"><div class="lbl">Mean Final Price</div><div class="val cyan">${fc(results.meanPrice)}</div></div>
  <div class="card"><div class="lbl">Value at Risk (95%)</div><div class="val danger">${fc(results.valueAtRisk)}</div></div>
  <div class="card"><div class="lbl">Probability of Profit</div><div class="val success">${fp(results.probProfit)}</div></div>
  <div class="card"><div class="lbl">Probability of Loss</div><div class="val danger">${fp(results.probLoss)}</div></div>
</div>
<hr/>
<h2>Price Statistics &amp; Confidence Intervals</h2>
<div class="cols">
<table>
  <tr><td style="color:#94a3b8">Initial Price</td><td>${fc(params.initialPrice)}</td></tr>
  <tr><td style="color:#94a3b8">Mean Final Price</td><td>${fc(results.meanPrice)}</td></tr>
  <tr><td style="color:#94a3b8">Maximum Price</td><td class="success">${fc(results.maxPrice)}</td></tr>
  <tr><td style="color:#94a3b8">Minimum Price</td><td class="danger">${fc(results.minPrice)}</td></tr>
  <tr><td style="color:#94a3b8">Standard Deviation</td><td>${fc(results.stdDev)}</td></tr>
</table>
<table>
  <tr><td style="color:#94a3b8">95% CI Lower</td><td class="danger">${fc(results.confidence95Lower)}</td></tr>
  <tr><td style="color:#94a3b8">95% CI Upper</td><td class="success">${fc(results.confidence95Upper)}</td></tr>
  <tr><td style="color:#94a3b8">99% CI Lower</td><td class="danger">${fc(results.confidence99Lower)}</td></tr>
  <tr><td style="color:#94a3b8">99% CI Upper</td><td class="success">${fc(results.confidence99Upper)}</td></tr>
</table>
</div>
<hr/>
<h2>Returns Analysis</h2>
<table>
  <tr><td style="color:#94a3b8">Expected Return</td><td class="${expectedRet >= 0 ? 'success' : 'danger'}">${fp(expectedRet)}</td></tr>
  <tr><td style="color:#94a3b8">Best Case Return</td><td class="success">${fp(bestRet)}</td></tr>
  <tr><td style="color:#94a3b8">Worst Case Return</td><td class="danger">${fp(worstRet)}</td></tr>
</table>
<div class="footer">Generated by Monte Carlo Simulator &nbsp;&bull;&nbsp; ${new Date().toLocaleString()}</div>
</body></html>`;

    const w = window.open('', '_blank', 'width=920,height=700');
    if (!w) {
      alert('Pop-ups are blocked. Please allow pop-ups for this page, then try again.');
      setIsExporting(false);
      return;
    }
    w.document.write(html);
    w.document.close();
    w.onload = () => {
      setTimeout(() => {
        w.print();
        w.close();
        setIsExporting(false);
      }, 600);
    };
  };

  return (
    <div className="app-container">
      {/* Header spanning top */}
      <header className="header">
        <h1>
          <Activity size={32} color="#60a5fa" />
          Monte Carlo Simulator
        </h1>
        <button className="btn-primary" onClick={handleDownload} disabled={isExporting || !results} style={{ padding: '0.5rem 1rem' }} title="Export PDF">
          <FileDown size={18} />
          {isExporting ? 'Exporting...' : 'Export PDF'}
        </button>
      </header>

      {/* Sidebar Controls */}
      <aside className="controls-sidebar glass-panel">
        <h2 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Simulation Parameters</h2>
        
        <div style={{ marginBottom: '1.5rem', background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px dashed rgba(59, 130, 246, 0.4)' }}>
          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#60a5fa' }}>
            <UploadCloud size={24} />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Load Real Stock Data (CSV)</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
        
        <div className="control-group">
          <label>
            Initial Price <span>{formatCurrency(params.initialPrice)}</span>
          </label>
          <input 
            type="range" min="10" max="1000" step="1" 
            value={params.initialPrice}
            onChange={(e) => setParams({...params, initialPrice: parseFloat(e.target.value)})}
          />
        </div>

        <div className="control-group">
          <label>
            Expected Return (Annual) <span>{formatPercent(params.expectedReturn * 100)}</span>
          </label>
          <input 
            type="range" min="-0.5" max="1.0" step="0.01" 
            value={params.expectedReturn}
            onChange={(e) => setParams({...params, expectedReturn: parseFloat(e.target.value)})}
          />
        </div>

        <div className="control-group">
          <label>
            Volatility (Annual) <span>{formatPercent(params.volatility * 100)}</span>
          </label>
          <input 
            type="range" min="0.05" max="1.0" step="0.01" 
            value={params.volatility}
            onChange={(e) => setParams({...params, volatility: parseFloat(e.target.value)})}
          />
        </div>

        <div className="control-group">
          <label>
            Time Steps (Days) <span>{params.timeSteps}</span>
          </label>
          <input 
            type="range" min="30" max="1000" step="1" 
            value={params.timeSteps}
            onChange={(e) => setParams({...params, timeSteps: parseInt(e.target.value)})}
          />
        </div>

        <div className="control-group" style={{ marginBottom: '1rem' }}>
          <label>
            Simulations <span>{params.numSimulations.toLocaleString()}</span>
          </label>
          <input 
            type="range" min="1000" max="50000" step="1000" 
            value={params.numSimulations}
            onChange={(e) => setParams({...params, numSimulations: parseInt(e.target.value)})}
          />
        </div>

        <button className="btn-primary" onClick={handleSimulate} disabled={isSimulating}>
          {isSimulating ? 'Simulating...' : (
            <>
              <Play size={18} fill="currentColor" />
              Run Simulation
            </>
          )}
        </button>
      </aside>

      {/* Main Dashboard */}
      <main className="main-content" ref={dashboardRef}>
        {results ? (
          <>
            <div className="stats-grid">
              <div className="glass-panel stat-card cyan">
                <span className="stat-title">Mean Final Price</span>
                <span className="stat-value">{formatCurrency(results.meanPrice)}</span>
              </div>
              <div className="glass-panel stat-card danger">
                <span className="stat-title">Value at Risk (95%)</span>
                <span className="stat-value text-danger">{formatCurrency(results.valueAtRisk)}</span>
              </div>
              <div className="glass-panel stat-card success">
                <span className="stat-title">Probability of Profit</span>
                <span className="stat-value text-success">{formatPercent(results.probProfit)}</span>
              </div>
            </div>

            <div className="glass-panel chart-container">
              <h3 style={{ marginBottom: '1rem' }}>Simulated Price Paths (Sample)</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis 
                    dataKey="step" 
                    stroke="#94a3b8" 
                    tick={{ fill: '#94a3b8' }}
                    tickFormatter={(val) => `Day ${val}`}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    tick={{ fill: '#94a3b8' }}
                    tickFormatter={(val) => `$${val}`}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#f8fafc' }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '0.5rem' }}
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Price']}
                    labelFormatter={(label) => `Day ${label}`}
                  />
                  {results.chartPaths.map((_, idx) => (
                    <Line 
                      key={idx}
                      type="monotone" 
                      dataKey={`path${idx}`} 
                      stroke={idx === 0 ? "#3b82f6" : `rgba(59, 130, 246, ${Math.max(0.05, 0.3 - (idx * 0.01))})`} 
                      strokeWidth={idx === 0 ? 3 : 1}
                      dot={false}
                      activeDot={idx === 0 ? { r: 6 } : false}
                      isAnimationActive={false} // Disable animation for performance with many lines
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="details-grid">
              <div className="glass-panel">
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={20} color="#10b981" /> Extreme Values
                </h3>
                <div className="detail-row">
                  <span>Maximum Price Simulated</span>
                  <span className="text-success">{formatCurrency(results.maxPrice)}</span>
                </div>
                <div className="detail-row">
                  <span>Minimum Price Simulated</span>
                  <span className="text-danger">{formatCurrency(results.minPrice)}</span>
                </div>
                <div className="detail-row">
                  <span>Standard Deviation</span>
                  <span>{formatCurrency(results.stdDev)}</span>
                </div>
              </div>
              
              <div className="glass-panel">
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={20} color="#f59e0b" /> Confidence Intervals
                </h3>
                <div className="detail-row">
                  <span>95% Confidence (Lower)</span>
                  <span className="text-danger">{formatCurrency(results.confidence95Lower)}</span>
                </div>
                <div className="detail-row">
                  <span>95% Confidence (Upper)</span>
                  <span className="text-success">{formatCurrency(results.confidence95Upper)}</span>
                </div>
                <div className="detail-row">
                  <span>99% Confidence (Lower)</span>
                  <span>{formatCurrency(results.confidence99Lower)}</span>
                </div>
                <div className="detail-row">
                  <span>99% Confidence (Upper)</span>
                  <span>{formatCurrency(results.confidence99Upper)}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="glass-panel" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <p>Loading simulation...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
