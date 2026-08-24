/**
 * 상황판 시안 캡처기 — 시안을 고르는 동안만 두는 임시 도구.
 *
 * 화면이 RequireAuth 뒤에 있어 `chrome --screenshot` 만으로는 로그인 화면만 찍힌다.
 * CDP 로 origin 에 먼저 들어가 세션 키를 심고 그 다음 목표 경로로 넘어간다.
 *
 * 판이 넘치면 에러 없이 소리 없이 잘리므로, 찍는 김에 잘린 판을 함께 잰다.
 *
 * 쓰기: node scripts/capture.mjs /control /control/1
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ORIGIN = 'http://localhost:3100';
const PORT = 9333;
const OUT = 'tmp/shots';

/** 1080 신호기 기준. 창을 1080 으로 띄우면 innerHeight 가 929 로 나와 실제보다 낮게 잰다. */
const WINDOW = '1920,1231';

const SESSION = JSON.stringify({
  state: {
    user: {
      id: 'cne-admin',
      name: '김도현',
      role: 'admin',
      orgName: '충청남도교육청 교육과정평가정보원',
      department: '정보인프라부',
      email: 'admin@cne.go.kr',
      plantIds: [],
    },
    expiresAt: Date.now() + 86_400_000,
  },
  version: 0,
});

const paths = process.argv.slice(2);
if (paths.length === 0) {
  console.error('경로를 하나 이상 주세요 — node scripts/capture.mjs /control');
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`,
  `--window-size=${WINDOW}`,
  `--user-data-dir=${process.cwd()}/tmp/chrome-profile`,
  'about:blank',
], { stdio: 'ignore' });

/** CDP 소켓 하나. 보낸 명령마다 짝이 맞는 답을 기다린다. */
function connect(url) {
  const ws = new WebSocket(url);
  const waiting = new Map();
  let seq = 0;

  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    const settle = waiting.get(message.id);
    if (settle) {
      waiting.delete(message.id);
      settle(message.result);
    }
  });

  return {
    ready: new Promise((resolve) => ws.addEventListener('open', resolve)),
    send(method, params = {}) {
      const id = ++seq;
      ws.send(JSON.stringify({ id, method, params }));

      return new Promise((resolve) => waiting.set(id, resolve));
    },
    close: () => ws.close(),
  };
}

/** 디버깅 포트가 열릴 때까지 기다렸다가 첫 탭의 소켓 주소를 준다. */
async function firstTab() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = tabs.find((tab) => tab.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      /* 아직 안 떴다 */
    }
    await sleep(200);
  }
  throw new Error('CDP 포트가 열리지 않았다');
}

const cdp = connect(await firstTab());
await cdp.ready;
await cdp.send('Page.enable');
await cdp.send('Runtime.enable');

// 세션을 심으려면 먼저 그 origin 위에 서 있어야 한다.
await cdp.send('Page.navigate', { url: `${ORIGIN}/login` });
await sleep(2000);
await cdp.send('Runtime.evaluate', {
  expression: `localStorage.setItem('cne-auth', ${JSON.stringify(SESSION)})`,
});

for (const path of paths) {
  await cdp.send('Page.navigate', { url: ORIGIN + path });
  // 지도·게이지가 자리를 잡을 때까지 준다.
  await sleep(5000);

  const name = path.replace(/\W+/g, '_').replace(/^_|_$/g, '') || 'root';
  const shot = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: 1920, height: 1080, scale: 1 },
  });
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(shot.data, 'base64'));

  /* 잘린 판을 함께 잰다 — 눈으로는 "판이 좀 짧네" 로만 보여 알아채기 어렵다. */
  const probe = await cdp.send('Runtime.evaluate', {
    returnByValue: true,
    expression: `
      Array.from(document.querySelectorAll('section[aria-label]')).map((el) => ({
        name: el.getAttribute('aria-label'),
        h: Math.round(el.getBoundingClientRect().height),
        need: el.scrollHeight,
      }))
    `,
  });

  const panels = probe.result?.value ?? [];
  const clipped = panels.filter((panel) => panel.need > panel.h + 4);
  console.log(`${path} → ${OUT}/${name}.png` + (clipped.length ? `  ⚠ 잘림 ${JSON.stringify(clipped)}` : '  ok'));
  if (process.env.VERBOSE) console.log('   ', JSON.stringify(panels));
}

cdp.close();
chrome.kill();
