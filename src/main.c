#include "monte_carlo.h"

int main() {
    printf("\n");
    printf("╔════════════════════════════════════════════════════════════╗\n");
    printf("║   MONTE CARLO STOCK MARKET SIMULATOR                       ║\n");
    printf("║   Predict Future Stock Prices & Analyze Risk               ║\n");
    printf("╚════════════════════════════════════════════════════════════╝\n\n");
    
    // Initialize random number generator
    srand(time(NULL));
    
    // Define simulation parameters
    SimulationParams params;
    SimulationResults results;
    
    // Example 1: Tech Stock (High Volatility, High Return)
    printf("SCENARIO 1: Tech Stock (High Growth)\n");
    printf("─────────────────────────────────────────────────────────────\n");
    params.initial_price = 100.0;           // Starting price: $100
    params.expected_return = 0.15;          // 15% annual return
    params.volatility = 0.25;               // 25% annual volatility
    params.time_steps = 252;                // 1 year (252 trading days)
    params.num_simulations = 10000;         // 10,000 simulations
    
    // Run simulation
    runMonteCarloSimulation(params, &results);
    calculateStatistics(&results);
    printResults(results, params);
    saveResultsToFile(results, &params, "results/tech_stock_results.csv");
    
    // Example 2: Stable Stock (Low Volatility, Lower Return)
    printf("\n\nSCENARIO 2: Stable Stock (Dividend Yield)\n");
    printf("─────────────────────────────────────────────────────────────\n");
    params.initial_price = 50.0;            // Starting price: $50
    params.expected_return = 0.08;          // 8% annual return
    params.volatility = 0.12;               // 12% annual volatility
    params.time_steps = 252;                // 1 year
    params.num_simulations = 10000;         // 10,000 simulations
    
    runMonteCarloSimulation(params, &results);
    calculateStatistics(&results);
    printResults(results, params);
    saveResultsToFile(results, &params, "results/stable_stock_results.csv");
    
    // Example 3: Volatile Stock (Very High Volatility)
    printf("\n\nSCENARIO 3: Volatile Stock (High Risk/High Reward)\n");
    printf("─────────────────────────────────────────────────────────────\n");
    params.initial_price = 75.0;            // Starting price: $75
    params.expected_return = 0.20;          // 20% annual return
    params.volatility = 0.40;               // 40% annual volatility
    params.time_steps = 252;                // 1 year
    params.num_simulations = 10000;         // 10,000 simulations
    
    runMonteCarloSimulation(params, &results);
    calculateStatistics(&results);
    printResults(results, params);
    saveResultsToFile(results, &params, "results/volatile_stock_results.csv");
    
    printf("\n\n✅ All simulations completed successfully!\n");
    printf("📁 Check the 'results/' folder for detailed CSV output.\n\n");
    
    return 0;
}
