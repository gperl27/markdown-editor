import { FileWithContent } from "../contexts/FilesContext";

export enum CacheKeys {
  EDITOR_STATE = "editorState"
}

export interface Cache {
  file: FileWithContent;
  position: any;
  viewState: string;
}
