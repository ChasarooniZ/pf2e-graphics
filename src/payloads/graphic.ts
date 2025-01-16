import type { TokenPF2e } from 'foundry-pf2e';
import type { Payload } from '../../schema';
import type { EffectiveSize } from '../extensions';
import {
	addCustomExecutionContext,
	type ExecutionContext,
	offsetToVector2,
	parseMinMaxObject,
	positionToArgument,
} from '.';
import { AnimCore } from '../storage/AnimCore';
import { type ArrayElement, ErrorMsg, getDefaultSize } from '../utils';

export function executeGraphic(payload: Extract<Payload, { type: 'graphic' }>, context: ExecutionContext): Sequence {
	const seq = new Sequence();

	context = addCustomExecutionContext(payload.sources, payload.targets, context);

	for (const position of payload.position) {
		seq.addSequence(processGraphic(payload, context, position));
	}

	return seq;
}

function processGraphic(
	payload: Parameters<typeof executeGraphic>[0],
	context: ExecutionContext,
	position: ArrayElement<Parameters<typeof executeGraphic>[0]['position']>,
): EffectSection {
	// TODO: Handling of `.copySprite()` and antialiasing
	const seq = new Sequence().effect().file(AnimCore.parseFiles(payload.graphic));

	if (context.label) seq.name(context.label);

	if (position.type === 'screenSpace') {
		seq.screenSpace();
		if (position.aboveUI) seq.screenSpaceAboveUI();
		if (position.anchor) seq.screenSpaceAnchor(offsetToVector2(position.anchor));
		if (position.offset) seq.screenSpacePosition(offsetToVector2(position.offset));
	} else {
		// #region Common (`positionBaseObject`) properties
		if (position.missed) seq.missed();
		if (position.spriteOffset) {
			seq.spriteOffset(offsetToVector2(position.spriteOffset), {
				gridUnits: position.spriteOffset.gridUnits ?? false,
			});
		}
		const options: Parameters<typeof seq.attachTo>[1] = {
			randomOffset: position.randomOffset ?? 0,
			offset: offsetToVector2(position.offset),
			local: position.local ?? false,
			gridUnits: position.gridUnits ?? false,
		};
		// #endregion
		if (position.type === 'static') {
			seq.atLocation(positionToArgument(position.location, context), options);
			if (position.moveTowards) {
				seq.moveTowards(
					positionToArgument(position.moveTowards.target, context),
					// @ts-expect-error TODO: Sequencer type should only have `ease`, no `target`
					{ ease: position.moveTowards.ease ?? 'linear' },
				);
				if (position.moveTowards.speed) seq.moveSpeed(position.moveTowards.speed);
			}
		} else if (position.type === 'dynamic') {
			if (position.align) options.align = position.align;
			if (position.edge) options.edge = position.edge;
			options.bindVisibility = !position.unbindVisibility;
			options.bindAlpha = !position.unbindAlpha;
			// @ts-expect-error TODO: sequencer types (documentation sometimes uses `followRotation`?)
			options.bindRotation = !position.ignoreRotation;
			options.bindScale = !position.unbindScale;
			options.bindElevation = !position.unbindElevation;
			seq.attachTo(positionToArgument(position.location, context), options);
		} else {
			throw ErrorMsg.send('pf2e-graphics.execute.common.error.unknownDiscriminatedUnionValue', {
				payloadType: 'graphic',
				property: 'position[].type',
			});
		}
	}

	if (payload.syncGroup) seq.syncGroup(payload.syncGroup);

	if (payload.users) seq.forUsers(payload.users);

	if (payload.duration) seq.duration(payload.duration);

	if (payload.probability) seq.playIf(() => Math.random() < payload.probability!);

	if (payload.delay) seq.delay(...parseMinMaxObject(payload.delay));

	if (payload.persistent)
		seq.persist(!!payload.persistent, { persistTokenPrototype: payload.persistent === 'tokenPrototype' });

	if (payload.tieToDocuments && context.item) seq.tieToDocuments(context.item);

	if (payload.waitUntilFinished) seq.waitUntilFinished(...parseMinMaxObject(payload.waitUntilFinished));

	if (payload.repeats) {
		seq.repeats(payload.repeats.count, ...parseMinMaxObject(payload.repeats.delay ?? 0));
		if (payload.repeats.async) seq.async();
	}

	if (payload.reflection) {
		if (payload.reflection.x === 'always') {
			seq.mirrorX();
		} else if (payload.reflection.x === 'random') {
			seq.randomizeMirrorX();
		}
		if (payload.reflection.y === 'always') {
			seq.mirrorY();
		} else if (payload.reflection.y === 'random') {
			seq.randomizeMirrorY();
		}
	}

	if (payload.rotation && payload.rotation.type !== 'directed') {
		// #region Common (`rotationBaseObject`) properties
		if (payload.rotation.spinIn) {
			seq.rotateIn(
				payload.rotation.spinIn.initialAngle,
				payload.rotation.spinIn.duration,
				payload.rotation.spinIn,
			);
		}
		if (payload.rotation.spinOut) {
			seq.rotateOut(
				payload.rotation.spinOut.finalAngle,
				payload.rotation.spinOut.duration,
				payload.rotation.spinOut,
			);
		}
		if (payload.rotation.spriteAngle) {
			if (typeof payload.rotation.spriteAngle === 'number') {
				seq.spriteRotation(payload.rotation.spriteAngle);
			} else if (payload.rotation.spriteAngle === 'random') {
				// @ts-expect-error TODO: add Sequencer type
				seq.randomSpriteRotation();
			} else if (payload.rotation.spriteAngle === 'none') {
				seq.zeroSpriteRotation();
			} else {
				throw ErrorMsg.send('pf2e-graphics.execute.common.error.unknownDiscriminatedUnionValue', {
					payloadType: 'graphic',
					property: 'rotation.spriteAngle',
				});
			}
		}
		// #endregion
		if (payload.rotation.type === 'absolute') {
			if (payload.rotation.angle) {
				if (payload.rotation.angle === 'random') {
					seq.randomRotation();
				} else {
					seq.rotate(payload.rotation.angle);
				}
			}
		} else if (payload.rotation.type === 'relative') {
			seq.rotateTowards(positionToArgument(payload.rotation.target, context), {
				...payload.rotation,
				attachTo: payload.rotation.attach ?? false,
				offset: offsetToVector2(payload.rotation.offset), // TODO: Wtf? This removes atLocation's offset.
			});
		} else {
			throw ErrorMsg.send('pf2e-graphics.execute.common.error.unknownDiscriminatedUnionValue', {
				payloadType: 'graphic',
				property: 'rotation.type',
			});
		}
	}

	if (payload.visibility) {
		if (payload.visibility.opacity) seq.opacity(payload.visibility.opacity);
		if (payload.visibility.ignoreTokenVision) seq.xray(payload.visibility.ignoreTokenVision);
		if (payload.visibility.mask) {
			const masking = payload.visibility.mask.map((x) => {
				if (x === 'SOURCES') return context.sources;
				if (x === 'TARGETS') return context.targets;
				if (typeof x === 'string') return x;
				throw ErrorMsg.send('pf2e-graphics.execute.common.error.unknownEnumArrayElement', {
					payloadType: 'graphic',
					property: 'visibility.mask',
				});
			});
			seq.mask(masking);
		}
	}

	if (payload.size) {
		if (payload.size.type === 'directed') {
			const options: Parameters<typeof seq.stretchTo>[1] = {
				attachTo: payload.size.attach ?? false,
				onlyX: payload.size.stretch ?? false,
				tiling: payload.size.tile ?? false,
				// TODO: @Spappz Add randomOffset and the remaining options here.
			};

			if (payload.size.requiresLineOfSight) {
				options.requiresLineOfSight = true;
				if (payload.size.requiresLineOfSight === 'hide') {
					options.hideLineOfSight = true;
				} else if (payload.size.requiresLineOfSight !== 'terminate') {
					throw ErrorMsg.send('pf2e-graphics.execute.common.error.unknownDiscriminatedUnionValue', {
						payloadType: 'graphic',
						property: 'size.requiresLineOfSight',
					});
				}
			}

			if (payload.rotation) {
				if (payload.rotation.type !== 'directed') {
					throw ErrorMsg.send('pf2e-graphics.execute.common.error.incompatibleValue', {
						payloadType: 'graphic',
						property1: 'size.type',
						property2: 'rotation.type',
					});
				}
				options.offset = offsetToVector2(payload.rotation.offset);
				options.randomOffset = payload.rotation.randomOffset;
				options.local = payload.rotation.local;
				options.gridUnits = payload.rotation.gridUnits;
			}

			seq.stretchTo(positionToArgument(payload.size.endpoint, context), options);
		} else {
			// #region Common (`sizeBaseObject`) properties
			if (payload.size.spriteScale) seq.spriteScale(...parseMinMaxObject(payload.size.spriteScale));
			// TODO: check this actually works as expected
			if (payload.size.scaleIn) {
				seq.scaleIn(payload.size.scaleIn.initialScale, payload.size.scaleIn.duration, {
					ease: payload.size.scaleIn.ease ?? 'linear',
					delay: payload.size.scaleIn.delay || 0,
				});
			}
			if (payload.size.scaleOut) {
				seq.scaleOut(payload.size.scaleOut.finalScale, payload.size.scaleOut.duration, {
					ease: payload.size.scaleOut.ease ?? 'linear',
					delay: payload.size.scaleOut.delay || 0,
				});
			}
			// #endregion
			if (payload.size.type === 'absolute') {
				if (payload.size.width || payload.size.height) {
					seq.size(
						{
							// @ts-expect-error TODO: fix Sequencer types
							width: payload.size.width,
							// @ts-expect-error TODO: fix Sequencer types
							height: payload.size.height,
						},
						{ gridUnits: payload.size.gridUnits },
					);
				}
				if (payload.size.scaling) seq.scale(...parseMinMaxObject(payload.size.scaling));
			} else if (payload.size.type === 'relative') {
				if (position.type === 'screenSpace')
					throw ErrorMsg.send('pf2e-graphics.execute.graphic.error.mismatchedPositionSize');

				// Get placeable to scale relative to
				let placeable;
				if (payload.size.relativeTo) {
					// It might be defined explicitly
					placeable = positionToArgument(payload.size.relativeTo, context);
				} else if (
					// Else we use the position, if it has one
					position.location === 'SOURCES'
					|| position.location === 'TARGETS'
					|| position.location === 'TEMPLATES'
				) {
					placeable = positionToArgument(position.location, context);
				} else {
					// Otherwise we try to get *any* placeable defined in the animation set
					const firstPlaceable = getFirstPlaceable(payload.position);
					if (!firstPlaceable) {
						throw ErrorMsg.send(
							'pf2e-graphics.execute.graphic.error.cantFindPlaceableForRelativeScaling',
						);
					}
					placeable = positionToArgument(firstPlaceable, context);
				}
				if (
					placeable instanceof CONFIG.Token.objectClass
					|| placeable instanceof CONFIG.Token.documentClass
				) {
					if (placeable instanceof CONFIG.Token.documentClass) {
						placeable = placeable.object as TokenPF2e;
					}
					if (payload.size.useTokenSpace) {
						const tokenSize = placeable.getSize();
						if (payload.size.uniform) {
							if (tokenSize.height >= tokenSize.width) {
								// @ts-expect-error TODO: fix Sequencer types
								seq.size({
									height: tokenSize.height,
								});
							} else {
								// @ts-expect-error TODO: fix Sequencer types
								seq.size({
									width: tokenSize.height,
								});
							}
						} else {
							seq.size(tokenSize);
						}
					} else {
						const effectiveSize = placeable.actor?.getFlag(
							'pf2e-graphics',
							'effectiveSize',
						) as EffectiveSize;
						if (effectiveSize?.enabled) {
							// Manual scaling activated!
							seq.size(canvas.grid.size * effectiveSize.size);
							if (payload.size.scaling) seq.scale(payload.size.scaling);
							// TODO: uniform
						} else if (placeable.document.ring.enabled) {
							// Dynamic-ring tokens are regular enough for us to always know the size
							seq.scaleToObject(
								(payload.size.scaling ?? 1) / (placeable.document.ring.subject.scale ?? 1),
								{
									considerTokenScale: true,
									uniform: !!payload.size.uniform,
								},
							);
						} else {
							// Just assume default size
							const tokenSize = placeable.getSize();
							if (payload.size.uniform) {
								if (tokenSize.height >= tokenSize.width) {
									// @ts-expect-error TODO: fix Sequencer types
									seq.size({
										height: canvas.grid.size * getDefaultSize(placeable.actor?.size),
									});
								} else {
									// @ts-expect-error TODO: fix Sequencer types
									seq.size({
										width: canvas.grid.size * getDefaultSize(placeable.actor?.size),
									});
								}
							} else {
								seq.size(tokenSize);
							}
							if (payload.size.scaling) seq.scale(payload.size.scaling);
						}
					}
				} else if (
					placeable instanceof MeasuredTemplate
					|| placeable instanceof MeasuredTemplateDocument
				) {
					seq.scaleToObject(payload.size.scaling ?? 1, {
						uniform: !!payload.size.uniform,
					});
				} else {
					throw ErrorMsg.send(
						'pf2e-graphics.execute.graphic.error.cantIdentifyPlaceableForRelativeScaling',
					);
				}
			} else if (payload.size.type === 'screenSpace') {
				// TODO: Implement
				throw ErrorMsg.send('pf2e-graphics.execute.common.error.unimplemented', {
					payloadType: 'graphic',
					unimplemented: '<code>size.type: "screenSpace"</code>',
				});
			} else {
				throw ErrorMsg.send('pf2e-graphics.execute.common.error.unimplemented', {
					payloadType: 'graphic',
					unimplemented: '<code>size.type: "screenSpace"</code>',
				});
			}
		}
	}

	if (payload.elevation) {
		if (payload.elevation.zIndex) seq.zIndex(payload.elevation.zIndex);
		if (payload.elevation.altitude) seq.elevation(payload.elevation.altitude);
		if (payload.elevation.sortLayer) {
			if (payload.elevation.sortLayer === 'belowTiles') {
				// @ts-expect-error PrimaryCanvasGroup.SORT_LAYERS isn't in types, but also... TODO: Sequencer add `.sortLayer()`
				seq.sortLayer(PrimaryCanvasGroup.SORT_LAYERS.TILES - 100);
			} else if (payload.elevation.sortLayer === 'belowDrawings') {
				// @ts-expect-error PrimaryCanvasGroup.SORT_LAYERS isn't in types, but also... TODO: Sequencer add `.sortLayer()`
				seq.sortLayer(PrimaryCanvasGroup.SORT_LAYERS.DRAWINGS - 100);
			} else if (payload.elevation.sortLayer === 'belowTokens') {
				// @ts-expect-error PrimaryCanvasGroup.SORT_LAYERS isn't in types, but also... TODO: Sequencer add `.sortLayer()`
				seq.sortLayer(PrimaryCanvasGroup.SORT_LAYERS.TOKENS - 100);
			} else if (payload.elevation.sortLayer === 'aboveWeather') {
				// @ts-expect-error PrimaryCanvasGroup.SORT_LAYERS isn't in types, but also... TODO: Sequencer add `.sortLayer()`
				seq.sortLayer(PrimaryCanvasGroup.SORT_LAYERS.WEATHER + 100);
			} else if (payload.elevation.sortLayer === 'aboveLighting') {
				seq.aboveLighting();
			} else if (payload.elevation.sortLayer === 'aboveInterface') {
				seq.screenSpaceAboveUI();
			} else {
				if (typeof payload.elevation.sortLayer !== 'number') {
					throw ErrorMsg.send('pf2e-graphics.execute.common.error.unknownDiscriminatedUnionValue', {
						payloadType: 'graphic',
						property: 'elevation.sortLayer',
					});
				}
				// @ts-expect-error TODO: Sequencer add `.sortLayer()`
				seq.sortLayer(payload.elevation.sortLayer);
			}
		}
	}

	if (payload.fadeIn) seq.fadeIn(payload.fadeIn.duration, payload.fadeIn);

	if (payload.fadeOut) seq.fadeOut(payload.fadeOut.duration, payload.fadeOut);

	if (payload.tint) seq.tint(payload.tint);

	if (payload.filters) {
		payload.filters.forEach(filter =>
			seq.filter(
				filter.type,
				// @ts-expect-error Nothing bad can happen if `filter.options` is `undefined` because it doesn't exist.
				filter.options,
			),
		);
	}

	if (payload.drawings) {
		payload.drawings.forEach((drawing) => {
			if (drawing.type === 'text') {
				seq.text(drawing.entry, drawing.options);
			} else {
				const options: Parameters<typeof seq.shape>[1] = {
					...drawing,
					fillColor: drawing.fill?.color,
					fillAlpha: drawing.fill?.alpha,
					lineSize: drawing.line?.size,
					lineColor: drawing.line?.color,
				};
				seq.shape(drawing.type, options);
			}
		});
	}

	if (payload.varyProperties) {
		for (const variation of payload.varyProperties) {
			if (variation.type === 'animate') {
				seq.animateProperty(variation.target, variation.property, variation);
			} else if (variation.type === 'loop') {
				seq.loopProperty(variation.target, variation.property, variation);
			} else {
				throw ErrorMsg.send('pf2e-graphics.execute.common.error.unknownDiscriminatedUnionValue', {
					payloadType: 'graphic',
					property: 'varyProperties[].type',
				});
			}
		}
	}

	return seq;
}

/**
 * Gets the first placeable keyword-string (`'SOURCES'`, `'TARGETS'`, or `'TEMPLATES'`) from an array of positions.
 * @param array The input array to search.
 * @returns The first placeable keyword-string. If none are found, then `null` is returned.
 */
function getFirstPlaceable(
	array: (string | Vector2 | ArrayElement<Extract<Payload, { type: 'graphic' }>['position']>)[],
): 'SOURCES' | 'TARGETS' | 'TEMPLATES' | null {
	for (const item of array) {
		if (typeof item === 'string') {
			if (item === 'SOURCES' || item === 'TARGETS' || item === 'TEMPLATES') return item;
		} else if ('location' in item) {
			if (item.location === 'SOURCES' || item.location === 'TARGETS' || item.location === 'TEMPLATES')
				return item.location;
		}
	}
	return null;
}
