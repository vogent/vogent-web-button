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
  let call: VogentCall | undefined

  const inlineStyle = document.createElement("style");
  inlineStyle.textContent = `.vogent-button {
  /* Original classes */
  background-color: #0f172a;  /* Slate-900, a common primary color */
  color: #f8fafc;  /* Slate-50, a light text color for dark backgrounds */
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);  /* Default shadow */
  height: 2.25rem;  /* 9 * 0.25rem = 2.25rem (36px) */
  padding-left: 1rem;  /* 4 * 0.25rem = 1rem (16px) */
  padding-right: 1rem; /* 4 * 0.25rem = 1rem (16px) */
  padding-top: 0.5rem; /* 2 * 0.25rem = 0.5rem (8px) */
  padding-bottom: 0.5rem; /* 2 * 0.25rem = 0.5rem (8px) */
 
  cursor: pointer;
  /* Added classes */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;  /* gap-2 = 2 * 0.25rem = 0.5rem (8px) */
  white-space: nowrap;
  border-radius: 0.375rem;  /* rounded-md = 0.375rem (6px) */
  font-size: 0.875rem;  /* text-sm = 0.875rem (14px) */
  line-height: 1.25rem;  /* Part of text-sm */
  font-weight: 500;  /* font-medium = 500 */
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.vogent-button:hover {
  background-color: rgba(15, 23, 42, 0.9);  /* primary color at 90% opacity */
}

.vogent-button:disabled {
  pointer-events: none;
  opacity: 0.5;
}`
  buttonArgs.parent.append(inlineStyle)


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
    (async () => {    
      if (status === '') {
        const {
          sessionId,
          dialId,
          token,
        } = await getDialDetails()
      
        call = new VogentCall({
          sessionId,
          dialId,
          token,
        }, {
          baseUrl,
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
  
        await call.start();
        await call.connectAudio()
      } else if (status == 'in-progress') {
        await call?.hangup()
      }
    })()
  });

}


(window as any).VogentWebButton = {
  setupVogentButton,
};