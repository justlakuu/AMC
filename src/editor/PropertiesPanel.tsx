import type { DocumentModel } from '../app/types';
import { regenerateSlots } from '../geometry/molleGenerator';

type Props = {
  document: DocumentModel;
  onDocumentChange: (document: DocumentModel) => void;
};

export function PropertiesPanel({ document, onDocumentChange }: Props) {
  const updateParam = (key: keyof DocumentModel['molleParams'], value: number) => {
    onDocumentChange(regenerateSlots({
      ...document,
      molleParams: {
        ...document.molleParams,
        [key]: value,
      },
    }));
  };

  return (
    <aside className="properties-panel">
      <h2>Parametry MOLLE</h2>
      {Object.entries(document.molleParams).map(([key, value]) => (
        <label key={key}>
          {key}
          <input type="number" step="0.1" value={value} onChange={(event) => updateParam(key as keyof DocumentModel['molleParams'], Number(event.target.value))} />
        </label>
      ))}
      <div className="stats">
        <strong>Sloty</strong>
        <span>Aktywne: {document.slots.filter((slot) => slot.enabled).length}</span>
        <span>Auto odrzucone: {document.slots.filter((slot) => slot.autoDisabledReason).length}</span>
        <span>Ręcznie wyłączone: {document.disabledSlotIds.length}</span>
      </div>
    </aside>
  );
}
