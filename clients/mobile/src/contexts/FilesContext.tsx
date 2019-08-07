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
  toggleFolderOpen: (folder: Folder) => void;
}

export interface FileWithContent extends ReadDirItem {
  parentDir: string;
  content?: string;
}

export interface Folder extends ReadDirItem {
  files: FileIndex;
  open: boolean;
  parentDir: string;
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
  newFolder: () => undefined,
  toggleFolderOpen: () => undefined
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
  filesToIndex: ReadDirItem[],
  parentDir: string = RNFS.DocumentDirectoryPath
): Promise<FileIndex> => {
  let fileIndex: FileIndex = {};

  for (let i = 0; i < filesToIndex.length; i++) {
    const file = filesToIndex[i];

    if (file.isFile()) {
      const content = await RNFS.readFile(file.path);

      fileIndex[file.path] = {
        ...file,
        content,
        parentDir
      };
    } else if (file.isDirectory()) {
      fileIndex[file.path] = {
        ...file,
        open: true,
        files: await generateFileIndex(
          await RNFS.readDir(file.path),
          file.path
        ),
        parentDir
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

function isDirectory(file: any): file is Folder {
  return file.isDirectory();
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
      const newFiles = deleteNestedFile(files, item);
      setFiles(newFiles);
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
          content: contents,
          parentDir: RNFS.DocumentDirectoryPath
        };
        setCurrentWorkingFile(updatedFiles[file.path]);
      }
    } else {
      const updatedFile = {
        ...fileToUpdate,
        content: contents
      };

      const newFiles = updateNestedFile(files, updatedFile);
      setFiles(newFiles);
    }

    setFiles(updatedFiles);
    syncFiles(updatedFiles).then(() => console.log("filesync complete"));
  };

  const mapStateToNested = (
    oldFilesWithState: FileIndex,
    updatedFiles: FileIndex
  ) => {
    Object.keys(oldFilesWithState).forEach(key => {
      if (isDirectory(oldFilesWithState[key])) {
        if (updatedFiles[key] && isDirectory(updatedFiles[key])) {
          updatedFiles[key].open = oldFilesWithState[key].open;

          if (updatedFiles[key].files) {
            updatedFiles[key].files = mapStateToNested(
              oldFilesWithState[key].files,
              updatedFiles[key].files
            );
          }
        }
      }
    });

    return updatedFiles;
  };

  const newFolder = async (folderName: string) => {
    if (!files) {
      return;
    }

    const folder = RNFS.DocumentDirectoryPath + `/${folderName}`;

    await RNFS.mkdir(folder);

    const results = await getFilesFromDir();
    const updatedFiles = await computedFiles(results);

    const updatedFilesWithState = mapStateToNested(files, updatedFiles);
    setFiles(updatedFilesWithState);
  };

  const syncFiles = async (filesToSync: FileIndex) => {
    return Promise.all(
      Object.keys(filesToSync).map(filepath => {
        const file = filesToSync[filepath];

        if (isFile(file)) {
          return RNFS.writeFile(filepath, file.content || "");
        } else if (isDirectory(file)) {
          return syncFiles(file.files);
        }
      })
    );
  };

  const getExistingFilePrefix = (fileToProcess: ReadDirItem) => {
    return fileToProcess.path
      .split("/")
      .slice(0, -1)
      .join("/");
  };

  const updateFilename = async (fileName: string) => {
    if (currentWorkingFile) {
      if (await RNFS.exists(currentWorkingFile.path)) {
        const newFileName =
          getExistingFilePrefix(currentWorkingFile) + `/${fileName}.md`;

        await RNFS.moveFile(currentWorkingFile.path, newFileName);
      }
    } else {
      const newFileName = RNFS.DocumentDirectoryPath + `/${fileName}.md`;
      await RNFS.writeFile(newFileName, "");
    }

    const results = await getFilesFromDir();
    const updatedFiles = await computedFiles(results);

    const updatedFilesWithState = mapStateToNested(files, updatedFiles);
    setFiles(updatedFilesWithState);
  };

  const updateNestedFile = (
    parentDirFiles: FileIndex,
    fileWithChanges: FileWithContent | Folder
  ) => {
    const updatedFiles = Object.assign({}, parentDirFiles);

    if (updatedFiles[fileWithChanges.path]) {
      updatedFiles[fileWithChanges.path] = fileWithChanges;

      return updatedFiles;
    }

    const parentFolder = updatedFiles[fileWithChanges.parentDir];

    if (parentFolder && isDirectory(parentFolder)) {
      parentFolder.files = updateNestedFile(
        parentFolder.files,
        fileWithChanges
      );

      return updatedFiles;
    }

    return updatedFiles;
  };

  const deleteNestedFile = (
    parentDirFiles: FileIndex,
    fileToDelete: FileWithContent | Folder
  ) => {
    const updatedFiles = Object.assign({}, parentDirFiles);

    if (updatedFiles[fileToDelete.path]) {
      delete updatedFiles[fileToDelete.path];

      return updatedFiles;
    }

    const parentFolder = updatedFiles[fileToDelete.parentDir];

    if (parentFolder && isDirectory(parentFolder)) {
      parentFolder.files = deleteNestedFile(parentFolder.files, fileToDelete);

      return updatedFiles;
    }

    return updatedFiles;
  };

  const toggleFolderOpen = (folder: Folder) => {
    if (!files) {
      return;
    }

    const updatedFolder = {
      ...folder,
      open: !folder.open
    };

    const newFiles = updateNestedFile(files, updatedFolder);
    setFiles(newFiles);
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
        newFolder,
        toggleFolderOpen
      }}
    >
      {props.children}
    </FilesContext.Provider>
  );
};
