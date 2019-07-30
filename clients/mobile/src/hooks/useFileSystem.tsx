import RNFS, { ReadDirItem } from "react-native-fs";
import { useEffect, useState } from "react";

const DEFAULT_FILENAME = "/untitled.md";
export const defaultPath = RNFS.DocumentDirectoryPath + DEFAULT_FILENAME;

const getReadableFilesOnly = (files: ReadDirItem[]) => {
  return files.filter(file => file.name.match(/\.(txt|md)$/i));
};

export const useFileSystem = () => {
  const [currentWorkingPath, setCurrentWorkingPath] = useState<
    string | undefined
  >(undefined);
  const [files, setFiles] = useState<ReadDirItem[]>([]);

  useEffect(() => {
    RNFS.readDir(RNFS.DocumentDirectoryPath)
      .then(result => {
        setFiles(getReadableFilesOnly(result));
      })
      .catch(err => {
        console.log(err.message, err.code);
      });
  }, []);

  return {
    files,
    currentWorkingPath,
    setCurrentWorkingPath
  };
};
