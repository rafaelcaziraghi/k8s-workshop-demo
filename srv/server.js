/**
 * K3s Workshop Demo — Custom CAP Server
 *
 * This extends the default CAP server with custom Express routes
 * that demonstrate Kubernetes deployment concepts:
 * - Health checks (liveness & readiness probes)
 * - Direct PostgreSQL connectivity test (via raw pg Pool)
 * - Internal service communication (K8s DNS)
 * - External API access (via corporate proxy + undici)
 * - Environment variable configuration
 *
 * CAP handles:
 * - OData service at /odata/v4/workshop (Notes, Participants)
 * - Database schema deployment (auto-creates tables)
 * - Serving the OpenUI5 frontend from app/
 *
 * Custom API routes are mounted under /api/*.
 */

const cds = require('@sap/cds');
const { ProxyAgent } = require('undici');

// ============================================
// Proxy Setup for External Requests
// ============================================
// Node.js native fetch() does NOT respect HTTP_PROXY env vars.
// We must create an explicit ProxyAgent from undici.
// ============================================
let proxyDispatcher = null;
if (process.env.HTTPS_PROXY || process.env.HTTP_PROXY) {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  proxyDispatcher = new ProxyAgent(proxyUrl);
  console.log(`Proxy configured: ${proxyUrl}`);
}

// ============================================
// Configuration from Environment Variables
// ============================================
const config = {
  appName: process.env.APP_NAME || 'k8s-workshop-demo',
  appVersion: process.env.APP_VERSION || '1.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  featureGreeting: process.env.FEATURE_GREETING || 'Hello from Kubernetes!',
  featureColor: process.env.FEATURE_COLOR || '#2196F3',
  internalServiceUrl: process.env.INTERNAL_SERVICE_URL || null,
  externalApiUrl: process.env.EXTERNAL_API_URL || null,
  n8nChatUrl: process.env.N8N_CHAT_URL || 'https://n8n-dev.container.dev.local/webhook/0a7daf42-4283-4b04-8b1a-4a0d60186e49/chat',
  // Raw PG Pool config (for K8s connectivity demo, separate from CAP's DB)
  dbHost: process.env.DB_HOST || null,
  dbPort: parseInt(process.env.DB_PORT || '5432'),
  dbName: process.env.DB_NAME || 'workshop',
  dbUser: process.env.DB_USER || 'workshop_user',
  dbPassword: process.env.DB_PASSWORD || '',
};

// ============================================
// Raw PG Pool (for K8s connectivity demo)
// ============================================
// This is separate from CAP's managed DB connection.
// It demonstrates direct PostgreSQL connectivity via
// K8s DNS (postgres.data.svc.cluster.local).
// ============================================
const { Pool } = require('pg');
let pgPool = null;
let pgConnected = false;

if (config.dbHost) {
  pgPool = new Pool({
    host: config.dbHost,
    port: config.dbPort,
    database: config.dbName,
    user: config.dbUser,
    password: config.dbPassword,
    max: 3,
    connectionTimeoutMillis: 5000,
  });
  pgPool.query('SELECT NOW()')
    .then(() => {
      pgConnected = true;
      console.log(`Raw PG Pool connected: ${config.dbHost}:${config.dbPort}/${config.dbName}`);
    })
    .catch(err => console.error(`Raw PG Pool failed: ${err.message}`));
}

// ============================================
// CDS Bootstrap — Add Custom Routes
// ============================================
cds.on('bootstrap', (app) => {

  // --- Health Check (K8s liveness & readiness probes) ---
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    });
  });

  // --- API: App Info ---
  app.get('/api/info', (req, res) => {
    res.json({
      app: config.appName,
      version: config.appVersion,
      environment: config.nodeEnv,
      hostname: require('os').hostname(),
      uptime: Math.floor(process.uptime()),
      database: {
        // Raw PG Pool (K8s demo)
        pgPool: {
          configured: !!config.dbHost,
          connected: pgConnected,
          host: config.dbHost,
        },
        // CAP managed DB
        cap: {
          kind: cds.db?.kind || 'not connected',
          ready: !!cds.db,
        },
      },
      odata: '/odata/v4/workshop',
      features: {
        greeting: config.featureGreeting,
        color: config.featureColor,
      },
      proxy: {
        configured: !!proxyDispatcher,
        httpProxy: process.env.HTTP_PROXY || null,
      },
      n8nChatUrl: config.n8nChatUrl,
    });
  });

  // --- API: Direct DB Test (raw PG Pool — K8s connectivity demo) ---
  app.get('/api/db/test', async (req, res) => {
    if (!pgPool) {
      return res.status(503).json({
        status: 'not_configured',
        message: 'Raw PG Pool not configured. Set DB_HOST env var (e.g., postgres.data.svc.cluster.local).',
      });
    }
    try {
      const result = await pgPool.query(`
        SELECT NOW() as server_time,
               current_database() as database,
               current_user as "user",
               version() as pg_version
      `);
      res.json({ status: 'ok', source: 'raw-pg-pool', data: result.rows[0] });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // --- API: CAP DB Test (managed by CDS) ---
  app.get('/api/db/cap', async (req, res) => {
    try {
      if (!cds.db) {
        return res.status(503).json({
          status: 'not_connected',
          message: 'CAP DB not connected yet. Check CDS_REQUIRES_DB_* env vars.',
        });
      }
      const { Notes, Participants } = cds.entities('workshop');
      const noteCount = await SELECT.from(Notes).columns('count(*) as count');
      const participantCount = await SELECT.from(Participants).columns('count(*) as count');
      res.json({
        status: 'ok',
        source: 'cap-cds',
        kind: cds.db.kind,
        entities: {
          notes: noteCount[0]?.count || 0,
          participants: participantCount[0]?.count || 0,
        },
        odataUrl: '/odata/v4/workshop',
      });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // --- API: Internal Service Test (K8s DNS) ---
  app.get('/api/net/internal', async (req, res) => {
    if (!config.internalServiceUrl) {
      return res.json({
        status: 'not_configured',
        message: 'Set INTERNAL_SERVICE_URL env var (e.g., http://n8n.services.svc.cluster.local:5678/healthz)',
      });
    }
    try {
      const start = Date.now();
      const response = await fetch(config.internalServiceUrl);
      const elapsed = Date.now() - start;
      const body = await response.text();
      res.json({
        status: 'ok',
        url: config.internalServiceUrl,
        responseCode: response.status,
        responseTime: `${elapsed}ms`,
        body: body.substring(0, 500),
      });
    } catch (err) {
      res.status(500).json({
        status: 'error',
        url: config.internalServiceUrl,
        message: err.message,
      });
    }
  });

  // --- API: External API Test (Proxy) ---
  app.get('/api/net/external', async (req, res) => {
    const url = config.externalApiUrl || 'https://httpbin.org/get';
    try {
      const start = Date.now();
      const fetchOptions = proxyDispatcher ? { dispatcher: proxyDispatcher } : {};
      const response = await fetch(url, fetchOptions);
      const elapsed = Date.now() - start;
      const body = await response.text();
      res.json({
        status: 'ok',
        url: url,
        responseCode: response.status,
        responseTime: `${elapsed}ms`,
        proxyConfigured: !!proxyDispatcher,
        body: body.substring(0, 500),
      });
    } catch (err) {
      res.json({
        status: 'error',
        url: url,
        message: err.message,
        hint: proxyDispatcher
          ? 'Proxy dispatcher is configured but request failed. The external service may be down.'
          : 'No HTTP_PROXY configured. External requests need the corporate proxy (http://10.55.0.55:80).',
      });
    }
  });

  // --- API: DNS Resolution Test ---
  app.get('/api/net/dns', async (req, res) => {
    const dns = require('dns').promises;
    const targets = [
      'postgres.data.svc.cluster.local',
      'n8n.services.svc.cluster.local',
      'registry.platform.svc.cluster.local',
      'kubernetes.default.svc.cluster.local',
    ];
    const results = [];
    for (const target of targets) {
      try {
        const addresses = await dns.resolve4(target);
        results.push({ hostname: target, status: 'resolved', ip: addresses[0] });
      } catch (err) {
        results.push({ hostname: target, status: 'failed', error: err.code });
      }
    }
    res.json({ results });
  });

  // --- Serve static UI files from app/ ---
  const path = require('path');
  app.use('/app', require('express').static(path.join(__dirname, '..', 'app')));
  app.use('/', require('express').static(path.join(__dirname, '..', 'app')));

  // --- Redirect root to dashboard ---
  app.get('/', (req, res) => res.redirect('/app/index.html'));
});

module.exports = cds.server;
