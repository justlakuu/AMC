import { setup } from 'xstate';
import type { DocumentModel } from './types';
import { defaultDocument } from './types';

export type EditorMode =
  | 'select'
  | 'calibrate-image'
  | 'draw-outline'
  | 'edit-slots'
  | 'preview-3d';

type EditorContext = {
  document: DocumentModel;
  mode: EditorMode;
};

type EditorEvent =
  | { type: 'SET_MODE'; mode: EditorMode }
  | { type: 'SET_DOCUMENT'; document: DocumentModel }
  | { type: 'RESET_DOCUMENT' };

export const editorMachine = setup({
  types: {
    context: {} as EditorContext,
    events: {} as EditorEvent,
  },
  actions: {
    setMode: ({ context, event }) => {
      if (event.type === 'SET_MODE') {
        context.mode = event.mode;
      }
    },
    setDocument: ({ context, event }) => {
      if (event.type === 'SET_DOCUMENT') {
        context.document = event.document;
      }
    },
    resetDocument: ({ context }) => {
      context.document = structuredClone(defaultDocument);
      context.mode = 'select';
    },
  },
}).createMachine({
  id: 'amc-editor',
  context: {
    document: structuredClone(defaultDocument),
    mode: 'draw-outline',
  },
  initial: 'editing',
  states: {
    editing: {
      on: {
        SET_MODE: { actions: 'setMode' },
        SET_DOCUMENT: { actions: 'setDocument' },
        RESET_DOCUMENT: { actions: 'resetDocument' },
      },
    },
  },
});
