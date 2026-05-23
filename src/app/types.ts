export type Point = {
  x: number;
  y: number;
};

export type Calibration = {
  pointA?: Point;
  pointB?: Point;
  realDistanceMm: number;
};

export type ReferenceImage = {
  src: string;
  width: number;
  height: number;
  scale: number;
  opacity: number;
  position: Point;
  mmPerPixel: number;
};

export type MolleParams = {
  slotWidth: number;
  slotHeight: number;
  slotGapX: number;
  slotGapY: number;
  edgeMargin: number;
  boltDiameter: number;
  nutDiameter: number;
  nutHeight: number;
  plateThickness: number;
};

export type Slot = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  enabled: boolean;
  autoDisabledReason?: 'outside-outline' | 'edge-margin';
};

export type DocumentModel = {
  units: 'mm';
  image?: ReferenceImage;
  outline: Point[];
  outlineClosed: boolean;
  molleParams: MolleParams;
  slots: Slot[];
  disabledSlotIds: string[];
};

export const defaultMolleParams: MolleParams = {
  slotWidth: 32,
  slotHeight: 27,
  slotGapX: 6,
  slotGapY: 23.7,
  edgeMargin: 6,
  boltDiameter: 3.2,
  nutDiameter: 6.4,
  nutHeight: 2.7,
  plateThickness: 3,
};

export const defaultDocument: DocumentModel = {
  units: 'mm',
  outline: [],
  outlineClosed: false,
  molleParams: defaultMolleParams,
  slots: [],
  disabledSlotIds: [],
};
