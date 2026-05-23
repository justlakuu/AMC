import { useMemo, useState } from 'react';
import { Circle, Image as KonvaImage, Layer, Line, Stage } from 'react-konva';
import type { Calibration, ReferenceImage } from '../app/types';
import { distance } from '../geometry/polygon';
import { parseDistanceToMm } from '../geometry/units';

type Props = {
  image: ReferenceImage;
  onCancel: () => void;
  onApply: (image: ReferenceImage) => void;
};

export function CalibrationModal({ image, onCancel, onApply }: Props) {
  const [bitmap] = useState(() => {
    const img = new window.Image();
    img.src = image.src;
    return img;
  });
  const [calibration, setCalibration] = useState<Calibration>({ realDistanceMm: 150 });
  const [distanceInput, setDistanceInput] = useState('15 cm');
  const previewScale = Math.min(760 / image.width, 520 / image.height, 1);
  const pixelDistance = useMemo(() => {
    if (!calibration.pointA || !calibration.pointB) {
      return 0;
    }

    return distance(calibration.pointA, calibration.pointB);
  }, [calibration.pointA, calibration.pointB]);

  const handleStageClick = (event: unknown) => {
    const stage = (event as { target: { getStage: () => { getPointerPosition: () => { x: number; y: number } | null } } }).target.getStage();
    const pointer = stage.getPointerPosition();

    if (!pointer) {
      return;
    }

    const point = { x: pointer.x / previewScale, y: pointer.y / previewScale };
    setCalibration((current) => {
      if (!current.pointA || (current.pointA && current.pointB)) {
        return { ...current, pointA: point, pointB: undefined };
      }

      return { ...current, pointB: point };
    });
  };

  const apply = () => {
    const realDistanceMm = parseDistanceToMm(distanceInput);
    if (!calibration.pointA || !calibration.pointB || !Number.isFinite(realDistanceMm) || pixelDistance === 0) {
      return;
    }

    onApply({
      ...image,
      scale: realDistanceMm / pixelDistance,
      mmPerPixel: realDistanceMm / pixelDistance,
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal calibration-modal">
        <header>
          <div>
            <h2>Kalibracja zdjęcia</h2>
            <p>Kliknij punkt A i B na znanym wymiarze, potem wpisz realną długość.</p>
          </div>
          <button type="button" onClick={onCancel}>Zamknij</button>
        </header>

        <Stage width={image.width * previewScale} height={image.height * previewScale} onClick={handleStageClick}>
          <Layer>
            <KonvaImage image={bitmap} width={image.width * previewScale} height={image.height * previewScale} opacity={0.9} />
            {calibration.pointA && (
              <Circle x={calibration.pointA.x * previewScale} y={calibration.pointA.y * previewScale} radius={6} fill="#38bdf8" />
            )}
            {calibration.pointB && (
              <Circle x={calibration.pointB.x * previewScale} y={calibration.pointB.y * previewScale} radius={6} fill="#f97316" />
            )}
            {calibration.pointA && calibration.pointB && (
              <Line
                points={[
                  calibration.pointA.x * previewScale,
                  calibration.pointA.y * previewScale,
                  calibration.pointB.x * previewScale,
                  calibration.pointB.y * previewScale,
                ]}
                stroke="#f8fafc"
                strokeWidth={2}
              />
            )}
          </Layer>
        </Stage>

        <footer>
          <label>
            Znany wymiar
            <input value={distanceInput} onChange={(event) => setDistanceInput(event.target.value)} placeholder="150 mm albo 15 cm" />
          </label>
          <span>{pixelDistance > 0 ? `${pixelDistance.toFixed(1)} px` : 'Wybierz dwa punkty'}</span>
          <button type="button" onClick={apply}>Osadź w skali</button>
        </footer>
      </div>
    </div>
  );
}
