import React from "react";
import { createContext, useState, ReactNode } from "react";
import {
  useFilesRepository,
  isDirectory,
  FileIndex,
  FileWithContent,
  Folder
} from "../repositories/filesRepository";
import { useOnMount } from "../hooks/useOnMount";
import { useDebouncedCallback } from "use-debounce";
import Dialog from "react-native-dialog";

interface Props {
  children: ReactNode;
}

interface State {
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
  setIsEditingFilename: (toggle: boolean) => void;
}

const defaultState: State = {
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
  setIsEditingFilename: () => undefined
};

const DEBOUNCE = 1000;

export const FilesContext = createContext(defaultState);

export const FilesProvider = (props: Props) => {
  const filesRepository = useFilesRepository();
  const [currentWorkingFile, setCurrentWorkingFile] = useState<
    FileWithContent | undefined
  >(undefined);
  const [files, setFiles] = useState<FileIndex | undefined>(undefined);
  const [isEditingFilename, setIsEditingFilename] = useState(false);
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
        autoSaveOnChange(updatedFiles);
      }

      setFiles(updatedFiles);
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

  const showFileChangeForm = (item, type) => {
    setIsEditingFilename(true);
    console.log(item, type);
  }

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
        isEditingFilename,
        setIsEditingFilename,
        showFileChangeForm,
      }}
    >
      {props.children}
      <Dialog.Container visible={isEditingFilename}>
        <Dialog.Title>Rename file 'wetme' to</Dialog.Title>
        <Dialog.Input placeholder={"Enter Filename"} />
        <Dialog.Button onPress={() => setIsEditingFilename(false)} label="Cancel" />
        <Dialog.Button onPress={() => console.log('hello world')} label="Submit" />
      </Dialog.Container>
    </FilesContext.Provider>
  );
};
