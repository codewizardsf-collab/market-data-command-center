import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createMarketSimulator } from "./src/market-simulator.mjs";
import { buildOrderBook } from "./src/order-book.mjs";
import { calculatePortfolio, defaultPositions } from "./src/pnl.mjs";
import { calculateRiskSnapshot } from "./src/risk.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const port = Number(process.env.PORT ?? 5177);
const simulator = createMarketSimulator();
const clients = new Set();
let latestSnapshot = simulator.nextSnapshot();

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (url.pathname === "/api/health") {
      return sendJson(response, { status: "healthy", checkedAt: new Date().toISOString() });
    }

    if (url.pathname === "/api/portfolio") {
      return sendPortfolio(response);
    }

    if (url.pathname === "/api/order-book") {
      const symbol = url.searchParams.get("symbol") ?? "AAPL";
      const tick = latestSnapshot.ticks.find(item => item.symbol === symbol) ?? latestSnapshot.ticks[0];
      return sendJson(response, buildOrderBook(tick.symbol, tick.price));
    }

    if (url.pathname === "/events") {
      response.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive",
        "x-accel-buffering": "no"
      });
      response.write(`event: snapshot\ndata: ${JSON.stringify(enrichSnapshot(latestSnapshot))}\n\n`);
      clients.add(response);
      request.on("close", () => clients.delete(response));
      return;
    }

    return sendStatic(url.pathname, response);
  } catch (error) {
    console.error(error);
    return sendJson(response, { error: "internal_server_error" }, 500);
  }
});

const timer = setInterval(() => {
  latestSnapshot = simulator.nextSnapshot();
  const payload = JSON.stringify(enrichSnapshot(latestSnapshot));

  for (const client of clients) {
    client.write(`event: snapshot\ndata: ${payload}\n\n`);
  }
}, 1000);

server.on("close", () => clearInterval(timer));

server.listen(port, () => {
  console.log(`Market Data Command Center running at http://localhost:${port}`);
});

function enrichSnapshot(snapshot) {
  const portfolio = calculatePortfolio(defaultPositions, simulator.currentPrices(), simulator.previousClosePrices());
  const risk = calculateRiskSnapshot(portfolio);
  return { ...snapshot, portfolio, risk };
}

function sendPortfolio(response) {
  return sendJson(response, calculatePortfolio(defaultPositions, simulator.currentPrices(), simulator.previousClosePrices()));
}

async function sendStatic(requestPath, response) {
  const normalizedPath = requestPath === "/" ? "/index.html" : requestPath;
  const safePath = path.normalize(normalizedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(publicDir, safePath);

  if (!filePath.startsWith(publicDir)) {
    return sendJson(response, { error: "invalid_path" }, 400);
  }

  try {
    const content = await readFile(filePath);
    response.writeHead(200, { "content-type": contentType(filePath) });
    response.end(content);
  } catch {
    sendJson(response, { error: "not_found" }, 404);
  }
}

function sendJson(response, payload, statusCode = 200) {
  response.writeHead(statusCode, { "content-type": "application/json" });
  response.end(JSON.stringify(payload));
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  return "application/octet-stream";
}
