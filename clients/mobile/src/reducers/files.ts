import { Action } from "./index";
import {
  FileFromDir,
  FileIndex,
  FileWithContent
} from "../repositories/filesRepository";
import { FileType } from "../contexts/FilesContext";

export enum FileTypes {
  SET_FILES,
  SET_CURRENT_WORKING_FILE,
  SET_FILENAME_FORM,
  RESET_FILENAME_FORM
}

interface FileNameFormState {
  isEditingFilename: boolean;
  filenameInputValue: string;
  filenameChangeItem?: FileFromDir;
  filenameType?: FileType;
  filenameRefItem?: FileFromDir;
}

interface State {
  files?: FileIndex;
  currentWorkingFile?: FileWithContent;
  fileNameForm: FileNameFormState;
}

export const initialFileState: State = {
  files: undefined,
  currentWorkingFile: undefined,
  fileNameForm: {
    isEditingFilename: false,
    filenameInputValue: "",
    filenameType: undefined,
    filenameChangeItem: undefined,
    filenameRefItem: undefined
  }
};

export const filesReducer = (
  state: State,
  action: Action<FileTypes>
): State => {
  console.log(state, action)

  switch (action.type) {
    case FileTypes.SET_FILES:
      return {
        ...state,
        files: action.payload
      };
    case FileTypes.SET_CURRENT_WORKING_FILE:
      return {
        ...state,
        currentWorkingFile: action.payload
      };
    case FileTypes.SET_FILENAME_FORM:
      return {
        ...state,
        fileNameForm: {
          ...state.fileNameForm,
          ...action.payload
        }
      };
    case FileTypes.RESET_FILENAME_FORM:
      return {
        ...state,
        fileNameForm: initialFileState.fileNameForm
      };

    default:
      console.log("Improper type dispatched, resetting");

      return initialFileState;
  }
};
