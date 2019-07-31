import React from "react";
import { createContext, useEffect, useState, ReactNode } from "react";
import RNFS, { ReadDirItem } from "react-native-fs";

interface Props {
  children: ReactNode;
}

interface State {
  files: ReadDirItem[];
  setFiles: (files: ReadDirItem[]) => void;
  currentWorkingFile?: ReadDirItem;
  setCurrentWorkingFile: (file?: ReadDirItem) => void;
  getFiles: () => void;
}

const defaultState: State = {
  currentWorkingFile: undefined,
  files: [],
  setCurrentWorkingFile: () => undefined,
  setFiles: () => undefined,
  getFiles: () => undefined
};

export const FilesContext = createContext(defaultState);

const getReadableFilesOnly = (files: ReadDirItem[]) => {
  return files.filter(file => file.name.match(/\.(txt|md)$/i));
};

export const FilesProvider = (props: Props) => {
  const [currentWorkingFile, setCurrentWorkingFile] = useState<
    ReadDirItem | undefined
  >(undefined);
  const [files, setFiles] = useState<ReadDirItem[]>([]);

  const getFiles = () => {
    RNFS.readDir(RNFS.DocumentDirectoryPath)
      .then(result => {
        setFiles(getReadableFilesOnly(result));
      })
      .catch(err => {
        console.log(err.message, err.code);
      });
  };

  useEffect(() => {
    getFiles();
  }, []);

  return (
    <FilesContext.Provider
      value={{
        currentWorkingFile,
        setCurrentWorkingFile,
        files,
        setFiles,
        getFiles
      }}
    >
      {props.children}
    </FilesContext.Provider>
  );
};
