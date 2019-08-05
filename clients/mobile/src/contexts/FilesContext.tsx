import React from "react";
import { createContext, useEffect, useState, ReactNode } from "react";
import RNFS, { ReadDirItem, StatResult } from "react-native-fs";

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
}

export interface FileWithContent extends ReadDirItem {
  content?: string;
}

export interface Folder extends ReadDirItem {
  files: FileIndex;
  open: boolean;
}

export interface FileIndex {
  [key: string]: FileWithContent | Folder;
}

const defaultState: State = {
  currentWorkingFile: undefined,
  files: undefined,
  setCurrentWorkingFile: () => undefined,
  setFiles: () => undefined,
  updateFile: () => undefined,
  deleteFile: () => undefined,
  updateFilename: () => undefined,
  newFolder: () => undefined
};

export const FilesContext = createContext(defaultState);

const getFilesFromDir = (folderPath: string = "") => {
  return RNFS.readDir(RNFS.DocumentDirectoryPath + `/${folderPath}`);
};

const getReadableFilesOnly = (files: ReadDirItem[]) => {
  return files.filter(file => {
    return (
      file.name.match(/\.(txt|md)$/i) ||
      (file.name !== "RCTAsyncLocalStorage_V1" && file.isDirectory())
    );
  });
};

const generateFileIndex = async (
  filesToIndex: ReadDirItem[]
): Promise<FileIndex> => {
  let fileIndex: FileIndex = {};

  for (let i = 0; i < filesToIndex.length; i++) {
    const file = filesToIndex[i];

    if (file.isFile()) {
      const content = await RNFS.readFile(file.path);

      fileIndex[file.path] = {
        ...file,
        content
      };
    } else if (file.isDirectory()) {
      fileIndex[file.path] = {
        ...file,
        open: false,
        files: await generateFileIndex(await RNFS.readDir(file.path))
      };
    }
  }

  return fileIndex;
};

const computedFiles = async (files: ReadDirItem[]) =>
  await generateFileIndex(getReadableFilesOnly(files));

function isFile(file: any): file is FileWithContent {
  return file.isFile();
}

function isDirectory(file: any): file is ReadDirItem {
  return file.isDirectory() && file.content !== undefined;
}

export const FilesProvider = (props: Props) => {
  const [currentWorkingFile, setCurrentWorkingFile] = useState<
    FileWithContent | undefined
  >(undefined);
  const [files, setFiles] = useState<FileIndex | undefined>(undefined);

  const getFiles = async () => {
    const results = await getFilesFromDir();

    setFiles(await computedFiles(results));
  };

  const deleteFile = async (item: FileWithContent) => {
    await RNFS.unlink(item.path);
    if (files) {
      const updatedFiles = Object.assign({}, files);
      delete updatedFiles[item.path];

      setFiles(updatedFiles);
    }
  };

  const adaptStatFile = (file: StatResult): ReadDirItem => {
    return {
      isDirectory: file.isDirectory,
      isFile: file.isFile,
      mtime: (file.ctime as unknown) as Date,
      name: "",
      path: file.path,
      size: file.size,
      ctime: (file.ctime as unknown) as Date
    };
  };

  const normalizeFilename = (contents: string) => {
    return contents.slice(0, 10).replace(/\s+/, "");
  };

  const updateFile = async (
    contents: string,
    fileToUpdate?: FileWithContent
  ) => {
    const updatedFiles = Object.assign({}, files);

    if (!fileToUpdate) {
      if (contents.length > 0) {
        const fileName =
          RNFS.DocumentDirectoryPath + `/${normalizeFilename(contents)}.md`;
        await RNFS.writeFile(fileName, contents);
        const file = adaptStatFile(await RNFS.stat(fileName));
        updatedFiles[file.path] = {
          ...file,
          content: contents
        };
        setCurrentWorkingFile(updatedFiles[file.path]);
      }
    } else {
      const file = updatedFiles[fileToUpdate.path];

      if (isFile(file)) {
        fileToUpdate.content = contents;
      }
    }

    setFiles(updatedFiles);
    syncFiles(updatedFiles).then(() => console.log("filesync complete"));
  };

  const newFolder = async (folderName: string) => {
    const folder = RNFS.DocumentDirectoryPath + `/${folderName}`;

    await RNFS.mkdir(folder);

    const folderFromFS = adaptStatFile(await RNFS.stat(folder));
    const updatedFiles = Object.assign({}, files);

    updatedFiles[folder] = folderFromFS;
    setFiles(updatedFiles);
  };

  const syncFiles = async (filesToSync: FileIndex) => {
    return Promise.all(
      Object.keys(filesToSync).map(filepath => {
        const file = filesToSync[filepath];

        if (isFile(file)) {
          return RNFS.writeFile(filepath, file.content || "");
        }
      })
    );
  };

  const getExistingFilePrefix = (fileToProcess: FileWithContent) => {
    return fileToProcess.path
      .split("/")
      .slice(0, -1)
      .join("/");
  };

  const updateFilename = async (fileName: string) => {
    const updatedFiles = Object.assign({}, files);

    if (currentWorkingFile) {
      if (await RNFS.exists(currentWorkingFile.path)) {
        const newFileName =
          getExistingFilePrefix(currentWorkingFile) + `/${fileName}.md`;

        await RNFS.moveFile(currentWorkingFile.path, newFileName);

        const newFile = {
          ...currentWorkingFile,
          path: newFileName
        };

        updatedFiles[newFileName] = newFile;
        setCurrentWorkingFile(newFile);
        delete updatedFiles[currentWorkingFile.path];
        setFiles(updatedFiles);
      }
    } else {
      const newFileName = RNFS.DocumentDirectoryPath + `/${fileName}.md`;

      await RNFS.writeFile(newFileName, "");
      const file = adaptStatFile(await RNFS.stat(newFileName));
      updatedFiles[file.path] = {
        ...file,
        content: ""
      };
      setCurrentWorkingFile(updatedFiles[file.path]);
      setFiles(updatedFiles);
    }
  };

  useEffect(() => {
    getFiles().catch(e => console.log(e));
  }, []);

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
        newFolder
      }}
    >
      {props.children}
    </FilesContext.Provider>
  );
};
