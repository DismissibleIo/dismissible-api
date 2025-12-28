import autocannon from 'autocannon';
import { URL } from 'url';
import * as fs from 'fs';
import * as path from 'path';

interface PerformanceConfig {
  createCount: number;
  getCount: number;
  apiUrl: string;
  connections: number;
  duration: number;
}

interface TestResult {
  phase: string;
  requests: {
    total: number;
    average: number;
    min: number;
    max: number;
  };
  latency: {
    average: number;
    min: number;
    max: number;
    p50: number;
    p90: number;
    p99: number;
    p99_9: number;
  };
  throughput: {
    average: number;
    min: number;
    max: number;
  };
  errors: number;
  timeouts: number;
  duration: number;
}

type RequestConfig = { method: string; path: string };
type SetRequestsFn = (requests: RequestConfig[]) => void;

interface AutocannonClient {
  setRequests: SetRequestsFn;
}

function createPathCycler(paths: string[]): (client: AutocannonClient) => void {
  let pathCounter = 0;

  return (client: AutocannonClient) => {
    let connectionIndex = pathCounter++;

    client.setRequests([{ method: 'GET', path: paths[connectionIndex % paths.length] }]);

    const originalSetRequests = client.setRequests.bind(client);
    client.setRequests = function (_requests: RequestConfig[]) {
      connectionIndex = (connectionIndex + 1) % paths.length;
      return originalSetRequests([{ method: 'GET', path: paths[connectionIndex] }]);
    };
  };
}

function getConfig(): PerformanceConfig {
  return {
    createCount: parseInt(process.env.PERF_CREATE_COUNT || '100', 10),
    getCount: parseInt(process.env.PERF_GET_COUNT || '100', 10),
    apiUrl: process.env.PERF_API_URL || 'http://localhost:3001',
    connections: parseInt(process.env.PERF_CONNECTIONS || '10', 10),
    duration: parseInt(process.env.PERF_DURATION || '10', 10),
  };
}

function getOutputPath(): string | null {
  return process.env.PERF_OUTPUT_PATH || null;
}

function formatNumber(num: number): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${formatNumber(size)} ${units[unitIndex]}`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${formatNumber(ms)} ms`;
  }
  return `${formatNumber(ms / 1000)} s`;
}

function printResults(result: TestResult): void {
  console.log('\n' + '='.repeat(80));
  console.log(`Phase: ${result.phase}`);
  console.log('='.repeat(80));
  console.log(`Duration: ${formatDuration(result.duration)}`);
  console.log('\n📊 Requests:');
  console.log(`  Total:     ${result.requests.total.toLocaleString()}`);
  console.log(`  Average:   ${formatNumber(result.requests.average)} req/s`);
  console.log(`  Min:       ${formatNumber(result.requests.min)} req/s`);
  console.log(`  Max:       ${formatNumber(result.requests.max)} req/s`);

  console.log('\n⏱️  Latency:');
  console.log(`  Average:   ${formatNumber(result.latency.average)} ms`);
  console.log(`  Min:       ${formatNumber(result.latency.min)} ms`);
  console.log(`  Max:       ${formatNumber(result.latency.max)} ms`);
  console.log(`  p50:       ${formatNumber(result.latency.p50)} ms`);
  console.log(`  p90:       ${formatNumber(result.latency.p90)} ms`);
  console.log(`  p99:       ${formatNumber(result.latency.p99)} ms`);
  console.log(`  p99.9:     ${formatNumber(result.latency.p99_9)} ms`);

  console.log('\n📈 Throughput:');
  console.log(`  Average:   ${formatBytes(result.throughput.average)}/s`);
  console.log(`  Min:       ${formatBytes(result.throughput.min)}/s`);
  console.log(`  Max:       ${formatBytes(result.throughput.max)}/s`);

  if (result.errors > 0 || result.timeouts > 0) {
    console.log('\n⚠️  Errors:');
    if (result.errors > 0) {
      console.log(`  Errors:    ${result.errors.toLocaleString()}`);
    }
    if (result.timeouts > 0) {
      console.log(`  Timeouts:  ${result.timeouts.toLocaleString()}`);
    }
  }

  console.log('='.repeat(80) + '\n');
}

function generateHTMLReport(results: TestResult[], config: PerformanceConfig): string {
  const timestamp = new Date().toISOString();
  const createResult = results.find((r) => r.phase === 'Create Items');
  const getResult = results.find((r) => r.phase === 'Get Items');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Performance Test Report</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
    }
    
    .header .timestamp {
      opacity: 0.9;
      font-size: 0.9em;
    }
    
    .config-section {
      background: #f8f9fa;
      padding: 30px 40px;
      border-bottom: 1px solid #e9ecef;
    }
    
    .config-section h2 {
      color: #495057;
      margin-bottom: 20px;
      font-size: 1.5em;
    }
    
    .config-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }
    
    .config-item {
      background: white;
      padding: 15px;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }
    
    .config-item label {
      display: block;
      font-size: 0.85em;
      color: #6c757d;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .config-item value {
      display: block;
      font-size: 1.2em;
      font-weight: 600;
      color: #212529;
    }
    
    .phases {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
      gap: 30px;
      padding: 40px;
    }
    
    .phase-card {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 30px;
      border: 2px solid #e9ecef;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .phase-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }
    
    .phase-card h2 {
      color: #495057;
      margin-bottom: 25px;
      font-size: 1.8em;
      border-bottom: 3px solid #667eea;
      padding-bottom: 10px;
    }
    
    .metric-section {
      margin-bottom: 30px;
    }
    
    .metric-section h3 {
      color: #6c757d;
      font-size: 1.1em;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    
    th {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 15px;
      text-align: left;
      font-weight: 600;
      font-size: 0.9em;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    td {
      padding: 12px 15px;
      border-bottom: 1px solid #e9ecef;
      color: #495057;
    }
    
    tr:last-child td {
      border-bottom: none;
    }
    
    tr:hover {
      background: #f8f9fa;
    }
    
    .value-highlight {
      font-weight: 600;
      color: #667eea;
    }
    
    .error-section {
      background: #fff3cd;
      border: 2px solid #ffc107;
      border-radius: 8px;
      padding: 20px;
      margin-top: 20px;
    }
    
    .error-section h3 {
      color: #856404;
      margin-bottom: 10px;
    }
    
    .error-section p {
      color: #856404;
      margin: 5px 0;
    }
    
    .chart-container {
      margin-top: 20px;
      position: relative;
      height: 300px;
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    
    .summary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    
    .summary h2 {
      margin-bottom: 20px;
      font-size: 2em;
    }
    
    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }
    
    .summary-stat {
      background: rgba(255, 255, 255, 0.1);
      padding: 20px;
      border-radius: 8px;
      backdrop-filter: blur(10px);
    }
    
    .summary-stat label {
      display: block;
      font-size: 0.85em;
      opacity: 0.9;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .summary-stat value {
      display: block;
      font-size: 2em;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Performance Test Report</h1>
      <div class="timestamp">Generated: ${new Date(timestamp).toLocaleString()}</div>
    </div>
    
    <div class="config-section">
      <h2>Test Configuration</h2>
      <div class="config-grid">
        <div class="config-item">
          <label>API URL</label>
          <value>${config.apiUrl}</value>
        </div>
        <div class="config-item">
          <label>Create Count</label>
          <value>${config.createCount.toLocaleString()}</value>
        </div>
        <div class="config-item">
          <label>Get Count</label>
          <value>${config.getCount.toLocaleString()}</value>
        </div>
        <div class="config-item">
          <label>Connections</label>
          <value>${config.connections}</value>
        </div>
        <div class="config-item">
          <label>Duration</label>
          <value>${config.duration}s</value>
        </div>
      </div>
    </div>
    
    <div class="phases">
      ${results
        .map(
          (result) => `
      <div class="phase-card">
        <h2>${result.phase}</h2>
        
        <div class="metric-section">
          <h3>📊 Requests</h3>
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total</td>
                <td class="value-highlight">${result.requests.total.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Average</td>
                <td class="value-highlight">${formatNumber(result.requests.average)} req/s</td>
              </tr>
              <tr>
                <td>Min</td>
                <td>${formatNumber(result.requests.min)} req/s</td>
              </tr>
              <tr>
                <td>Max</td>
                <td>${formatNumber(result.requests.max)} req/s</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="metric-section">
          <h3>⏱️ Latency</h3>
          <table>
            <thead>
              <tr>
                <th>Percentile</th>
                <th>Value (ms)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Average</td>
                <td class="value-highlight">${formatNumber(result.latency.average)}</td>
              </tr>
              <tr>
                <td>Min</td>
                <td>${formatNumber(result.latency.min)}</td>
              </tr>
              <tr>
                <td>Max</td>
                <td>${formatNumber(result.latency.max)}</td>
              </tr>
              <tr>
                <td>p50</td>
                <td>${formatNumber(result.latency.p50)}</td>
              </tr>
              <tr>
                <td>p90</td>
                <td>${formatNumber(result.latency.p90)}</td>
              </tr>
              <tr>
                <td>p99</td>
                <td>${formatNumber(result.latency.p99)}</td>
              </tr>
              <tr>
                <td>p99.9</td>
                <td>${formatNumber(result.latency.p99_9)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="metric-section">
          <h3>📈 Throughput</h3>
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Average</td>
                <td class="value-highlight">${formatBytes(result.throughput.average)}/s</td>
              </tr>
              <tr>
                <td>Min</td>
                <td>${formatBytes(result.throughput.min)}/s</td>
              </tr>
              <tr>
                <td>Max</td>
                <td>${formatBytes(result.throughput.max)}/s</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="metric-section">
          <h3>📉 Latency Distribution</h3>
          <div class="chart-container">
            <canvas id="latency-chart-${result.phase.replace(/\s+/g, '-').toLowerCase()}"></canvas>
          </div>
        </div>
        
        ${
          result.errors > 0 || result.timeouts > 0
            ? `
        <div class="error-section">
          <h3>⚠️ Errors</h3>
          ${result.errors > 0 ? `<p><strong>Errors:</strong> ${result.errors.toLocaleString()}</p>` : ''}
          ${result.timeouts > 0 ? `<p><strong>Timeouts:</strong> ${result.timeouts.toLocaleString()}</p>` : ''}
        </div>
        `
            : ''
        }
      </div>
      `,
        )
        .join('')}
    </div>
    
    <div class="summary">
      <h2>Summary</h2>
      <div class="summary-stats">
        ${
          createResult
            ? `
        <div class="summary-stat">
          <label>Create - Avg Latency</label>
          <value>${formatNumber(createResult.latency.average)}ms</value>
        </div>
        <div class="summary-stat">
          <label>Create - Requests/s</label>
          <value>${formatNumber(createResult.requests.average)}</value>
        </div>
        `
            : ''
        }
        ${
          getResult
            ? `
        <div class="summary-stat">
          <label>Get - Avg Latency</label>
          <value>${formatNumber(getResult.latency.average)}ms</value>
        </div>
        <div class="summary-stat">
          <label>Get - Requests/s</label>
          <value>${formatNumber(getResult.requests.average)}</value>
        </div>
        `
            : ''
        }
      </div>
    </div>
  </div>
  
  <script>
    const results = ${JSON.stringify(results)};
    
    results.forEach((result, index) => {
      const canvasId = 'latency-chart-' + result.phase.replace(/\\s+/g, '-').toLowerCase();
      const ctx = document.getElementById(canvasId);
      if (!ctx) return;
      
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['p50', 'p90', 'p99', 'p99.9'],
          datasets: [{
            label: 'Latency (ms)',
            data: [
              result.latency.p50,
              result.latency.p90,
              result.latency.p99,
              result.latency.p99_9
            ],
            backgroundColor: [
              'rgba(102, 126, 234, 0.8)',
              'rgba(118, 75, 162, 0.8)',
              'rgba(255, 99, 132, 0.8)',
              'rgba(255, 159, 64, 0.8)'
            ],
            borderColor: [
              'rgba(102, 126, 234, 1)',
              'rgba(118, 75, 162, 1)',
              'rgba(255, 99, 132, 1)',
              'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'Latency Percentiles',
              font: {
                size: 16,
                weight: 'bold'
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Latency (ms)'
              }
            }
          }
        }
      });
    });
  </script>
</body>
</html>`;
}

function saveHTMLReport(html: string, outputPath: string | null): string {
  const defaultPath = path.join(process.cwd(), 'perf', `performance-report-${Date.now()}.html`);
  const finalPath = outputPath || defaultPath;

  const dir = path.dirname(finalPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(finalPath, html, 'utf-8');
  return finalPath;
}

async function runCreatePhase(
  config: PerformanceConfig,
  itemIds: string[],
  userIds: string[],
): Promise<TestResult> {
  const baseUrl = new URL(config.apiUrl);
  const paths: string[] = [];

  for (let i = 0; i < config.createCount; i++) {
    const userId = userIds[i % userIds.length];
    const itemId = itemIds[i];
    paths.push(`/v1/users/${userId}/items/${itemId}`);
  }

  const instance = autocannon(
    {
      url: baseUrl.origin,
      connections: config.connections,
      duration: config.duration,
      setupClient: createPathCycler(paths) as autocannon.SetupClientFunction,
    },
    (err, _result) => {
      if (err) {
        console.error('Error during create phase:', err);
        throw err;
      }
    },
  );

  return new Promise((resolve, reject) => {
    instance.on('done', (result) => {
      const testResult: TestResult = {
        phase: 'Create Items',
        requests: {
          total: result.requests.total,
          average: result.requests.average,
          min: result.requests.min,
          max: result.requests.max,
        },
        latency: {
          average: result.latency.average,
          min: result.latency.min,
          max: result.latency.max,
          p50: result.latency.p50,
          p90: result.latency.p90,
          p99: result.latency.p99,
          p99_9: result.latency.p99_9,
        },
        throughput: {
          average: result.throughput.average,
          min: result.throughput.min,
          max: result.throughput.max,
        },
        errors: result.errors,
        timeouts: result.timeouts,
        duration: result.duration,
      };
      resolve(testResult);
    });

    instance.on('error', (err) => {
      reject(err);
    });
  });
}

async function runGetPhase(
  config: PerformanceConfig,
  itemIds: string[],
  userIds: string[],
): Promise<TestResult> {
  const baseUrl = new URL(config.apiUrl);
  const paths: string[] = [];

  const itemsToGet = Math.min(config.getCount, itemIds.length);
  for (let i = 0; i < itemsToGet; i++) {
    const userId = userIds[i % userIds.length];
    const itemId = itemIds[i];
    paths.push(`/v1/users/${userId}/items/${itemId}`);
  }

  const instance = autocannon(
    {
      url: baseUrl.origin,
      connections: config.connections,
      duration: config.duration,
      setupClient: createPathCycler(paths) as autocannon.SetupClientFunction,
    },
    (err, _result) => {
      if (err) {
        console.error('Error during get phase:', err);
        throw err;
      }
    },
  );

  return new Promise((resolve, reject) => {
    instance.on('done', (result) => {
      const testResult: TestResult = {
        phase: 'Get Items',
        requests: {
          total: result.requests.total,
          average: result.requests.average,
          min: result.requests.min,
          max: result.requests.max,
        },
        latency: {
          average: result.latency.average,
          min: result.latency.min,
          max: result.latency.max,
          p50: result.latency.p50,
          p90: result.latency.p90,
          p99: result.latency.p99,
          p99_9: result.latency.p99_9,
        },
        throughput: {
          average: result.throughput.average,
          min: result.throughput.min,
          max: result.throughput.max,
        },
        errors: result.errors,
        timeouts: result.timeouts,
        duration: result.duration,
      };
      resolve(testResult);
    });

    instance.on('error', (err) => {
      reject(err);
    });
  });
}

async function main(): Promise<void> {
  const config = getConfig();

  console.log('🚀 Performance Test Configuration:');
  console.log(`  API URL:        ${config.apiUrl}`);
  console.log(`  Create Count:   ${config.createCount.toLocaleString()}`);
  console.log(`  Get Count:      ${config.getCount.toLocaleString()}`);
  console.log(`  Connections:    ${config.connections}`);
  console.log(`  Duration:       ${config.duration}s`);
  console.log('');

  const itemIds: string[] = [];
  const userIds: string[] = [];

  for (let i = 0; i < Math.max(config.createCount, config.getCount); i++) {
    itemIds.push(`perf-test-item-${i + 1}`);
  }

  const numUsers = Math.max(10, Math.floor(config.createCount / 10));
  for (let i = 0; i < numUsers; i++) {
    userIds.push(`perf-test-user-${i + 1}`);
  }

  try {
    console.log('📝 Phase 1: Creating items...');
    const createResult = await runCreatePhase(config, itemIds, userIds);
    printResults(createResult);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log('📖 Phase 2: Getting existing items...');
    const getResult = await runGetPhase(config, itemIds, userIds);
    printResults(getResult);

    const outputPath = getOutputPath();
    const htmlReport = generateHTMLReport([createResult, getResult], config);
    const savedPath = saveHTMLReport(htmlReport, outputPath);

    console.log(`\n📄 HTML report saved to: ${savedPath}`);
    console.log('✅ Performance test completed successfully!');
  } catch (error) {
    console.error('❌ Performance test failed:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
