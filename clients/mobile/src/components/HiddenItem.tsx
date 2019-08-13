import React from "react";
import { StyleSheet, View } from "react-native";
import { FileType } from "../contexts/FilesContext";
import { HiddenNewButton } from "./HiddenNewButton";
import { HiddenDeleteButton } from "./HiddenDeleteButton";
import { HiddenEditButton } from "./HiddenEditButton";

export interface HiddenItemProps {
  onDeleteItem?(): void;
  onRenameItem?(): void;
  onNewFile?(type: FileType): void;
}

export interface HiddenItem {
  hiddenItemProps: HiddenItemProps;
}

export const HiddenItem = (props: HiddenItem) => {
  const { hiddenItemProps } = props;

  const onDeleteItem = () => {
    hiddenItemProps.onDeleteItem && hiddenItemProps.onDeleteItem();
  };

  const onNewFile = (type: FileType) => {
    hiddenItemProps.onNewFile && hiddenItemProps.onNewFile(type);
  };

  const onRenameFile = () => {
    hiddenItemProps.onRenameItem && hiddenItemProps.onRenameItem();
  };

  return (
    <View style={styles.rowBack}>
      <HiddenNewButton onNewFile={onNewFile} />
      <HiddenDeleteButton onDeleteItem={onDeleteItem} />
      <HiddenEditButton onRenameItem={onRenameFile} />
    </View>
  );
};

const styles = StyleSheet.create({
  rowBack: {
    alignItems: "center",
    backgroundColor: "#DDD",
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingRight: 15
  }
});
