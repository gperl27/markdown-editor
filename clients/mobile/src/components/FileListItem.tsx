import React, { ComponentProps, useContext } from "react";
import { Icon, ListItem, Text } from "react-native-elements";
import { ItemProps, ListViewItem } from "../screens/Directory";
import {
  FileWithContent,
  Folder,
  isDirectory
} from "../repositories/filesRepository";
import { FilesContext } from "../contexts/FilesContext";
import { TouchableWithoutFeedback, View } from "react-native";

interface Props extends ComponentProps<typeof ListItem> {
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
        marginLeft: item.depth * 42
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
    } else if (item.isFile()) {
      fileOrFolderProps.leftIcon = <Icon name="file" />;
      fileOrFolderProps.onPress = onClickFile;
    }

    return {
      ...commonProps,
      ...fileOrFolderProps
    };
  };

  const itemProps = getListItemProps(props.item.item);

  const getFolderArrow = () => {
    if (
      isDirectory(props.item.item) &&
      Object.keys(props.item.item.files).length > 0
    ) {
      console.log(props.item.item);
      const angle = props.item.item.open ? "angle-down" : "angle-right";

      return (
        <Icon containerStyle={{ marginRight: 5 }} size={24} name={angle} />
      );
    }

    return null;
  };

  return (
    <TouchableWithoutFeedback
      onLongPress={props.onLongPress}
      onPress={() => {
        itemProps.onPress && itemProps.onPress();
      }}
      style={{
        width: "100%"
      }}
    >
      <View
        style={[
          {
            flex: 1,
            backgroundColor: "transparent",
            width: "85%",
            flexDirection: "row",
            justifyContent: "flex-start",
            alignItems: "center"
          }
        ]}
      >
        {getFolderArrow()}
        {itemProps.leftIcon}
        <Text style={{ marginLeft: 10 }}>
          {getNameFromFilePath(props.item.item.path)}
        </Text>
        <View />
      </View>
    </TouchableWithoutFeedback>
  );
};
