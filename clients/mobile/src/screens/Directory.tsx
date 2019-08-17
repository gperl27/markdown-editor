import { View, StyleSheet, TouchableHighlight } from "react-native";
import { Header, Icon, Text } from "react-native-elements";
import { SwipeRow } from "react-native-swipe-list-view";
import DraggableFlatList from "react-native-draggable-flatlist";
import React, { ComponentProps, useContext, useState } from "react";
import {
  FileFromDir,
  FileIndex,
  FileWithContent,
  Folder,
  isDirectory
} from "../repositories/filesRepository";
import { FilesContext, FileType } from "../contexts/FilesContext";
import { HiddenItem, HiddenItemProps } from "../components/HiddenItem";
import { FileListItem } from "../components/FileListItem";

export type ListViewItem = FileFromDir & {
  depth: number;
  hiddenItemProps?: HiddenItemProps;
};

interface Props {
  viewProps: Partial<ComponentProps<typeof View>>;
  onDeleteItem?: (file: FileFromDir) => void;
  onClickFolder?: (file: Folder) => void;
  onClickFile?: (file: FileWithContent) => void;
  onShowFileChangeForm?: (
    file?: FileFromDir,
    refItem?: FileFromDir,
    type?: FileType
  ) => void;
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
  const { files, showFileChangeForm, deleteFile } = useContext(FilesContext);
  const [isSelecting, setIsSelecting] = useState(false);

  const onDeleteItem = (item: FileFromDir) => {
    deleteFile(item);

    props.onDeleteItem && props.onDeleteItem(item);
  };

  const onRenameItem = (item: FileFromDir) => {
    showFileChangeForm(item);

    props.onShowFileChangeForm && props.onShowFileChangeForm(item);
  };

  const onNewFile = (item: FileFromDir, type: FileType) => {
    showFileChangeForm(undefined, item, type);

    props.onShowFileChangeForm &&
      props.onShowFileChangeForm(undefined, item, type);
  };

  const renderFile = (item: ItemProps) => {
    const hiddenItemProps = {
      onDeleteItem: () => onDeleteItem(item.item),
      onRenameItem: () => onRenameItem(item.item),
      onNewFile: (type: FileType) => onNewFile(item.item, type)
    };

    console.log(item.isActive, "IS ACTIVE");

    return (
      <SwipeRow
        rightOpenValue={-150}
        leftOpenValue={75}
        stopRightSwipe={-225}
        stopLeftSwipe={1}
        closeOnRowPress={true}
      >
        <HiddenItem
          style={styles.standaloneRowBack}
          hiddenItemProps={hiddenItemProps}
        />
        <TouchableHighlight
          style={[
            styles.standaloneRowFront,
            { backgroundColor: item.isActive ? "pink" : "white" }
          ]}
          onLongPress={item.move}
          onPressOut={item.moveEnd}
        >
          <FileListItem
            item={item}
            onLongPress={item.move}
            onClickFile={props.onClickFile}
            onClickFolder={props.onClickFolder}
          />
        </TouchableHighlight>
      </SwipeRow>
    );
  };

  return (
    <View {...props.viewProps}>
      <Header
        backgroundColor={"lavender"}
        centerComponent={<Text h2={true}>Files</Text>}
        rightComponent={
          <Icon onPress={() => setIsSelecting(true)} name={"files-o"} />
        }
      />
      <DraggableFlatList
        data={transformFileIndexToArrayLike(files)}
        renderItem={renderFile}
        keyExtractor={(item, index) => index.toString()}
        scrollPercent={5}
        onMoveEnd={data => {
          console.log(data, "ON MOVE END - call move file");
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  standaloneRowFront: {
    alignItems: "center",
    backgroundColor: "white",
    justifyContent: "center",
    flex: 1,
    height: 50
  },
  standaloneRowBack: {
    flex: 1,
    height: 50
  }
});
