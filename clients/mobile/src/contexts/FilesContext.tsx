import React, { createContext, ReactNode } from "react";
import {
  FileFromDir,
  FileIndex,
  FileWithContent,
  Folder,
  isDirectory,
  useFilesRepository
} from "../repositories/filesRepository";
import { useOnMount } from "../hooks/useOnMount";
import { useDebouncedCallback } from "use-debounce";
import Dialog from "react-native-dialog";
import { useFiles } from "../hooks/useFiles";
import { FileTypes } from "../reducers/files";

interface Props {
  children: ReactNode;
}

export type FileType = "file" | "folder";

interface FilesContent {
  files?: FileIndex;
  setFiles: (files: FileIndex) => void;
  isEditingFilename: boolean;
  currentWorkingFile?: FileWithContent;
  setCurrentWorkingFile: (file?: FileWithContent) => void;
  updateFile: (contents: string, file?: FileWithContent) => void;
  deleteFile: (item: FileWithContent) => void;
  updateFilename: (name: string) => void;
  newFolder: (folderName: string) => void;
  toggleFolderOpen: (folder: Folder) => void;
  loadFile: (path: FileWithContent) => void;
  showFileChangeForm: (
    item?: FileFromDir,
    refItem?: FileFromDir,
    type?: FileType
  ) => void;
  filenameChangeItem?: FileFromDir;
  filenameType?: FileType;
}

const defaultState: FilesContent = {
  isEditingFilename: false,
  currentWorkingFile: undefined,
  files: undefined,
  setCurrentWorkingFile: () => undefined,
  setFiles: () => undefined,
  updateFile: () => undefined,
  deleteFile: () => undefined,
  updateFilename: () => undefined,
  newFolder: () => undefined,
  toggleFolderOpen: () => undefined,
  loadFile: () => undefined,
  showFileChangeForm: () => undefined
};

const DEBOUNCE = 1000;

export const FilesContext = createContext(defaultState);

export const FilesProvider = (props: Props) => {
  const filesRepository = useFilesRepository();
  const {
    filesState: { files, currentWorkingFile, fileNameForm },
    filesDispatch,
    resetFilenameForm,
    setFiles,
    setCurrentWorkingFile,
    updateFilenameFormInput,
    dialogTitle = "New File",
    dialogOnSubmit = () => undefined
  } = useFiles({
    filesRepository: filesRepository,
    onFolderSubmit: async (filename: string) => await newFolder(filename),
    onFileSubmit: async (filename: string) => await updateFilename(filename)
  });

  const [autoSaveOnChange] = useDebouncedCallback(newFiles => {
    filesRepository
      .syncFiles(newFiles)
      .then(() => console.log("filesync complete old file"));
  }, DEBOUNCE);

  const deleteFile = async (item: FileWithContent) => {
    if (files) {
      await filesRepository.deleteFile(files, item);
      await fetchFilesAndMapToState();
    }
  };

  const updateFile = async (
    contents: string,
    fileToUpdate?: FileWithContent
  ) => {
    const updatedFiles = Object.assign({}, files);

    if (!fileToUpdate) {
      if (contents.length > 0) {
        const fileName = await filesRepository.newFile(contents);
        const file = await filesRepository.getFileByPath(fileName);
        updatedFiles[file.path] = {
          ...file,
          content: contents,
          parentDir: filesRepository.defaultHomePath
        };

        setCurrentWorkingFile(updatedFiles[file.path]);
        setFiles(updatedFiles);

        autoSaveOnChange(updatedFiles);
      }
    } else {
      const updatedFile = {
        ...fileToUpdate,
        content: contents
      };

      if (files) {
        const newFiles = filesRepository.updateFile(files, updatedFile);
        setFiles(newFiles);
        autoSaveOnChange(newFiles);
      }
    }
  };

  const mapStateToNested = (
    oldFilesWithState: FileIndex,
    updatedFiles: FileIndex
  ) => {
    Object.keys(oldFilesWithState).forEach(key => {
      if (isDirectory(oldFilesWithState[key])) {
        const newFile = updatedFiles[key];
        const oldFile = oldFilesWithState[key];
        if (newFile && isDirectory(newFile) && isDirectory(oldFile)) {
          newFile.open = oldFile.open;

          if (newFile.files) {
            newFile.files = mapStateToNested(oldFile.files, newFile.files);

            updatedFiles[key] = newFile;
          }
        }
      }
    });

    return updatedFiles;
  };

  const fetchFilesAndMapToState = async () => {
    if (files) {
      const updatedFiles = await filesRepository.getAll();
      const updatedFilesWithState = mapStateToNested(files, updatedFiles);

      setFiles(updatedFilesWithState);
    }
  };

  const newFolder = async (folderName: string) => {
    await filesRepository.newFolder(folderName);
    await fetchFilesAndMapToState();
  };

  const updateFilename = async (fileName: string) => {
    const newFile = await filesRepository.updateFilename(
      fileName,
      currentWorkingFile
    );

    if (newFile) {
      setCurrentWorkingFile({
        ...(currentWorkingFile || ({} as FileWithContent)),
        ...newFile
      });
    }

    await fetchFilesAndMapToState();
  };

  const toggleFolderOpen = (folder: Folder) => {
    if (!files) {
      return;
    }

    const updatedFolder = {
      ...folder,
      open: !folder.open
    };

    const newFiles = filesRepository.updateFile(files, updatedFolder);
    setFiles(newFiles);
  };

  const loadFile = async (file: FileWithContent) => {
    if (file.isDirectory && file.isFile) {
      return setCurrentWorkingFile(file);
    }

    const serializedFile = await filesRepository.getFileByPath(file.path);
    setCurrentWorkingFile({
      ...serializedFile,
      ...file
    });
  };

  const showFileChangeForm = (
    item?: FileFromDir,
    refItem?: FileFromDir,
    type?: FileType
  ) => {
    filesDispatch({
      type: FileTypes.SET_FILENAME_FORM,
      payload: {
        isEditingFilename: true,
        filenameType: type,
        filenameChangeItem: item,
        filenameRefItem: refItem,
        filenameInputValue: item ? item.name : ""
      }
    });
  };

  useOnMount(() => {
    filesRepository
      .getAll()
      .then(results => setFiles(results))
      .catch(e => console.log(e));
  });

  return (
    <FilesContext.Provider
      value={{
        currentWorkingFile,
        setCurrentWorkingFile,
        files,
        setFiles,
        deleteFile,
        updateFile,
        updateFilename,
        newFolder,
        toggleFolderOpen,
        loadFile,
        isEditingFilename: fileNameForm.isEditingFilename,
        showFileChangeForm
      }}
    >
      {props.children}
      <Dialog.Container
        onModalHide={resetFilenameForm}
        visible={fileNameForm.isEditingFilename}
      >
        <Dialog.Title>{dialogTitle}</Dialog.Title>
        <Dialog.Input
          value={fileNameForm.filenameInputValue}
          onChangeText={updateFilenameFormInput}
          placeholder={"Enter Filename"}
        />
        <Dialog.Button
          onPress={() =>
            filesDispatch({
              type: FileTypes.SET_FILENAME_FORM,
              payload: { isEditingFilename: false }
            })
          }
          label="Cancel"
        />
        <Dialog.Button onPress={dialogOnSubmit} label="Submit" />
      </Dialog.Container>
    </FilesContext.Provider>
  );
};
