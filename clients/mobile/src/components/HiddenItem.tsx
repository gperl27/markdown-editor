import React, { useState } from "react";
import { StyleSheet, TouchableHighlight, View } from "react-native";
import Tooltip from "react-native-walkthrough-tooltip";
import { Button, Text } from "react-native-elements";
import { FileWithContent } from "../repositories/filesRepository";

export interface HiddenItemProps {
  onDeleteItem(item: FileWithContent): void;
  onRenameItem?(item: FileWithContent): void;
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

  return (
    <View style={styles.rowBack}>
      <Tooltip
        animated
        isVisible={showTooltip}
        content={
          <View>
            <Button type={"clear"} onPress={onDeleteItem} title={"Delete"} />
          </View>
        }
        placement="top"
        onClose={() => setShowTooltip(false)}
      >
        <TouchableHighlight onPress={() => setShowTooltip(true)}>
          <Text>Delete</Text>
        </TouchableHighlight>
      </Tooltip>
      <TouchableHighlight
        onPress={() =>
          hiddenItemProps.onRenameItem && hiddenItemProps.onRenameItem(item)
        }
      >
        <Text>Rename</Text>
      </TouchableHighlight>
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
