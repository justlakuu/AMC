import { assign, setup } from 'xstate';
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
    setMode: assign(({ event }) => {
      if (event.type === 'SET_MODE') {
        return { mode: event.mode };
      }

      return {};
    }),
    setDocument: assign(({ event }) => {
      if (event.type === 'SET_DOCUMENT') {
        return { document: event.document };
      }

      return {};
    }),
    resetDocument: assign({
      document: () => structuredClone(defaultDocument),
      mode: () => 'draw-outline' as const,
    }),
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
