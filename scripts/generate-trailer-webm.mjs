import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
].filter(Boolean);

async function exists(file) {
  try {
    await readFile(file);
    return true;
  } catch {
    return false;
  }
}

async function findChrome() {
  for (const candidate of chromeCandidates) {
    if (await exists(candidate)) return candidate;
  }
  throw new Error("Chrome or Edge was not found.");
}

function wait(ms) {
  return new Promise((resolveWait) => setTimeout(resolveWait, ms));
}

async function getJsonVersion(port) {
  const response = await fetch(`http://127.0.0.1:${port}/json/version`);
  if (!response.ok) throw new Error(`Chrome debugger unavailable: ${response.status}`);
  return response.json();
}

async function getPageTarget(port) {
  const response = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" });
  if (!response.ok) throw new Error(`Chrome page target unavailable: ${response.status}`);
  return response.json();
}

async function openCdp(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  let nextId = 1;
  const pending = new Map();

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolveMessage, rejectMessage } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) rejectMessage(new Error(message.error.message));
      else resolveMessage(message.result);
    }
  });

  await new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener("open", resolveOpen, { once: true });
    socket.addEventListener("error", rejectOpen, { once: true });
  });

  return {
    send(method, params = {}) {
      const id = nextId++;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolveMessage, rejectMessage) => {
        pending.set(id, { resolveMessage, rejectMessage });
      });
    },
    close() {
      socket.close();
    }
  };
}

const trailerRecorder = String.raw`
async () => {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8" });
  const chunks = [];

  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };

  const titles = [
    "Disciples of the Inverted Cross",
    "Merchants of the Ivory Towers",
    "Rhapsodies of the Coming Regent"
  ];

  function drawFrame(t) {
    const progress = (t % 12000) / 12000;
    const titleIndex = Math.min(2, Math.floor(progress * 3));
    const local = progress * 3 - titleIndex;
    const pulse = Math.sin(t / 540) * 0.5 + 0.5;

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#48006E");
    gradient.addColorStop(0.48, "#250035");
    gradient.addColorStop(1, "#120A16");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalAlpha = 0.2 + pulse * 0.12;
    ctx.fillStyle = "#D2A94F";
    ctx.beginPath();
    ctx.arc(900 + Math.sin(t / 900) * 90, 165 + Math.cos(t / 1100) * 45, 220, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = "#D2A94F";
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i += 1) {
      const y = 180 + i * 72 + Math.sin(t / 600 + i) * 24;
      ctx.beginPath();
      ctx.moveTo(90 + i * 18, y);
      ctx.lineTo(1190 - i * 22, y - 210);
      ctx.stroke();
    }

    const fadeIn = Math.min(1, local / 0.18);
    const fadeOut = Math.min(1, (1 - local) / 0.22);
    ctx.globalAlpha = Math.max(0, Math.min(fadeIn, fadeOut));
    ctx.fillStyle = "#FFF7E6";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "82px Georgia";
    ctx.fillText(titles[titleIndex], 640, 330);

    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#D2A94F";
    ctx.font = "44px Georgia";
    ctx.fillText("Ascendance - The Trilogy", 640, 445);

    ctx.globalAlpha = 0.74;
    ctx.fillStyle = "#FFF7E6";
    ctx.font = "24px Arial";
    ctx.fillText("Presented by BrandZilla Tech Limited", 640, 504);
    ctx.globalAlpha = 1;
  }

  let started = performance.now();
  recorder.start();
  await new Promise((resolve) => {
    function frame(now) {
      drawFrame(now - started);
      if (now - started < 12000) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });

  recorder.stop();
  await new Promise((resolve) => {
    recorder.onstop = resolve;
  });

  const blob = new Blob(chunks, { type: "video/webm" });
  const reader = new FileReader();
  const dataUrl = await new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  return dataUrl.split(",")[1];
}
`;

const port = 9333;
const userDataDir = await mkdtemp(join(tmpdir(), "ascendance-chrome-"));
const chrome = await findChrome();
const output = resolve("public", "assets", "ascendance-trailer.webm");

const child = spawn(chrome, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  "about:blank"
], { stdio: "ignore" });

try {
  let version;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      version = await getJsonVersion(port);
      break;
    } catch {
      await wait(300);
    }
  }

  if (!version) throw new Error("Chrome did not start with remote debugging.");
  const target = await getPageTarget(port);
  const cdp = await openCdp(target.webSocketDebuggerUrl);
  await cdp.send("Runtime.enable");
  const result = await cdp.send("Runtime.evaluate", {
    expression: `(${trailerRecorder})()`,
    awaitPromise: true,
    returnByValue: true,
    timeout: 30000
  });

  const base64 = result.result?.value;
  if (!base64) throw new Error("Trailer generation returned no video data.");
  await mkdir(resolve("public", "assets"), { recursive: true });
  await writeFile(output, Buffer.from(base64, "base64"));
  cdp.close();
  console.log(`Generated ${output}`);
} finally {
  child.kill();
  await new Promise((resolveClose) => {
    child.once("exit", resolveClose);
    setTimeout(resolveClose, 1200);
  });
  try {
    await rm(userDataDir, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Skipped Chrome temp cleanup: ${error.message}`);
  }
}
