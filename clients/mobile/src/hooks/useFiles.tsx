import { useReducer } from "react";
import { filesReducer, FileTypes, initialFileState } from "../reducers/files";
import {
  FileFromDir,
  FileIndex,
  useFilesRepository
} from "../repositories/filesRepository";

interface FileNameDialogOptions {
  onFileSubmit?: (filename: string) => void;
  onFolderSubmit?: (filename: string) => void;
}

export const useFiles = () => {
  const filesRepository = useFilesRepository();
  const [state, dispatch] = useReducer(filesReducer, initialFileState);

  const resetFilenameForm = () => {
    dispatch({ type: FileTypes.RESET_FILENAME_FORM });
  };

  const setFiles = (files: FileIndex) => {
    dispatch({
      type: FileTypes.SET_FILES,
      payload: files
    });
  };

  const setCurrentWorkingFile = (file?: FileFromDir) => {
    dispatch({
      type: FileTypes.SET_CURRENT_WORKING_FILE,
      payload: file
    });
  };

  const updateFilenameFormInput = (value: string) => {
    dispatch({
      type: FileTypes.SET_CURRENT_WORKING_FILE,
      payload: {
        filenameInputValue: value
      }
    });
  };

  const getProperFilenameFromItem = (filename: string, item?: FileFromDir) => {
    if (!item) {
      return filename;
    }

    return filesRepository.createPathFromFile(item) + `/${filename}`;
  };

  const getPropsForFilenameDialog = (options: FileNameDialogOptions) => {
    let props: { title?: string; onSubmit?: () => void } = {};

    const item = state.fileNameForm.filenameChangeItem;

    const filename = getProperFilenameFromItem(
      state.fileNameForm.filenameInputValue,
      state.fileNameForm.filenameRefItem
    );

    if (state.fileNameForm.filenameType === "file") {
      props.title = item ? `Rename file ${item.name} to ` : "New file";
      props.onSubmit = () => {
        options.onFileSubmit && options.onFileSubmit(filename);
        dispatch({
          type: FileTypes.SET_FILENAME_FORM,
          payload: {
            isEditingFilename: false
          }
        });
      };
    } else {
      props.title = item ? `Rename folder ${item.name} to ` : "New folder";
      props.onSubmit = () =>
        options.onFolderSubmit && options.onFolderSubmit(filename);
      dispatch({
        type: FileTypes.SET_FILENAME_FORM,
        payload: {
          isEditingFilename: false
        }
      });
    }

    return props;
  };

  return {
    filesState: state,
    filesDispatch: dispatch,
    setFiles,
    setCurrentWorkingFile,
    resetFilenameForm,
    updateFilenameFormInput,
    getPropsForFilenameDialog
  };
};
