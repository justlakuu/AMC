import { useState } from 'react';
import { useMachine } from '@xstate/react';
import { editorMachine, type EditorMode } from './app/editorMachine';
import type { ReferenceImage, SketchTool } from './app/types';
import { CanvasEditor } from './editor/CanvasEditor';
import { CalibrationModal } from './editor/CalibrationModal';
import { PropertiesPanel } from './editor/PropertiesPanel';
import { Preview3D } from './preview/Preview3D';
import { exportScad } from './export/scadExporter';
import './styles/app.css';

function App() {
  const [snapshot, send] = useMachine(editorMachine);
  const [pendingImage, setPendingImage] = useState<ReferenceImage>();
  const [activeTool, setActiveTool] = useState<SketchTool>('draw-outline');
  const document = snapshot.context.document;
  const mode = snapshot.context.mode;
  const sketchMode = mode === 'draw-outline' || mode === 'edit-slots';

  const setMode = (nextMode: EditorMode) => {
    if (nextMode === 'preview-3d' && !document.outlineClosed) {
      return;
    }

    send({ type: 'SET_MODE', mode: nextMode });
    if ((nextMode === 'draw-outline' || nextMode === 'edit-slots') && activeTool === 'toggle-slots' && !document.outlineClosed) {
      setActiveTool('draw-outline');
    }
  };
  const setDocument = (nextDocument: typeof document) => send({ type: 'SET_DOCUMENT', document: nextDocument });

  const importImage = (file?: File) => {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        setPendingImage({
          src: String(reader.result),
          width: image.width,
          height: image.height,
          position: { x: 0, y: 0 },
          scale: 1,
          opacity: 0.55,
          mmPerPixel: 1,
        });
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const downloadScad = () => {
    const blob = new Blob([exportScad(document)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = 'amc-panel.scad';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>AMC</h1>
          <span>Advanced Molle Creator</span>
        </div>
        <nav>
          {(['draw-outline', 'edit-slots', 'preview-3d'] as EditorMode[]).map((item) => (
            <button key={item} type="button" className={mode === item ? 'active' : ''} disabled={item === 'preview-3d' && !document.outlineClosed} onClick={() => setMode(item)}>{item}</button>
          ))}
          <label className="file-button">
            Import zdjęcia
            <input type="file" accept="image/*" onChange={(event) => importImage(event.target.files?.[0])} />
          </label>
          <button type="button" onClick={downloadScad} disabled={!document.outlineClosed}>Eksport SCAD</button>
          <button type="button" onClick={() => send({ type: 'RESET_DOCUMENT' })}>Reset</button>
        </nav>
      </header>

      {sketchMode && (
        <div className="sketch-toolbar">
          <strong>Sketch</strong>
          <button type="button" className={activeTool === 'select' ? 'active' : ''} onClick={() => setActiveTool('select')}>Selection</button>
          <button type="button" className={activeTool === 'draw-outline' ? 'active' : ''} disabled={document.outlineClosed || mode === 'edit-slots'} onClick={() => setActiveTool('draw-outline')}>Rysuj obrys</button>
          <button type="button" className={activeTool === 'toggle-slots' ? 'active' : ''} disabled={!document.outlineClosed} onClick={() => setActiveTool('toggle-slots')}>Aktywuj/deaktywuj sloty</button>
          <span>{document.outlineClosed ? 'Obrys zamknięty' : 'Zamknij obrys, żeby generować i edytować sloty'}</span>
        </div>
      )}

      <section className="workspace">
        {mode === 'preview-3d' ? <Preview3D document={document} /> : <CanvasEditor document={document} mode={mode} activeTool={activeTool} onDocumentChange={setDocument} />}
        <PropertiesPanel document={document} onDocumentChange={setDocument} />
      </section>

      {pendingImage && (
        <CalibrationModal
          image={pendingImage}
          onCancel={() => setPendingImage(undefined)}
          onApply={(image) => {
            setDocument({ ...document, image });
            setPendingImage(undefined);
          }}
        />
      )}
    </main>
  );
}

export default App;
