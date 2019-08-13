import { View, TouchableHighlight } from "react-native";
import React, { useState } from "react";
import { Button, Text } from "react-native-elements";
import Tooltip from "react-native-walkthrough-tooltip";

interface Props {
  onDeleteItem?: () => void;
}

export const HiddenDeleteButton = (props: Props) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const onDeleteItem = () => {
    setShowTooltip(false);
    props.onDeleteItem && props.onDeleteItem();
  };

  return (
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
      <TouchableHighlight
        style={{ backgroundColor: "red" }}
        onPress={() => setShowTooltip(true)}
      >
        <Text>Delete</Text>
      </TouchableHighlight>
    </Tooltip>
  );
};
