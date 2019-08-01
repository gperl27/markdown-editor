import { Action } from "./index";

export enum EditorUiTypes {
  SHOW_PREVIEW_ONLY,
  SHOW_EDITOR_ONLY,
  SHOW_BOTH,
  TOGGLE_SHOW_EDITOR,
  TOGGLE_SHOW_PREVIEW,
  TOGGLE_SHOW_DIRECTORY,
  LOAD
}

interface State {
  showEditor: boolean;
  showMarkdownPreview: boolean;
  showDirectory: boolean;
}

export const editorUiInitialState: State = {
  showEditor: true,
  showMarkdownPreview: true,
  showDirectory: true
};

export const editorUiReducer = (
  state: State,
  action: Action<EditorUiTypes>
): State => {
  switch (action.type) {
    case EditorUiTypes.SHOW_PREVIEW_ONLY:
      return {
        ...state,
        showEditor: false,
        showMarkdownPreview: true
      };
    case EditorUiTypes.SHOW_EDITOR_ONLY:
      return {
        ...state,
        showEditor: true,
        showMarkdownPreview: false
      };
    case EditorUiTypes.SHOW_BOTH:
      return {
        ...state,
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
    case EditorUiTypes.TOGGLE_SHOW_DIRECTORY:
      return {
        ...state,
        showDirectory: !state.showDirectory
      };
    case EditorUiTypes.LOAD:
      return {
        ...state,
        ...action.payload
      };
    default:
      console.log("Improper type dispatched, resetting");

      return editorUiInitialState;
  }
};
