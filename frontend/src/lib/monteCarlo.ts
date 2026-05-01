export interface SimulationParams {
  initialPrice: number;
  expectedReturn: number;
  volatility: number;
  timeSteps: number;
  numSimulations: number;
}

export interface SimulationResults {
  meanPrice: number;
  minPrice: number;
  maxPrice: number;
  stdDev: number;
  confidence95Lower: number;
  confidence95Upper: number;
  confidence99Lower: number;
  confidence99Upper: number;
  valueAtRisk: number;
  probProfit: number;
  probLoss: number;
  // We'll keep a subset of full paths for charting
  chartPaths: number[][]; 
}

// Box-Muller transform to generate Gaussian random numbers
function generateGaussianRandom(): number {
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while(v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function runMonteCarloSimulation(params: SimulationParams): SimulationResults {
  const dt = 1.0 / 252.0; // Daily time step (252 trading days/year)
  const drift = params.expectedReturn * dt;
  const diffusion = params.volatility * Math.sqrt(dt);
  
  const finalPrices: number[] = new Float32Array(params.numSimulations) as any;
  const chartPaths: number[][] = [];
  const MAX_CHART_PATHS = 50; // Only keep 50 paths for the UI chart to stay performant

  let meanPrice = 0;
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  let profitCount = 0;

  for (let sim = 0; sim < params.numSimulations; sim++) {
    let price = params.initialPrice;
    const currentPath: number[] = [price];
    
    // Simulate daily price changes using Geometric Brownian Motion
    for (let t = 0; t < params.timeSteps; t++) {
      const randomShock = generateGaussianRandom();
      const logReturn = drift + diffusion * randomShock;
      price = price * Math.exp(logReturn);
      if (sim < MAX_CHART_PATHS) {
        currentPath.push(price);
      }
    }
    
    finalPrices[sim] = price;
    
    if (sim < MAX_CHART_PATHS) {
      chartPaths.push(currentPath);
    }

    meanPrice += price;
    if (price < minPrice) minPrice = price;
    if (price > maxPrice) maxPrice = price;
    if (price > params.initialPrice) profitCount++;
  }

  meanPrice /= params.numSimulations;

  // Calculate Standard Deviation
  let variance = 0;
  for (let i = 0; i < params.numSimulations; i++) {
    const diff = finalPrices[i] - meanPrice;
    variance += diff * diff;
  }
  variance /= params.numSimulations;
  const stdDev = Math.sqrt(variance);

  // Sort prices for percentiles
  const sortedPrices = Float32Array.from(finalPrices as any);
  sortedPrices.sort();

  const idx5 = Math.floor(params.numSimulations * 0.05);
  const idx95 = Math.floor(params.numSimulations * 0.95);
  const idx1 = Math.floor(params.numSimulations * 0.01);
  const idx99 = Math.floor(params.numSimulations * 0.99);

  const confidence95Lower = sortedPrices[idx5];
  const confidence95Upper = sortedPrices[idx95];
  const confidence99Lower = sortedPrices[idx1];
  const confidence99Upper = sortedPrices[idx99];

  const valueAtRisk = meanPrice - confidence95Lower;
  const probProfit = (profitCount / params.numSimulations) * 100;
  const probLoss = 100 - probProfit;

  return {
    meanPrice,
    minPrice,
    maxPrice,
    stdDev,
    confidence95Lower,
    confidence95Upper,
    confidence99Lower,
    confidence99Upper,
    valueAtRisk,
    probProfit,
    probLoss,
    chartPaths,
  };
}
