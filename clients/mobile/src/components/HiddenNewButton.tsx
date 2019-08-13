import Tooltip from "react-native-walkthrough-tooltip";
import { TouchableHighlight, View } from "react-native";
import { Button, Text } from "react-native-elements";
import React, { useState } from "react";
import { FileType } from "../contexts/FilesContext";

interface Props {
  onNewFile?: (type: FileType) => void;
}

export const HiddenNewButton = (props: Props) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const onNewFile = (type: FileType) => {
    setShowTooltip(false);
    props.onNewFile && props.onNewFile(type);
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
            onPress={() => onNewFile("file")}
            title={"File"}
          />
          <Button
            type={"solid"}
            containerStyle={{ flex: 1 }}
            onPress={() => onNewFile("folder")}
            title={"Folder"}
          />
        </View>
      }
      placement="top"
      onClose={() => setShowTooltip(false)}
    >
      <TouchableHighlight
        style={{ backgroundColor: "blue" }}
        onPress={() => setShowTooltip(true)}
      >
        <Text>New</Text>
      </TouchableHighlight>
    </Tooltip>
  );
};
