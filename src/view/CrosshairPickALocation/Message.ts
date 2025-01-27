import type { ChatMessagePF2e } from 'foundry-pf2e';
import { FVTTVersion } from '#standard/fvtt';
import MyChatMessage from './Message.svelte';

const ready = Hooks.once('ready', () => {
	// Iterate over all chat message documents potentially adding Svelte components to your specific module chat
	// messages.
	for (const message of game.messages) {
		// Find associated flag data scoped to your module ID. This is the easiest way to determine that this message is
		// associated with your module and has a Svelte component attached to the message content.
		const component = message.getFlag('pf2e-graphics', 'component') as string | undefined;

		if (component === 'CrosshairPicker' && message.flags['pf2e-graphics'] && !message.flags['pf2e-graphics']._svelteComponent) {
			// Find existing chat message element already rendered and attach Svelte component.
			const el = document.querySelector(`.message[data-message-id="${message.id}"] .message-content`);
			if (el) {
				// Add the svelte component to the message instance loaded in client side memory.
				message.flags['pf2e-graphics']._svelteComponent = new MyChatMessage({ target: el, props: { message } });
			}
		}
	}

	// @ts-expect-error I dont care
	// Scroll chat log to bottom.
	ui.chat.scrollBottom();
});

/**
 * Used by chat message demo to manually attach a Svelte component, MyChatMessage, to a chat message.
 *
 * Note: Foundry v13 changes the hook name to `renderChatMessageHTML` instead of `renderChatMessage`.
 * All AppV2 / new render hooks will pass back an HTML element and not a JQuery instance.
 *
 * Note: You must manually destroy this Svelte component in an associated `preDeleteChatMessage` like the one provided
 * below. The reason being is that you are manually / conditionally creating a Svelte component that is not monitored /
 * controlled by TRL itself, so you must also manually destroy this component when the chat message is deleted.
 */

const init = Hooks.once('init', () => {
	if (FVTTVersion.isAtLeast(13)) {
		Hooks.on('renderChatMessageHTML', (message, html) => {
			const component = message.getFlag('pf2e-graphics', 'component') as string | undefined;

			if (component === 'CrosshairPicker') {
				const el = html[0].querySelector(`.message-content`);
				if (el) {
					message.flags['pf2e-graphics']._svelteComponent = new MyChatMessage({ target: el, props: { message } });
				}
			}
		});
	} else {
		Hooks.on('renderChatMessage', (message: ChatMessagePF2e, html) => {
			const component = message.getFlag('pf2e-graphics', 'component') as string | undefined;

			if (component === 'CrosshairPicker' && message.flags['pf2e-graphics'] && !message.flags['pf2e-graphics']._svelteComponent) {
				const el = html[0].querySelector(`.message-content`);
				if (el) {
					message.flags['pf2e-graphics']._svelteComponent = new MyChatMessage({ target: el, props: { message } });
				}
			}
		});
	}
});

/**
 * Used by chat message demo to clean up / destroy the mounted Svelte component to the message instance when the chat
 * message is deleted.
 */
const preDelete = Hooks.on('preDeleteChatMessage', (message) => {
	const component = message.getFlag('pf2e-graphics', 'component') as string | undefined;

	// Also ensure that the Svelte component exists
	if (component === 'CrosshairPicker' && typeof message.flags['pf2e-graphics']._svelteComponent?.$destroy === 'function') {
		// Manually destroy Svelte component when the chat message document is being deleted.
		message.flags['pf2e-graphics']._svelteComponent.$destroy();
	}
});

if (import.meta.hot) {
	// Prevents reloads
	import.meta.hot.accept();
	// Disposes the previous hook
	import.meta.hot.dispose(() => {
		Hooks.off('preDeleteChatMessage', preDelete);
		Hooks.off('init', init);
		Hooks.off('ready', ready);
	});
}
