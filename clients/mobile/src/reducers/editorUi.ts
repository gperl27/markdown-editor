import { Action } from "./index";

export enum EditorUiTypes {
  SHOW_PREVIEW_ONLY,
  SHOW_EDITOR_ONLY,
  SHOW_BOTH,
  TOGGLE_SHOW_EDITOR,
  TOGGLE_SHOW_PREVIEW
}

interface State {
  showEditor: boolean;
  showMarkdownPreview: boolean;
}

export const editorUiInitialState: State = {
  showEditor: true,
  showMarkdownPreview: true
};

export const editorUiReducer = (
  state: State,
  action: Action<EditorUiTypes>
): State => {
  switch (action.type) {
    case EditorUiTypes.SHOW_PREVIEW_ONLY:
      return {
        showEditor: false,
        showMarkdownPreview: true
      };
    case EditorUiTypes.SHOW_EDITOR_ONLY:
      return {
        showEditor: true,
        showMarkdownPreview: false
      };
    case EditorUiTypes.SHOW_BOTH:
      return {
        showEditor: true,
        showMarkdownPreview: true
      };
    case EditorUiTypes.TOGGLE_SHOW_EDITOR:
      return {
        ...state,
        showEditor: !state.showEditor
      };
    case EditorUiTypes.TOGGLE_SHOW_PREVIEW:
      return {
        ...state,
        showMarkdownPreview: !state.showMarkdownPreview
      };
    default:
      console.log("Improper type dispatched, resetting");

      return editorUiInitialState;
  }
};
