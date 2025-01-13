import type { Payload } from '../../schema';
import type { ArrayElement } from '../utils';
import { addCustomExecutionContext, type ExecutionContext } from '.';
import { AnimCore } from '../storage/AnimCore';

export function executeSound(payload: Extract<Payload, { type: 'sound' }>, context: ExecutionContext): Sequence {
	const seq = new Sequence();

	context = addCustomExecutionContext(payload.sources, payload.targets, context);

	for (const position of payload.position) {
		seq.addSequence(processSound(payload, context, position));
	}

	return seq;
}

function processSound(
	payload: Parameters<typeof executeSound>[0],
	context: ExecutionContext,
	_position: ArrayElement<Parameters<typeof executeSound>[0]['position']>,
): SoundSection {
	const seq = new Sequence().sound().file(AnimCore.parseFiles(payload.sound));

	if (context.label) seq.name(context.label);

	// TODO

	return seq;
}
