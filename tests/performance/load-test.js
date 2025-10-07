/**
 * k6 Load Testing Script for SETIQUE API
 * 
 * Install k6: https://k6.io/docs/get-started/installation/
 * Run: k6 run tests/performance/load-test.js
 * 
 * This tests API endpoint performance under load
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 20 },   // Stay at 20 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    errors: ['rate<0.1'],              // Error rate should be below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5173';

export default function () {
  // Test homepage
  let res = http.get(`${BASE_URL}/`);
  check(res, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loads in <500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);

  // Test marketplace
  res = http.get(`${BASE_URL}/marketplace`);
  check(res, {
    'marketplace status is 200': (r) => r.status === 200,
    'marketplace loads in <1s': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);

  sleep(1);

  // Test API endpoint (if you have public endpoints)
  // res = http.get(`${BASE_URL}/.netlify/functions/your-function`);
  // check(res, {
  //   'API status is 200': (r) => r.status === 200,
  //   'API responds in <200ms': (r) => r.timings.duration < 200,
  // }) || errorRate.add(1);

  sleep(1);
}

/**
 * Setup function - runs once before all VUs
 */
export function setup() {
  console.log(`Starting load test against ${BASE_URL}`);
  return { timestamp: Date.now() };
}

/**
 * Teardown function - runs once after all VUs complete
 */
export function teardown(data) {
  const duration = (Date.now() - data.timestamp) / 1000;
  console.log(`Load test completed in ${duration}s`);
}
