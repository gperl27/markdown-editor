import React, { ComponentProps, useContext } from "react";
import { Icon, ListItem } from "react-native-elements";
import { ItemProps, ListViewItem } from "../screens/Directory";
import {
  FileWithContent,
  Folder,
  isDirectory
} from "../repositories/filesRepository";
import { FilesContext } from "../contexts/FilesContext";

interface Props {
  item: ItemProps;
  onClickFolder?: (file: Folder) => void;
  onClickFile?: (file: FileWithContent) => void;
}

const getNameFromFilePath = (filepath: string) => {
  const fileChunks = filepath.split("/");

  return fileChunks[fileChunks.length - 1];
};

export const FileListItem = (props: Props) => {
  const { toggleFolderOpen } = useContext(FilesContext);

  const getListItemProps = (item: ListViewItem) => {
    const fileOrFolderProps: Partial<ComponentProps<typeof ListItem>> = {};

    const commonProps: Partial<ComponentProps<typeof ListItem>> = {
      containerStyle: {
        marginLeft: item.depth * 10
      }
    };

    const onClickFile = async () => {
      props.onClickFile && props.onClickFile(item);
    };

    const onClickFolder = () => {
      toggleFolderOpen(item as Folder);

      props.onClickFolder && props.onClickFolder(item as Folder);
    };

    if (isDirectory(item)) {
      fileOrFolderProps.chevron = true;
      fileOrFolderProps.leftIcon = <Icon name="folder" />;
      fileOrFolderProps.onPress = onClickFolder;
      fileOrFolderProps.onLongPress = () => console.log("long press mate");
    } else if (item.isFile()) {
      fileOrFolderProps.leftIcon = <Icon type="font-awesome" name="file" />;
      fileOrFolderProps.onPress = onClickFile;
      fileOrFolderProps.onLongPress = () => console.log("long press mate");
    }

    return {
      ...commonProps,
      ...fileOrFolderProps
    };
  };

  return (
    <ListItem
      title={getNameFromFilePath(props.item.item.path)}
      {...getListItemProps(props.item.item)}
    />
  );
};
