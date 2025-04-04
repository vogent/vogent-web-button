import './style.css'
import { VogentCall, dialStatusIsComplete } from "@vogent/vogent-web-client";

const baseUrl = 'https://api.getelto.com';

// type VogentDial = {
//   dialToken: string;
//   dialId: string;
//   sessionId: string;
// }

// IMPORTANT: Make sure to replace this with a server-side implementation. You
// should not expose your API keys to the client.
// async function createBrowserDial() {
//   const res = await fetch(`${baseUrl}/api/dials`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${import.meta.env.VITE_VOGENT_API_KEY}`,
//     },
//     body: JSON.stringify({
//       browserCall: true,
//       callAgentId: import.meta.env.VITE_CALL_AGENT_ID,
//     }),
//   });

//   const dial = await res.json() as VogentDial;

//   return dial;
// }

async function setupVogentButton({
  buttonArgs,
  getDialDetails,
}: {
  buttonArgs: {
    parent: HTMLElement;
    preCallText?: string;
    inProgressText?: string;
    completeText?: string;
    style?: Record<string, string>;
  },
  getDialDetails: () => Promise<{
    sessionId: string;
    dialId: string;
    token: string;
  }>
}) {
  const {
    sessionId,
    dialId,
    token,
  } = await getDialDetails()

  const call = new VogentCall({
    sessionId,
    dialId,
    token,
  }, {
    baseUrl,
  });

  const button = document.createElement('button');
  button.className = 'vogent-button';
  button.textContent = buttonArgs.preCallText || 'Make Call';
  if (buttonArgs.style) {
    for (const [key, value] of Object.entries(buttonArgs.style)) {
      button.style.setProperty(key, value);
    }
  }

  buttonArgs.parent.appendChild(button);
  let status = ''

  button.addEventListener('click', () => {
    if (status === '') {
      (async () => {
        await call.start();
        await call.connectAudio()
      })()
    } else if (status == 'in-progress') {
      (async () => {
        await call.hangup()
      })()
    }
  });

  call.on('status', (s: string) => {
    status = s

    if (dialStatusIsComplete(s)) {
      button.textContent = buttonArgs.completeText || "Call Complete"
      button.disabled = true
    } else if (s == "in-progress") {
      button.textContent = buttonArgs.inProgressText || "Hangup"
    } else if (s == "queued") {
      button.textContent = "Queued" 
    }
  });
}


(window as any).VogentWebButton = {
  setupVogentButton,
};