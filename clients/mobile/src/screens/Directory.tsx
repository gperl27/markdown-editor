import { View } from "react-native";
import { Header, Icon, Text } from "react-native-elements";
import { SwipeListView } from "react-native-swipe-list-view";
import React, { ComponentProps, useContext } from "react";
import {
  FileFromDir,
  FileIndex,
  FileWithContent,
  Folder,
  isDirectory
} from "../repositories/filesRepository";
import { FilesContext } from "../contexts/FilesContext";
import { HiddenItem, HiddenItemProps } from "../components/HiddenItem";
import { FileListItem } from "../components/FileListItem";

export type ListViewItem = FileFromDir & {
  depth: number;
  hiddenItemProps?: HiddenItemProps;
};

interface Props {
  viewProps: Partial<ComponentProps<typeof View>>;
  onDeleteFile: (file: FileFromDir) => void;
  onRenameItem: (file: FileFromDir) => void;
  onClickFolder?: (file: Folder) => void;
  onClickFile?: (file: FileWithContent) => void;
}

export interface ItemProps {
  item: ListViewItem;
  index: number;
  separators: any;
}

const transformFileIndexToArrayLike = (
  filesToTransform?: FileIndex,
  depth: number = 0
) => {
  const transformedFiles: ListViewItem[] = [];

  if (!filesToTransform) {
    return [];
  }

  Object.keys(filesToTransform).forEach(key => {
    const currentFile = filesToTransform[key];

    transformedFiles.push({
      ...currentFile,
      depth
    });

    // only show subtree if directory is "open"
    if (isDirectory(currentFile) && currentFile.files && currentFile.open) {
      transformedFiles.push(
        ...transformFileIndexToArrayLike(currentFile.files, depth + 1)
      );
    }
  });

  return transformedFiles;
};

export const Directory = (props: Props) => {
  const { files } = useContext(FilesContext);

  const renderHiddenItem = ({ item }: { item: FileWithContent }) => {
    const hiddenItemProps = {
      onDeleteItem: () => props.onDeleteFile(item),
      onRenameItem: () => console.log("rename me")
    };

    return <HiddenItem item={item} hiddenItemProps={hiddenItemProps} />;
  };

  const renderFile = (item: ItemProps) => {
    return <FileListItem item={item} {...props} />;
  };

  return (
    <View {...props.viewProps}>
      <Header
        backgroundColor={"lavender"}
        centerComponent={<Text h2={true}>Files</Text>}
        rightComponent={<Icon name={"files-o"} />}
      />
      <SwipeListView
        keyExtractor={(item, index) => index.toString()}
        data={transformFileIndexToArrayLike(files)}
        renderItem={renderFile}
        renderHiddenItem={renderHiddenItem}
        rightOpenValue={-150}
        leftOpenValue={75}
        stopRightSwipe={-225}
        stopLeftSwipe={1}
        closeOnScroll={true}
        closeOnRowPress={true}
      />
    </View>
  );
};
