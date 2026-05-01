#include "monte_carlo.h"

// Box-Muller transform to generate Gaussian random numbers
float generateGaussianRandom(void) {
    static int has_spare = 0;
    static float spare;
    
    if (has_spare) {
        has_spare = 0;
        return spare;
    }
    
    has_spare = 1;
    float u = 2.0 * rand() / RAND_MAX - 1.0;
    float v = 2.0 * rand() / RAND_MAX - 1.0;
    float s = u * u + v * v;
    
    while (s >= 1.0 || s == 0.0) {
        u = 2.0 * rand() / RAND_MAX - 1.0;
        v = 2.0 * rand() / RAND_MAX - 1.0;
        s = u * u + v * v;
    }
    
    float multiplier = sqrt(-2.0 * log(s) / s);
    spare = v * multiplier;
    return u * multiplier;
}

// Main Monte Carlo simulation using Geometric Brownian Motion
void runMonteCarloSimulation(SimulationParams params, SimulationResults *results) {
    float dt = 1.0 / 252.0;  // Daily time step (252 trading days/year)
    float drift = params.expected_return * dt;
    float diffusion = params.volatility * sqrt(dt);
    
    printf("\n🚀 Starting Monte Carlo Simulation...\n");
    printf("   Initial Price: $%.2f\n", params.initial_price);
    printf("   Expected Return: %.2f%%\n", params.expected_return * 100);
    printf("   Volatility: %.2f%%\n", params.volatility * 100);
    printf("   Time Steps: %d days\n", params.time_steps);
    printf("   Simulations: %d\n\n", params.num_simulations);
    
    // Run Monte Carlo simulations
    for (int sim = 0; sim < params.num_simulations; sim++) {
        float price = params.initial_price;
        
        // Simulate daily price changes using Geometric Brownian Motion
        // dS = mu * S * dt + sigma * S * dW
        for (int t = 0; t < params.time_steps; t++) {
            float random_shock = generateGaussianRandom();
            float log_return = drift + diffusion * random_shock;
            price = price * exp(log_return);
        }
        
        results->final_prices[sim] = price;
        
        // Progress indicator
        if ((sim + 1) % 1000 == 0) {
            printf("   ✓ Completed %d simulations\n", sim + 1);
        }
    }
    
    printf("\n✅ Simulation complete!\n");
}

// Calculate statistical metrics from results
void calculateStatistics(SimulationResults *results) {
    // Find min and max
    results->min_price = results->final_prices[0];
    results->max_price = results->final_prices[0];
    results->mean_price = 0;
    
    for (int i = 0; i < MAX_SIMULATIONS; i++) {
        if (results->final_prices[i] < results->min_price) {
            results->min_price = results->final_prices[i];
        }
        if (results->final_prices[i] > results->max_price) {
            results->max_price = results->final_prices[i];
        }
        results->mean_price += results->final_prices[i];
    }
    
    results->mean_price /= MAX_SIMULATIONS;
    
    // Calculate standard deviation
    float variance = 0;
    for (int i = 0; i < MAX_SIMULATIONS; i++) {
        float diff = results->final_prices[i] - results->mean_price;
        variance += diff * diff;
    }
    variance /= MAX_SIMULATIONS;
    results->std_dev = sqrt(variance);
    
    // Sort prices for percentile calculations
    float sorted[MAX_SIMULATIONS];
    for (int i = 0; i < MAX_SIMULATIONS; i++) {
        sorted[i] = results->final_prices[i];
    }
    
    // Simple bubble sort
    for (int i = 0; i < MAX_SIMULATIONS - 1; i++) {
        for (int j = 0; j < MAX_SIMULATIONS - i - 1; j++) {
            if (sorted[j] > sorted[j + 1]) {
                float temp = sorted[j];
                sorted[j] = sorted[j + 1];
                sorted[j + 1] = temp;
            }
        }
    }
    
    // Calculate confidence intervals
    int idx_5 = (int)(MAX_SIMULATIONS * 0.05);
    int idx_95 = (int)(MAX_SIMULATIONS * 0.95);
    int idx_1 = (int)(MAX_SIMULATIONS * 0.01);
    int idx_99 = (int)(MAX_SIMULATIONS * 0.99);
    
    results->confidence_95_lower = sorted[idx_5];
    results->confidence_95_upper = sorted[idx_95];
    results->confidence_99_lower = sorted[idx_1];
    results->confidence_99_upper = sorted[idx_99];
    
    // Calculate Value at Risk (95%)
    results->value_at_risk = results->mean_price - results->confidence_95_lower;
    
    // Calculate probability of profit/loss
    int profit_count = 0;
    for (int i = 0; i < MAX_SIMULATIONS; i++) {
        if (results->final_prices[i] > results->final_prices[0]) {
            profit_count++;
        }
    }
    results->prob_profit = (float)profit_count / MAX_SIMULATIONS * 100;
    results->prob_loss = 100 - results->prob_profit;
}

// Print results to console
void printResults(SimulationResults results, SimulationParams params) {
    printf("\n");
    printf("╔════════════════════════════════════════════════════════════╗\n");
    printf("║         MONTE CARLO SIMULATION RESULTS                    ║\n");
    printf("╚════════════════════════════════════════════════════════════╝\n\n");
    
    printf("📊 PRICE STATISTICS:\n");
    printf("   Initial Price:          $%.2f\n", params.initial_price);
    printf("   Mean Final Price:       $%.2f\n", results.mean_price);
    printf("   Minimum Price:          $%.2f\n", results.min_price);
    printf("   Maximum Price:          $%.2f\n", results.max_price);
    printf("   Standard Deviation:     $%.2f\n\n", results.std_dev);
    
    printf("📈 CONFIDENCE INTERVALS:\n");
    printf("   95%% CI: [$%.2f - $%.2f]\n", results.confidence_95_lower, results.confidence_95_upper);
    printf("   99%% CI: [$%.2f - $%.2f]\n\n", results.confidence_99_lower, results.confidence_99_upper);
    
    printf("💰 PROFIT/LOSS ANALYSIS:\n");
    printf("   Probability of Profit:  %.2f%%\n", results.prob_profit);
    printf("   Probability of Loss:    %.2f%%\n", results.prob_loss);
    printf("   Value at Risk (95%%):    $%.2f\n\n", results.value_at_risk);
    
    printf("📉 RETURNS:\n");
    float expected_return = ((results.mean_price - params.initial_price) / params.initial_price) * 100;
    float best_return = ((results.max_price - params.initial_price) / params.initial_price) * 100;
    float worst_return = ((results.min_price - params.initial_price) / params.initial_price) * 100;
    
    printf("   Expected Return:       %.2f%%\n", expected_return);
    printf("   Best Case Return:      %.2f%%\n", best_return);
    printf("   Worst Case Return:     %.2f%%\n\n", worst_return);
}

// Save results to CSV file
void saveResultsToFile(SimulationResults results, SimulationParams params, const char *filename) {
    FILE *file = fopen(filename, "w");
    
    if (file == NULL) {
        printf("Error opening file %s\n", filename);
        return;
    }
    
    fprintf(file, "Monte Carlo Simulation Results\n");
    fprintf(file, "Initial Price,%.2f\n", params.initial_price);
    fprintf(file, "Expected Return,%.2f%%\n", params.expected_return * 100);
    fprintf(file, "Volatility,%.2f%%\n\n", params.volatility * 100);
    
    fprintf(file, "Statistical Metrics\n");
    fprintf(file, "Mean Final Price,%.2f\n", results.mean_price);
    fprintf(file, "Min Price,%.2f\n", results.min_price);
    fprintf(file, "Max Price,%.2f\n", results.max_price);
    fprintf(file, "Standard Deviation,%.2f\n", results.std_dev);
    fprintf(file, "Value at Risk (95%%),%.2f\n", results.value_at_risk);
    fprintf(file, "Probability of Profit,%.2f%%\n\n", results.prob_profit);
    
    fprintf(file, "Final Prices\n");
    for (int i = 0; i < MAX_SIMULATIONS; i++) {
        fprintf(file, "%.2f\n", results.final_prices[i]);
    }
    
    fclose(file);
    printf("✓ Results saved to %s\n", filename);
}
