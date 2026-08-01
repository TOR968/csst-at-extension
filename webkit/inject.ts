const STEAMID64_BASE = BigInt('76561197960265728');
const STEAMID64_PATTERN = /^\d{17}$/;
const PROFILE_HOST_PATTERN = /(^|\.)steamcommunity\.com$/;
const PROFILE_PATH_PATTERN = /^\/(id|profiles)\//;

function asSteamId64(value: unknown): string | null {
	const id = typeof value === 'string' ? value.trim() : '';
	return STEAMID64_PATTERN.test(id) ? id : null;
}

async function getSteamId(): Promise<string | null> {
	const win = window as any;
	for (const v of [win.g_rgProfileData?.steamid64, win.g_rgProfileData?.steamid]) {
		const id = asSteamId64(v);
		if (id) return id;
	}
	const miniId = document.querySelector('[data-miniprofile]')?.getAttribute('data-miniprofile');
	if (miniId && /^\d+$/.test(miniId) && miniId !== '0') {
		try {
			const id = asSteamId64((STEAMID64_BASE + BigInt(miniId)).toString());
			if (id) return id;
		} catch { }
	}
	try {
		const xmlUrl = location.href.replace(/[?#].*/, '').replace(/\/$/, '') + '/?xml=1';
		const res = await fetch(xmlUrl);
		const text = await res.text();
		const dom = new DOMParser().parseFromString(text, 'application/xml');
		return asSteamId64(dom.querySelector('steamID64')?.textContent);
	} catch { }
	return null;
}

export function csstatInjectMain(openExternal: boolean) {
	if (document.querySelector('.csstat-extension-container')) return;
	if (!PROFILE_HOST_PATTERN.test(location.hostname)) return;
	if (!PROFILE_PATH_PATTERN.test(location.pathname)) return;

	async function inject() {
		const col = document.querySelector('.profile_rightcol');
		if (!col || col.querySelector('.csstat-extension-container')) return;

		const div = document.createElement('div');
		div.className = 'account-row csstat-extension-container';
		col.insertBefore(div, col.children[1] ?? null);

		const steamId = await getSteamId();
		if (!steamId) { console.warn('[CSST.at] No SteamID'); div.remove(); return; }

		if (!document.getElementById('csstat-extension-style')) {
			const s = document.createElement('style');
			s.id = 'csstat-extension-style';
			s.textContent = ".csstat-btn{display:flex;gap:.5rem;width:100%;height:3rem;align-items:center;justify-content:center;font-size:20px;color:#fff;font-weight:800;letter-spacing:.04em;font-family:'Motiva Sans',Arial,sans-serif;transition:all .3s cubic-bezier(.23,1,.32,1);text-transform:uppercase;background-color:#1a1a1a;border-radius:5px;cursor:pointer;text-decoration:none;border:none;outline:none;margin:10px 0}.csstat-btn:hover{background-color:#2d3748;text-decoration:none!important}.csstat-btn .dot{color:#a99cf5;transition:color .3s cubic-bezier(.23,1,.32,1)}.csstat-btn:hover .dot{color:#c4b8ff}.csstat-btn svg{height:22px;width:auto;color:#a99cf5;transition:color .3s cubic-bezier(.23,1,.32,1)}.csstat-btn:hover svg{color:#c4b8ff}";
			document.head?.appendChild(s);
		}

		const profileUrl = 'https://csst.at/profile/' + encodeURIComponent(steamId);
		const a = document.createElement('a');
		a.href = openExternal ? 'steam://openurl_external/' + profileUrl : profileUrl;
		a.className = 'csstat-btn';
		a.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="7"/><line x1="12" y1="1" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="23"/><line x1="1" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="23" y2="12"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/></svg>CSST<span class="dot">.AT</span>';
		div.appendChild(a);
	}

	if (document.querySelector('.profile_rightcol')) {
		inject();
	} else {
		const obs = new MutationObserver(() => {
			if (document.querySelector('.profile_rightcol')) {
				obs.disconnect();
				inject();
			}
		});
		obs.observe(document.documentElement, { childList: true, subtree: true });
		setTimeout(() => obs.disconnect(), 15000);
	}
}
