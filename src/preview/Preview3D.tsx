import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { DocumentModel } from '../app/types';
import { polygonBounds } from '../geometry/polygon';

type Props = {
  document: DocumentModel;
};

export function Preview3D({ document }: Props) {
  const bounds = polygonBounds(document.outline);
  const slots = document.slots.filter((slot) => slot.enabled);

  return (
    <div className="preview3d">
      <Canvas camera={{ position: [0, -260, 180], fov: 45 }}>
        <ambientLight intensity={0.75} />
        <directionalLight position={[120, -160, 220]} intensity={1.2} />
        <group position={[-bounds.width / 2, bounds.height / 2, 0]} rotation={[0, 0, 0]}>
          <mesh position={[bounds.minX + bounds.width / 2, -(bounds.minY + bounds.height / 2), 0]}>
            <boxGeometry args={[Math.max(bounds.width, 1), Math.max(bounds.height, 1), document.molleParams.plateThickness]} />
            <meshStandardMaterial color="#c7ba64" roughness={0.72} metalness={0.05} />
          </mesh>
          {slots.map((slot) => (
            <mesh key={slot.id} position={[slot.x + slot.width / 2, -(slot.y + slot.height / 2), document.molleParams.plateThickness / 2 + 0.4]}>
              <boxGeometry args={[slot.width, slot.height, 1]} />
              <meshStandardMaterial color="#111827" />
            </mesh>
          ))}
        </group>
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
