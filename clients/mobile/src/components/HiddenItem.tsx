import React, { ComponentProps } from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { FileType } from "../contexts/FilesContext";
import { HiddenNewButton } from "./HiddenNewButton";
import { HiddenDeleteButton } from "./HiddenDeleteButton";
import { HiddenEditButton } from "./HiddenEditButton";

export interface HiddenItemProps {
  onDeleteItem?(): void;
  onRenameItem?(): void;
  onNewFile?(type: FileType): void;
}

export interface HiddenItem extends ViewProps {
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
    <View {...props} style={[styles.container, props.style]}>
      <HiddenNewButton onNewFile={onNewFile} />
      <HiddenDeleteButton onDeleteItem={onDeleteItem} />
      <HiddenEditButton onRenameItem={onRenameFile} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-end"
  }
});
