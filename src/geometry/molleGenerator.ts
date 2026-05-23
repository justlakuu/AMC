import type { DocumentModel, MolleParams, Point, Slot } from '../app/types';
import { polygonBounds, rectInsidePolygon } from './polygon';

function slotId(x: number, y: number) {
  return `${Math.round(x * 100) / 100}:${Math.round(y * 100) / 100}`;
}

export function generateMolleSlots(outline: Point[], params: MolleParams, disabledSlotIds: string[]): Slot[] {
  if (outline.length < 3) {
    return [];
  }

  const bounds = polygonBounds(outline);
  const pitchX = params.slotWidth + params.slotGapX;
  const pitchY = params.slotHeight + params.slotGapY;
  const slots: Slot[] = [];

  for (let y = bounds.minY + params.edgeMargin; y + params.slotHeight <= bounds.maxY - params.edgeMargin; y += pitchY) {
    for (let x = bounds.minX + params.edgeMargin; x + params.slotWidth <= bounds.maxX - params.edgeMargin; x += pitchX) {
      const id = slotId(x, y);
      const inside = rectInsidePolygon(x, y, params.slotWidth, params.slotHeight, outline, params.edgeMargin);
      slots.push({
        id,
        x,
        y,
        width: params.slotWidth,
        height: params.slotHeight,
        enabled: inside && !disabledSlotIds.includes(id),
        autoDisabledReason: inside ? undefined : 'outside-outline',
      });
    }
  }

  return slots;
}

export function regenerateSlots(document: DocumentModel): DocumentModel {
  return {
    ...document,
    slots: generateMolleSlots(document.outline, document.molleParams, document.disabledSlotIds),
  };
}
