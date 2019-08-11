import React, { useState } from "react";
import { StyleSheet, TouchableHighlight, View } from "react-native";
import Tooltip from "react-native-walkthrough-tooltip";
import { Button, Text } from "react-native-elements";
import { FileWithContent } from "../repositories/filesRepository";

export type FileType = "file" | "folder";

export interface HiddenItemProps {
  onDeleteItem(item: FileWithContent): void;
  onRenameItem?(item: FileWithContent): void;
  onNewFile?(item: FileWithContent, type: FileType): void;
}

export interface HiddenItem {
  item: FileWithContent;
  hiddenItemProps: HiddenItemProps;
}

export const HiddenItem = (props: HiddenItem) => {
  const { item, hiddenItemProps } = props;
  const [showTooltip, setShowTooltip] = useState(false);

  const onDeleteItem = () => {
    hiddenItemProps.onDeleteItem(item);
    setShowTooltip(false);
  };

  const onNewFile = (type: FileType) => {
      console.log(type, "OMG TYPE")
      setShowTooltip(false);

      hiddenItemProps.onNewFile && hiddenItemProps.onNewFile(item, type);
  }

  return (
    <View style={styles.rowBack}>
      <Tooltip
          animated
          isVisible={showTooltip}
          tooltipStyle={{ padding: 0, margin: 0 }}
          contentStyle={{ padding: 0, backgroundColor: "red" }}
          content={
            <View style={{ flexDirection: "row", width: 150, alignContent: "center", justifyContent: "space-evenly" }}>
              <Button type={"solid"} containerStyle={{ flex: 1 }} onPress={() => onNewFile("file")} title={"File"} />
              <Button type={"solid"} containerStyle={{ flex: 1 }} onPress={() => onNewFile("folder")} title={"Folder"} />
            </View>
          }
          placement="top"
          onClose={() => setShowTooltip(false)}
      >
        <TouchableHighlight style={{ backgroundColor: "blue"}} onPress={() => setShowTooltip(true)}>
          <Text>New</Text>
        </TouchableHighlight>
      </Tooltip>
      <TouchableHighlight
          style={{ backgroundColor: "yellow" }}
          onPress={() =>
              hiddenItemProps.onRenameItem && hiddenItemProps.onRenameItem(item)
          }
      >
        <Text>Edit</Text>
      </TouchableHighlight>
      {/*<Tooltip*/}
      {/*  animated*/}
      {/*  isVisible={showTooltip}*/}
      {/*  content={*/}
      {/*    <View>*/}
      {/*      <Button type={"clear"} onPress={onDeleteItem} title={"Delete"} />*/}
      {/*    </View>*/}
      {/*  }*/}
      {/*  placement="top"*/}
      {/*  onClose={() => setShowTooltip(false)}*/}
      {/*>*/}
      {/*  <TouchableHighlight style={{ backgroundColor: "red"}} onPress={() => setShowTooltip(true)}>*/}
      {/*    <Text>Delete</Text>*/}
      {/*  </TouchableHighlight>*/}
      {/*</Tooltip>*/}
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
  },
  rowFront: {
    alignItems: "center",
    backgroundColor: "#CCC",
    borderBottomColor: "black",
    borderBottomWidth: 1,
    justifyContent: "center",
    height: 50
  }
});
