import { useState } from 'react';
import { definePlugin, ToggleField } from '@steambrew/client';
import { initSettings, getSettings, saveSettings } from './services/settings';

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

const Settings = () => {
	const [openExternal, setOpenExternal] = useState<boolean>(getSettings().openExternal);

	const onToggle = (checked: boolean) => {
		setOpenExternal(checked);
		void saveSettings({ ...getSettings(), openExternal: checked });
	};

	return (
		<ToggleField
			label="Open in external browser"
			description="csst.at is behind Cloudflare, which blocks Steam's in-app browser. Turn this off to open profiles inside Steam instead. Reopen profile pages to apply changes."
			checked={openExternal}
			onChange={onToggle}
		/>
	);
};

export default definePlugin(async () => {
	await initSettings();
	return { name: 'csst-at-extension', title: 'CSST.at Extension', icon: <CsstIcon />, content: <Settings /> };
});
