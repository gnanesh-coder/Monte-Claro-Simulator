export interface ParsedStockData {
  initialPrice: number;
  expectedReturn: number;
  volatility: number;
  error?: string;
}

export function parseStockCSV(csvText: string): ParsedStockData {
  try {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      return { initialPrice: 0, expectedReturn: 0, volatility: 0, error: 'CSV file is empty or has only one row.' };
    }

    // Parse header to find relevant columns
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // We look for 'adj close' or 'close' as price
    let priceColIdx = headers.indexOf('adj close');
    if (priceColIdx === -1) {
      priceColIdx = headers.indexOf('close');
    }
    
    let dateColIdx = headers.indexOf('date');

    if (priceColIdx === -1) {
      return { initialPrice: 0, expectedReturn: 0, volatility: 0, error: "Could not find 'Close' or 'Adj Close' column in CSV." };
    }

    // Parse data rows, keeping track of Date and Price
    const dataPoints: { date: Date | null, price: number }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple split by comma. Note: This assumes standard simple CSVs without quoted commas.
      const cols = line.split(',');
      if (cols.length <= priceColIdx) continue;

      const priceStr = cols[priceColIdx].trim();
      const price = parseFloat(priceStr);
      
      if (isNaN(price) || price <= 0) continue;

      let date = null;
      if (dateColIdx !== -1 && cols.length > dateColIdx) {
        date = new Date(cols[dateColIdx].trim());
      }

      dataPoints.push({ date, price });
    }

    if (dataPoints.length < 2) {
      return { initialPrice: 0, expectedReturn: 0, volatility: 0, error: 'Not enough valid data points to calculate historical metrics.' };
    }

    // Sort chronologically if dates are present
    if (dataPoints[0].date !== null) {
      dataPoints.sort((a, b) => {
        if (a.date && b.date) {
          return a.date.getTime() - b.date.getTime();
        }
        return 0;
      });
    }

    // Calculate daily logarithmic returns: ln(P_t / P_{t-1})
    const dailyReturns: number[] = [];
    for (let i = 1; i < dataPoints.length; i++) {
      const p1 = dataPoints[i - 1].price;
      const p2 = dataPoints[i].price;
      dailyReturns.push(Math.log(p2 / p1));
    }

    // Mean daily return
    const meanDailyReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;

    // Daily variance
    const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - meanDailyReturn, 2), 0) / (dailyReturns.length - 1);
    
    // Daily volatility (std dev)
    const dailyVolatility = Math.sqrt(variance);

    // Annualize (assuming 252 trading days)
    const expectedReturn = meanDailyReturn * 252;
    const volatility = dailyVolatility * Math.sqrt(252);
    
    // Initial price for simulation is the most recent price
    const initialPrice = dataPoints[dataPoints.length - 1].price;

    return {
      initialPrice,
      expectedReturn,
      volatility
    };

  } catch (err: any) {
    return { initialPrice: 0, expectedReturn: 0, volatility: 0, error: `Error parsing CSV: ${err.message}` };
  }
}
