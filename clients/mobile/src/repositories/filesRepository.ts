import RNFS, { ReadDirItem, StatResult } from "react-native-fs";

export function isFile(file: any): file is FileWithContent {
  return file.isFile();
}

export function isDirectory(file: any): file is Folder {
  return Object.keys(file).length > 0 && file.isDirectory();
}

interface FilesInterface<
  T = FileIndex,
  P = FileFromDir,
  K = ReadDirItem,
  FileDataStructure = T | T[]
> {
  getAll(): Promise<FileDataStructure>;
  deleteFile(files: T, file: P): Promise<void>;
  updateFile(files: T, file: P): FileDataStructure | Promise<FileDataStructure>;
  updateFilename(fileName: string, file: P): Promise<P>;
  syncFiles(files: T): Promise<void>;
  newFolder(folderName: string): Promise<void>;
  newFile(contents: string): Promise<string>;
  getFileByPath(path: string): Promise<K>;
}

export interface FileWithContent extends ReadDirItem {
  parentDir: string;
  content?: string;
}

export interface Folder extends ReadDirItem {
  files: FileIndex;
  parentDir: string;
  open: boolean;
}

export type FileFromDir = FileWithContent | Folder;

export interface FileIndex {
  [key: string]: FileFromDir;
}

export class FilesRepository implements FilesInterface {
  readonly defaultHomePath = RNFS.DocumentDirectoryPath;

  newFolder(folderName: string): Promise<void> {
    const folder = this.defaultHomePath + `/${folderName}`;

    return RNFS.mkdir(folder);
  }

  createPathFromFile(file: FileFromDir) {
    if (!file.path.includes("Documents/")) {
      return "";
    }

    const paths = file.path.split("Documents/");
    let pathBuilder = "";
    paths[1].split("/").forEach(dir => {
      pathBuilder += `/${dir}`;
    });

    console.log(pathBuilder, "PATHBUILDER");

    return pathBuilder;
  }

  private getParentDirs(file: FileFromDir) {
    const paths = file.parentDir.split("Documents/");
    let pathBuilder = "";
    return paths[1].split("/").map(dir => {
      pathBuilder += `/${dir}`;

      return this.defaultHomePath + pathBuilder;
    });
  }

  updateFile(files: FileIndex, file: FileFromDir, depth = 0) {
    const updatedFiles = Object.assign({}, files);

    if (updatedFiles[file.path]) {
      updatedFiles[file.path] = file;

      return updatedFiles;
    }

    const walkPathKeys = this.getParentDirs(file);
    const parentFolder = updatedFiles[walkPathKeys[depth]]
      ? Object.assign({}, updatedFiles[walkPathKeys[depth]])
      : undefined;

    if (parentFolder && isDirectory(parentFolder)) {
      parentFolder.files = this.updateFile(parentFolder.files, file, depth + 1);

      return {
        ...updatedFiles,
        [parentFolder.path]: parentFolder
      };
    }

    return updatedFiles;
  }

  deleteFile(files: FileIndex, file: FileFromDir) {
    try {
      return RNFS.unlink(file.path);
    } catch (e) {
      throw e;
    }
  }

  private async generateIndex(
    files: ReadDirItem[],
    parentDir: string = this.defaultHomePath
  ): Promise<FileIndex> {
    const fileIndex: FileIndex = {};

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

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
          files: await this.generateIndex(
            await RNFS.readDir(file.path),
            file.path
          ),
          parentDir
        };
      }
    }

    return fileIndex;
  }

  async getAll() {
    const results = await this.getFilesFromFS();
    const computedFiles = this.getReadableFilesOnly(results);

    return this.generateIndex(computedFiles);
  }

  private getFilesFromFS(folderPath: string = "") {
    return RNFS.readDir(this.defaultHomePath + `/${folderPath}`);
  }

  private getExistingFilePrefix = (fileToProcess: ReadDirItem) => {
    return fileToProcess.path
      .split("/")
      .slice(0, -1)
      .join("/");
  };

  private getReadableFilesOnly = (files: ReadDirItem[]) => {
    return files.filter(file => {
      return (
        file.name.match(/\.(txt|md)$/i) ||
        (file.name !== "RCTAsyncLocalStorage_V1" && file.isDirectory())
      );
    });
  };

  async updateFilename(fileName: string, file?: FileFromDir) {
    if (fileName.match(/\.\w+/g)) {
      throw new Error("Invalid filename");
    }

    if (file) {
      if (await RNFS.exists(file.path)) {
        const root = this.getExistingFilePrefix(file);
        const newFileName = root + `/${fileName}.md`;

        await RNFS.moveFile(file.path, newFileName);

        return {
          ...(await this.getFileByPath(newFileName)),
          parentDir: root
        };
      }
    }

    const newFileName = this.defaultHomePath + `/${fileName}.md`;
    await RNFS.writeFile(newFileName, "");

    return {
      ...(await this.getFileByPath(newFileName)),
      parentDir: this.defaultHomePath
    };
  }

  syncFiles(files: FileIndex): Promise<any> {
    return Promise.all(
      Object.keys(files).map(filepath => {
        const file = files[filepath];

        if (isFile(file)) {
          return RNFS.writeFile(filepath, file.content || "");
        } else if (isDirectory(file)) {
          return this.syncFiles(file.files);
        }
      })
    );
  }

  async getFileByPath(path: string) {
    return FilesRepository.adaptStatFile(await RNFS.stat(path));
  }

  private static normalizeFilename(contents: string) {
    return contents.slice(0, 10).replace(/\s+/, "");
  }

  async newFile(contents: string) {
    const fileName =
      RNFS.DocumentDirectoryPath +
      `/${FilesRepository.normalizeFilename(contents)}.md`;
    await RNFS.writeFile(fileName, contents);

    return fileName;
  }

  static adaptStatFile = (file: StatResult): ReadDirItem => {
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
}

export const useFilesRepository = () => new FilesRepository();
