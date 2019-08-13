import { useReducer } from "react";
import { filesReducer, FileTypes, initialFileState } from "../reducers/files";
import {
  FileFromDir,
  FileIndex,
  FilesRepository, isFile,
} from '../repositories/filesRepository';

interface FileNameDialogOptions {
  onFileSubmit?: (filename: string) => void;
  onFolderSubmit?: (filename: string) => void;
}

interface Props extends FileNameDialogOptions {
  filesRepository: FilesRepository;
}

export const useFiles = (props: Props) => {
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
      type: FileTypes.SET_FILENAME_FORM,
      payload: {
        filenameInputValue: value
      }
    });
  };

  const getProperFilenameFromItem = (filename: string, item?: FileFromDir) => {
    if (!item) {
      return filename;
    }

    return props.filesRepository.createPathFromFile(item) + `/${filename}`;
  };

  const getPropsForFilenameDialog = () => {
    const filenameProps: {
      dialogTitle?: string;
      dialogOnSubmit?: () => void;
    } = {};

    const item = state.fileNameForm.filenameChangeItem;

    const filename = getProperFilenameFromItem(
      state.fileNameForm.filenameInputValue,
      state.fileNameForm.filenameRefItem
    );

    if (state.fileNameForm.filenameType === "file") {
      filenameProps.dialogTitle = item
        ? `Rename file ${item.name} to `
        : "New file";
      filenameProps.dialogOnSubmit = () => {
        props.onFileSubmit && props.onFileSubmit(filename);
        dispatch({
          type: FileTypes.SET_FILENAME_FORM,
          payload: {
            isEditingFilename: false
          }
        });
      };
    } else {
      filenameProps.dialogTitle = item
        ? `Rename folder ${item.name} to `
        : "New folder";
      filenameProps.dialogOnSubmit = () => {
        props.onFolderSubmit && props.onFolderSubmit(filename);
        dispatch({
          type: FileTypes.SET_FILENAME_FORM,
          payload: {
            isEditingFilename: false
          }
        });
      };
    }

    return filenameProps;
  };

  return {
    filesState: state,
    filesDispatch: dispatch,
    setFiles,
    setCurrentWorkingFile,
    resetFilenameForm,
    updateFilenameFormInput,
    ...getPropsForFilenameDialog()
  };
};
