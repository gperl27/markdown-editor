import React from "react";
import { createContext, useState, ReactNode } from "react";
import {
  useFilesRepository,
  isDirectory,
  FileIndex,
  FileWithContent,
  Folder, FileFromDir
} from "../repositories/filesRepository";
import { useOnMount } from "../hooks/useOnMount";
import { useDebouncedCallback } from "use-debounce";
import Dialog from "react-native-dialog";

interface Props {
  children: ReactNode;
}

export type FileType = "file" | "folder";

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
  showFileChangeForm: (item: any, type: FileType) => void;
  filenameChangeItem?: FileFromDir;
  filenameType?: FileType;
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
  showFileChangeForm: () => undefined
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
  const [filenameChangeItem, setFilenameChangeItem] = useState<FileFromDir | undefined>(undefined);
  const [filenameType, setFilenameType] = useState<FileType | undefined>(undefined);
  const [newFilename, setNewFilename] = useState("");


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

  const showFileChangeForm = (item?: FileFromDir, type?: FileType) => {
    setFilenameChangeItem(item);
    setFilenameType(type);

    if (item) {
      setNewFilename(item.name);
    }

    setIsEditingFilename(true);
  }

  const getProperFilenameFromItem = (filename: string, item?: FileFromDir) => {
    if (!item) {
      return filename;
    }

    return filesRepository.createPathFromFile(item) + `/${filename}`;
  }

  const getPropsForFilenameDialog = (rootItem?: FileFromDir, type: FileType = "file") => {
    let props: { noun?: string, onSubmit?: (filename: string) => void} = {};

    if (type === "file") {
     props.title = rootItem ? `Rename file ${rootItem.name} to `: "New file";
     props.onSubmit = async () => {
       console.log(newFilename, 'SUBMIT FILENAME')
       await updateFilename(getProperFilenameFromItem(newFilename))
     }
    } else {
      props.title = rootItem ? `Rename folder ${rootItem.name} to `: "New folder";
      props.onSubmit = async () => {
        console.log(newFilename, 'SUBMIT NEW FOLDERNAME')
       await newFolder(getProperFilenameFromItem(newFilename))
      }
    }

    return props;
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
        showFileChangeForm,
      }}
    >
      {props.children}
      <Dialog.Container visible={isEditingFilename}>
        <Dialog.Title>{getPropsForFilenameDialog(filenameChangeItem, filenameType).title}</Dialog.Title>
        <Dialog.Input
            value={newFilename}
            onChangeText={setNewFilename}
            placeholder={"Enter Filename"} />
        <Dialog.Button onPress={() => {
          setIsEditingFilename(false)
          setFilenameChangeItem(undefined);
          setFilenameType(undefined);
        }} label="Cancel" />
        <Dialog.Button onPress={getPropsForFilenameDialog(filenameChangeItem, filenameType).onSubmit} label="Submit" />
      </Dialog.Container>
    </FilesContext.Provider>
  );
};
