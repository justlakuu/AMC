import { useMemo, useRef, useState } from 'react';
import { Circle, Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text } from 'react-konva';
import type Konva from 'konva';
import type { DocumentModel, ReferenceImage, SketchTool } from '../app/types';
import type { EditorMode } from '../app/editorMachine';
import { regenerateSlots } from '../geometry/molleGenerator';
import { distance } from '../geometry/polygon';

type Props = {
  document: DocumentModel;
  mode: EditorMode;
  activeTool: SketchTool;
  onDocumentChange: (document: DocumentModel) => void;
};

function useCanvasImage(reference?: ReferenceImage) {
  return useMemo(() => {
    if (!reference) {
      return undefined;
    }

    const image = new window.Image();
    image.src = reference.src;
    return image;
  }, [reference]);
}

export function CanvasEditor({ document, mode, activeTool, onDocumentChange }: Props) {
  const stageRef = useRef<Konva.Stage>(null);
  const image = useCanvasImage(document.image);
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 40, y: 40 });
  const [closingHover, setClosingHover] = useState(false);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number>();
  const [selectedEdgeIndex, setSelectedEdgeIndex] = useState<number>();
  const [panStart, setPanStart] = useState<{ pointer: { x: number; y: number }; stagePosition: { x: number; y: number } }>();

  const getPointer = () => {
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!stage || !pointer) {
      return undefined;
    }

    return {
      x: (pointer.x - stagePosition.x) / stageScale,
      y: (pointer.y - stagePosition.y) / stageScale,
    };
  };

  const handlePointerDown = (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (event.evt instanceof MouseEvent && event.evt.button !== 0) {
      return;
    }

    if (activeTool === 'select') {
      const stage = stageRef.current;
      const pointer = stage?.getPointerPosition();
      if (pointer && event.target === stage) {
        setPanStart({ pointer, stagePosition });
        setSelectedPointIndex(undefined);
        setSelectedEdgeIndex(undefined);
      }
      return;
    }

    const pointer = getPointer();
    if (!pointer) {
      return;
    }

    if (mode === 'draw-outline' && activeTool === 'draw-outline' && !document.outlineClosed) {
      if (document.outline.length >= 3 && distance(pointer, document.outline[0]) <= 12 / stageScale) {
        onDocumentChange(regenerateSlots({ ...document, outlineClosed: true }));
        setClosingHover(false);
        return;
      }

      const next = {
        ...document,
        outline: [...document.outline, pointer],
        outlineClosed: false,
      };
      onDocumentChange(regenerateSlots(next));
    }
  };

  const handlePointerMove = () => {
    const stage = stageRef.current;
    const rawPointer = stage?.getPointerPosition();
    if (panStart && rawPointer) {
      setStagePosition({
        x: panStart.stagePosition.x + rawPointer.x - panStart.pointer.x,
        y: panStart.stagePosition.y + rawPointer.y - panStart.pointer.y,
      });
      return;
    }

    const pointer = getPointer();
    if (!pointer || mode !== 'draw-outline' || activeTool !== 'draw-outline' || document.outlineClosed || document.outline.length < 3) {
      setClosingHover(false);
      return;
    }

    setClosingHover(distance(pointer, document.outline[0]) <= 12 / stageScale);
  };

  const finishPan = () => setPanStart(undefined);

  const closeOutline = () => {
    if (document.outline.length < 3) {
      return;
    }

    onDocumentChange(regenerateSlots({ ...document, outlineClosed: true }));
  };

  const undoPoint = () => {
    const next = { ...document, outline: document.outline.slice(0, -1), outlineClosed: false };
    onDocumentChange(regenerateSlots(next));
  };

  const toggleSlot = (slotId: string) => {
    const disabled = document.disabledSlotIds.includes(slotId)
      ? document.disabledSlotIds.filter((id) => id !== slotId)
      : [...document.disabledSlotIds, slotId];
    onDocumentChange(regenerateSlots({ ...document, disabledSlotIds: disabled }));
  };

  const handleWheel = (event: Konva.KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();
    const scaleBy = 1.08;
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!stage || !pointer) {
      return;
    }

    const oldScale = stageScale;
    const mousePointTo = {
      x: (pointer.x - stagePosition.x) / oldScale,
      y: (pointer.y - stagePosition.y) / oldScale,
    };
    const newScale = event.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    setStageScale(newScale);
    setStagePosition({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale });
  };

  const outlinePoints = document.outline.flatMap((point) => [point.x, point.y]);
  const edgeSegments = document.outline.map((point, index) => {
    const nextPoint = document.outline[index === document.outline.length - 1 ? 0 : index + 1];
    return { index, point, nextPoint };
  }).filter(({ index }) => document.outlineClosed || index < document.outline.length - 1);
  const enabledSlots = document.slots.filter((slot) => slot.enabled);

  return (
    <div className={`canvas-shell ${mode === 'draw-outline' || mode === 'edit-slots' ? 'sketch-active' : ''}`}>
      <div className="canvas-actions">
        <button type="button" onClick={undoPoint} disabled={document.outline.length === 0}>Cofnij punkt</button>
        <button type="button" onClick={closeOutline} disabled={document.outline.length < 3}>Zamknij obrys</button>
        <span>Zoom: {(stageScale * 100).toFixed(0)}%</span>
      </div>

      <Stage
        ref={stageRef}
        width={window.innerWidth - 420}
        height={window.innerHeight - (mode === 'draw-outline' || mode === 'edit-slots' ? 148 : 96)}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        onMouseMove={handlePointerMove}
        onTouchMove={handlePointerMove}
        onMouseUp={finishPan}
        onTouchEnd={finishPan}
        onMouseLeave={() => {
          setClosingHover(false);
          finishPan();
        }}
        onWheel={handleWheel}
      >
        <Layer>
          <Group
            x={stagePosition.x}
            y={stagePosition.y}
            scaleX={stageScale}
            scaleY={stageScale}
          >
            <Group listening={false}>
              {Array.from({ length: 80 }).map((_, index) => (
                <Line key={`v-${index}`} points={[index * 25, -1000, index * 25, 2200]} stroke={index % 4 === 0 ? '#d0d7de' : '#eef2f7'} strokeWidth={1} />
              ))}
              {Array.from({ length: 80 }).map((_, index) => (
                <Line key={`h-${index}`} points={[-1000, index * 25, 2200, index * 25]} stroke={index % 4 === 0 ? '#d0d7de' : '#eef2f7'} strokeWidth={1} />
              ))}
            </Group>

            {document.image && image && (
              <KonvaImage
                image={image}
                x={document.image.position.x}
                y={document.image.position.y}
                width={document.image.width * document.image.scale}
                height={document.image.height * document.image.scale}
                opacity={document.image.opacity}
                listening={false}
              />
            )}

            {document.outline.length > 0 && (
              <Line points={outlinePoints} closed={document.outlineClosed} fill="rgba(97, 218, 251, 0.18)" stroke="#087ea4" strokeWidth={2} listening={false} />
            )}

            {edgeSegments.map(({ index, point, nextPoint }) => (
              <Line
                key={`edge-${index}`}
                points={[point.x, point.y, nextPoint.x, nextPoint.y]}
                stroke={selectedEdgeIndex === index ? '#f97316' : 'transparent'}
                strokeWidth={selectedEdgeIndex === index ? 8 : 14}
                opacity={selectedEdgeIndex === index ? 0.85 : 0}
                listening={(mode === 'draw-outline' || mode === 'edit-slots') && activeTool === 'select'}
                onClick={(event) => {
                  event.cancelBubble = true;
                  setSelectedPointIndex(undefined);
                  setSelectedEdgeIndex(index);
                }}
              />
            ))}

            {document.outline.map((point, index) => (
              <Group
                key={`${point.x}-${point.y}`}
                listening={(mode === 'draw-outline' || mode === 'edit-slots') && activeTool === 'select'}
                draggable={(mode === 'draw-outline' || mode === 'edit-slots') && activeTool === 'select'}
                onDragMove={(event) => {
                  event.cancelBubble = true;
                  const nextOutline = document.outline.map((outlinePoint, pointIndex) => (
                    pointIndex === index ? { x: event.target.x(), y: event.target.y() } : outlinePoint
                  ));
                  onDocumentChange(regenerateSlots({ ...document, outline: nextOutline }));
                }}
                onDragEnd={(event) => {
                  event.cancelBubble = true;
                  const nextOutline = document.outline.map((outlinePoint, pointIndex) => (
                    pointIndex === index ? { x: event.target.x(), y: event.target.y() } : outlinePoint
                  ));
                  onDocumentChange(regenerateSlots({ ...document, outline: nextOutline }));
                }}
                onMouseDown={(event) => {
                  event.cancelBubble = true;
                  setSelectedPointIndex(index);
                  setSelectedEdgeIndex(undefined);
                  setPanStart(undefined);
                }}
                onClick={(event) => {
                  event.cancelBubble = true;
                  setSelectedPointIndex(index);
                  setSelectedEdgeIndex(undefined);
                }}
                x={point.x}
                y={point.y}
              >
                <Circle
                  x={0}
                  y={0}
                  radius={selectedPointIndex === index ? 8 : index === 0 && closingHover ? 9 : activeTool === 'select' ? 6 : 4}
                  fill={index === 0 && closingHover ? '#ffffff' : selectedPointIndex === index ? '#f97316' : '#087ea4'}
                  stroke={index === 0 && closingHover ? '#087ea4' : '#ffffff'}
                  strokeWidth={(index === 0 && closingHover) || selectedPointIndex === index ? 3 : 1.5}
                />
                <Text x={6} y={-14} text={`${index + 1}`} fill="#1f2328" fontSize={11} />
              </Group>
            ))}

            {document.slots.map((slot) => (
              <Rect
                key={slot.id}
                x={slot.x}
                y={slot.y}
                width={slot.width}
                height={slot.height}
                fill={slot.enabled ? '#f8fafc' : 'rgba(248, 113, 113, 0.25)'}
                stroke={slot.enabled ? '#94a3b8' : '#ef4444'}
                dash={slot.enabled ? undefined : [6, 4]}
                listening={(mode === 'draw-outline' || mode === 'edit-slots') && activeTool === 'toggle-slots'}
                onClick={(event) => {
                  event.cancelBubble = true;
                  if ((mode === 'draw-outline' || mode === 'edit-slots') && activeTool === 'toggle-slots' && !slot.autoDisabledReason) {
                    toggleSlot(slot.id);
                  }
                }}
              />
            ))}

            {document.showBoltHoles && enabledSlots.map((slot) => {
              const centerX = slot.x + slot.width / 2;
              const radius = document.molleParams.boltDiameter / 2;
              const topY = slot.y - document.molleParams.slotGapY / 2;
              const bottomY = slot.y + slot.height + document.molleParams.slotGapY / 2;

              return (
                <Group key={`bolts-${slot.id}`} listening={false}>
                  <Circle x={centerX} y={topY} radius={radius} fill="#ffffff" stroke="#0969da" strokeWidth={0.9} />
                  <Circle x={centerX} y={bottomY} radius={radius} fill="#ffffff" stroke="#0969da" strokeWidth={0.9} />
                </Group>
              );
            })}
          </Group>
        </Layer>
      </Stage>
    </div>
  );
}
