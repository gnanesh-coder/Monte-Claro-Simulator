#ifndef MONTE_CARLO_H
#define MONTE_CARLO_H

#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <time.h>

#define MAX_SIMULATIONS 10000
#define MAX_DAYS 252  // Trading days in a year
#define NUM_BINS 100  // For histogram

// Structure to store simulation parameters
typedef struct {
    float initial_price;      // Starting stock price
    float expected_return;    // Annual expected return (mu)
    float volatility;         // Annual volatility (sigma)
    int time_steps;           // Number of days to simulate
    int num_simulations;      // Number of Monte Carlo runs
} SimulationParams;

// Structure to store results
typedef struct {
    float final_prices[MAX_SIMULATIONS];
    float min_price;
    float max_price;
    float mean_price;
    float std_dev;
    float confidence_95_lower;
    float confidence_95_upper;
    float confidence_99_lower;
    float confidence_99_upper;
    float prob_profit;        // Probability of profit
    float prob_loss;          // Probability of loss
    float value_at_risk;      // 95% VaR
} SimulationResults;

// Function declarations
void runMonteCarloSimulation(SimulationParams params, SimulationResults *results);
float generateGaussianRandom(void);
void calculateStatistics(SimulationResults *results);
void printResults(SimulationResults results, SimulationParams params);
void saveResultsToFile(SimulationResults results, SimulationParams params, const char *filename);

#endif
