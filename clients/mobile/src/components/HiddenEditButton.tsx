import { TouchableHighlight, View } from "react-native";
import { Button, Text } from "react-native-elements";
import React, { useState } from "react";
import Tooltip from "react-native-walkthrough-tooltip";

interface Props {
  onRenameItem?: () => void;
}

export const HiddenEditButton = (props: Props) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const onRenameItem = () => {
    setShowTooltip(false);
    props.onRenameItem && props.onRenameItem();
  };

  return (
    <Tooltip
      animated
      isVisible={showTooltip}
      tooltipStyle={{ padding: 0, margin: 0 }}
      contentStyle={{ padding: 0, backgroundColor: "red" }}
      content={
        <View
          style={{
            flexDirection: "row",
            width: 150,
            alignContent: "center",
            justifyContent: "space-evenly"
          }}
        >
          <Button
            type={"solid"}
            containerStyle={{ flex: 1 }}
            onPress={onRenameItem}
            title={"Rename"}
          />
        </View>
      }
      placement="top"
      onClose={() => setShowTooltip(false)}
    >
      <TouchableHighlight
        style={{ backgroundColor: "yellow" }}
        onPress={() => setShowTooltip(true)}
      >
        <Text>Edit</Text>
      </TouchableHighlight>
    </Tooltip>
  );
};
