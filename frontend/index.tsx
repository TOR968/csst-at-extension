import { definePlugin } from '@steambrew/client';
import { INJECTION_CODE } from './inject';

const PROFILE_URL_PATTERN = /steamcommunity\.com\/(id|profiles)\//;

async function setupCommunityInjection() {
	const CDP = (window as any).MILLENNIUM_API?.ChromeDevToolsProtocol;
	if (!CDP) { console.error('[CSST.at] No CDP available'); return; }

	await CDP.send('Target.setDiscoverTargets', { discover: true });

	const pending = new Map<string, ReturnType<typeof setTimeout>>();

	const injectIntoTarget = async (targetId: string) => {
		const res = await CDP.send('Target.attachToTarget', { targetId, flatten: true });
		const sessionId = res?.sessionId;
		if (!sessionId) return;
		await CDP.send('Runtime.evaluate', { expression: INJECTION_CODE, awaitPromise: true }, sessionId);
	};

	const processTarget = (targetInfo: any) => {
		const url: string = targetInfo?.url ?? '';
		if (!PROFILE_URL_PATTERN.test(url)) return;
		const targetId: string = targetInfo.targetId;
		clearTimeout(pending.get(targetId));
		pending.set(targetId, setTimeout(() => {
			pending.delete(targetId);
			injectIntoTarget(targetId).catch(e => console.error('[CSST.at] injection error:', e));
		}, 200));
	};

	CDP.on('Target.targetCreated', (e: any) => processTarget(e?.targetInfo));
	CDP.on('Target.targetInfoChanged', (e: any) => processTarget(e?.targetInfo));

	const { targetInfos } = await CDP.send('Target.getTargets', {});
	for (const t of targetInfos ?? []) processTarget(t);
}

const CsstIcon = () => (
	<svg style={{ height: '1em' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#a99cf5" strokeWidth="2" strokeLinecap="round">
		<circle cx="12" cy="12" r="7" />
		<line x1="12" y1="1" x2="12" y2="6" />
		<line x1="12" y1="18" x2="12" y2="23" />
		<line x1="1" y1="12" x2="6" y2="12" />
		<line x1="18" y1="12" x2="23" y2="12" />
		<circle cx="12" cy="12" r="1.4" fill="#a99cf5" stroke="none" />
	</svg>
);

export default definePlugin(() => {
	setupCommunityInjection().catch(e => console.error('[CSST.at] setup error:', e));
	return { name: 'csst-at-extension', title: 'CSST.at Extension', icon: <CsstIcon /> };
});
