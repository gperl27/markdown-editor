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

interface Props {
  children: ReactNode;
}

interface State {
  files?: FileIndex;
  setFiles: (files: FileIndex) => void;
  currentWorkingFile?: FileWithContent;
  setCurrentWorkingFile: (file?: FileWithContent) => void;
  updateFile: (contents: string, file?: FileWithContent) => void;
  deleteFile: (item: FileWithContent) => void;
  updateFilename: (name: string) => void;
  newFolder: (folderName: string) => void;
  toggleFolderOpen: (folder: Folder) => void;
  loadFileFromCache: (path: FileWithContent) => void;
}

const defaultState: State = {
  currentWorkingFile: undefined,
  files: undefined,
  setCurrentWorkingFile: () => undefined,
  setFiles: () => undefined,
  updateFile: () => undefined,
  deleteFile: () => undefined,
  updateFilename: () => undefined,
  newFolder: () => undefined,
  toggleFolderOpen: () => undefined,
  loadFileFromCache: () => undefined
};

export const FilesContext = createContext(defaultState);

export const FilesProvider = (props: Props) => {
  const filesRepository = useFilesRepository();
  const [currentWorkingFile, setCurrentWorkingFile] = useState<
    FileWithContent | undefined
  >(undefined);
  const [files, setFiles] = useState<FileIndex | undefined>(undefined);

  const deleteFile = async (item: FileWithContent) => {
    if (files) {
      const newFiles = await filesRepository.deleteFile(files, item);
      setFiles(newFiles);
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
        filesRepository
          .syncFiles(updatedFiles)
          .then(() => console.log("filesync complete old file"));
      }
    } else {
      const updatedFile = {
        ...fileToUpdate,
        content: contents
      };

      if (files) {
        const newFiles = filesRepository.updateFile(files, updatedFile);
        setFiles(newFiles);
        filesRepository
          .syncFiles(newFiles)
          .then(() => console.log("filesync complete old file"));
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
    await filesRepository.updateFilename(fileName, currentWorkingFile);
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

  const loadFileFromCache = async (serializedFile: FileWithContent) => {
    const file = await filesRepository.getFileByPath(serializedFile.path);
    setCurrentWorkingFile({
      ...serializedFile,
      ...file
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
        loadFileFromCache
      }}
    >
      {props.children}
    </FilesContext.Provider>
  );
};
