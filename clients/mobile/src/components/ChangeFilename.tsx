import { View } from "react-native";
import {
  Header,
  Text,
  Input,
  Button,
  ButtonGroup
} from "react-native-elements";
import React, { useState } from "react";

export type FileType = "file" | "folder";

const fileOptions: FileType[] = ["file", "folder"];

interface Props {
  title?: string;
  fileName?: string;
  type?: FileType;
  onSubmit: (filename: string, type: FileType) => void;
  onCancel: () => void;
}

const getTypeIndexFromFileOptions = (type?: FileType) => {
  if (!type) {
    return 0;
  }

  const selectedIndex = fileOptions.indexOf(type);

  return selectedIndex === -1 ? 0 : selectedIndex;
};

const transformFileOptionsToPresentation = (options: FileType[]) => {
  return options.map(type => {
    return type[0].toUpperCase().concat(type.slice(1));
  });
};

export const ChangeFilename = (props: Props) => {
  const [fileName, setFileName] = useState(props.fileName || "");
  const [selectedType, setSelectedType] = useState(
    getTypeIndexFromFileOptions(props.type)
  );

  const onSubmit = () => {
    props.onSubmit(fileName, fileOptions[selectedType]);
  };

  const onCancel = () => {
    props.onCancel();
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "space-between"
        // alignItems: "center"
      }}
    >
      <Header
        containerStyle={{
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          alignSelf: "flex-start"
        }}
        backgroundColor={"white"}
        leftComponent={
          <Button
            type={"clear"}
            containerStyle={{ flex: 1 }}
            raised={true}
            title={"Cancel"}
            onPress={onCancel}
          />
        }
        rightComponent={
          <Button
            type={"clear"}
            containerStyle={{ flex: 1 }}
            raised={true}
            title={"Submit"}
            onPress={onSubmit}
          />
        }
        centerComponent={<Text h3>{props.title || "Change Filename"}</Text>}
      />
      <View style={{ flex: 0.5 }} />
      <View
        style={{
          justifyContent: "center",
          margin: "auto",
          flex: 2,
          paddingLeft: "10%",
          paddingRight: "10%"
        }}
      >
        <View style={{ paddingLeft: "15%", paddingRight: "15%" }}>
          <ButtonGroup
            selectedIndex={selectedType}
            buttons={transformFileOptionsToPresentation(fileOptions)}
            onPress={setSelectedType}
          />
        </View>
        <View style={{ marginTop: 10, marginBottom: 10 }} />
        <Input
          placeholder={"Enter filename"}
          value={fileName}
          onChangeText={setFileName}
        />
      </View>
      <View style={{ flex: 1 }} />
    </View>
  );
};
