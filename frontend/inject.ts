function csstatInjectMain() {
	if (document.querySelector('.csstat-extension-container')) return;
	if (!/steamcommunity\.com\/(id|profiles)\//.test(location.href)) return;

	const STEAMID64_BASE = BigInt('76561197960265728');

	async function getSteamId() {
		const win = window as any;
		const candidates = [win.g_rgProfileData?.steamid64, win.g_rgProfileData?.steamid];
		for (const v of candidates) {
			if (typeof v === 'string' && v !== '0' && v.trim()) return v.trim();
		}
		const miniId = document.querySelector('[data-miniprofile]')?.getAttribute('data-miniprofile');
		if (miniId && miniId !== '0') {
			try { return (STEAMID64_BASE + BigInt(miniId)).toString(); } catch { /* ignore */ }
		}
		try {
			const xmlUrl = location.href.replace(/[?#].*/, '').replace(/\/$/, '') + '/?xml=1';
			const res = await fetch(xmlUrl);
			const text = await res.text();
			const dom = new DOMParser().parseFromString(text, 'application/xml');
			const id = dom.querySelector('steamID64')?.textContent;
			if (id && id !== '0') return id;
		} catch { /* ignore */ }
		return null;
	}

	async function inject() {
		const col = document.querySelector('.profile_rightcol');
		if (!col || col.querySelector('.csstat-extension-container')) return;
		const steamId = await getSteamId();
		if (!steamId) { console.warn('[CSST.at] No SteamID'); return; }

		if (!document.getElementById('csstat-extension-style')) {
			const s = document.createElement('style');
			s.id = 'csstat-extension-style';
			s.textContent = ".csstat-btn{display:flex;gap:.5rem;width:100%;height:3rem;align-items:center;justify-content:center;font-size:20px;color:#fff;font-weight:800;letter-spacing:.04em;font-family:'Motiva Sans',Arial,sans-serif;transition:all .3s cubic-bezier(.23,1,.32,1);text-transform:uppercase;background-color:#21242f;border-radius:5px;cursor:pointer;text-decoration:none;border:none;outline:none;margin:10px 0}.csstat-btn:hover{background-color:#2c3042;text-decoration:none!important}.csstat-btn .dot{color:#a99cf5;transition:color .3s cubic-bezier(.23,1,.32,1)}.csstat-btn:hover .dot{color:#c4b8ff}.csstat-btn svg{height:22px;width:auto;color:#a99cf5;transition:color .3s cubic-bezier(.23,1,.32,1)}.csstat-btn:hover svg{color:#c4b8ff}";
			document.head?.appendChild(s);
		}

		const div = document.createElement('div');
		div.className = 'account-row csstat-extension-container';
		const a = document.createElement('a');
		a.href = 'https://csst.at/profile/' + steamId;
		a.className = 'csstat-btn';
		a.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="7"/><line x1="12" y1="1" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="23"/><line x1="1" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="23" y2="12"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/></svg>CSST<span class="dot">.AT</span>';
		div.appendChild(a);
		col.insertBefore(div, col.children[1] ?? null);
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

export const INJECTION_CODE = `(${csstatInjectMain.toString()})()`;
