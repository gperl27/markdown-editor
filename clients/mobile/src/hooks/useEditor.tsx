import { NativeSyntheticEvent } from "react-native";
import { WebViewMessage } from "react-native-webview/lib/WebViewTypes";
import { HtmlToApp } from "../domain/editorIpc";
import RNFS from "react-native-fs";
import { Dispatch, useContext, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useAsyncStorage } from "@react-native-community/async-storage";
import { CacheKeys } from "../domain/cache";
import { Action } from "../reducers";
import { EditorUiTypes } from "../reducers/editorUi";
import { IPosition } from "monaco-editor";
import { FilesContext } from "../contexts/FilesContext";

const DEBOUNCE = 500;

interface Props {
  dispatch: Dispatch<Action<EditorUiTypes>>;
  onNewFile: () => void;
}

export const useEditor = (props: Props) => {
  const { currentWorkingFile, setCurrentWorkingFile, getFiles } = useContext(
    FilesContext
  );
  const [value, setValue] = useState("");
  const [position, setPosition] = useState<IPosition | undefined>(undefined);
  const { mergeItem } = useAsyncStorage(CacheKeys.EDITOR_STATE);

  const getPathIfFirstSave = (content: string) => {
    if (!currentWorkingFile) {
      return (
        RNFS.DocumentDirectoryPath +
        `/${content.slice(0, 10).replace("s", "")}.md`
      );
    }

    return currentWorkingFile.path;
  };

  const [autoSaveOnChange] = useDebouncedCallback(async contents => {
    if (contents.trim().length === 0) {
      return;
    }

    const path = getPathIfFirstSave(contents);

    await RNFS.writeFile(path, contents, "utf8");
    const file = await RNFS.stat(path);
    setCurrentWorkingFile(file);
    await mergeItem(JSON.stringify({ file }));
    getFiles();
  }, DEBOUNCE);

  const [autoSaveOnPositionChange] = useDebouncedCallback(async newPosition => {
    await mergeItem(JSON.stringify({ position: newPosition }));
  }, DEBOUNCE);

  const isEditorDefaultPosition = (incomingValue: any) =>
    incomingValue === { lineNumber: 1, column: 1 };

  const onMessage = async (
    webviewEvent: NativeSyntheticEvent<WebViewMessage>
  ) => {
    const decodedMessage: { event: HtmlToApp; value: any } = JSON.parse(
      webviewEvent.nativeEvent.data
    );

    switch (decodedMessage.event) {
      case HtmlToApp.CHANGE_VALUE:
        setValue(decodedMessage.value);
        autoSaveOnChange(decodedMessage.value);
        break;
      case HtmlToApp.CHANGE_POSITION:
        if (isEditorDefaultPosition(decodedMessage.value)) {
          return;
        }
        setPosition(decodedMessage.value);
        autoSaveOnPositionChange(decodedMessage.value);
        break;
      case HtmlToApp.TOGGLE_PREVIEW:
        props.dispatch({ type: EditorUiTypes.TOGGLE_SHOW_PREVIEW });
        break;
      case "new_file":
        props.onNewFile();
        break;
      default:
        console.log(decodedMessage.value);
    }
  };

  const injectedJavascriptFactory = (event: string, data: any) => {
    return `
        (function(){
          window.dispatchEvent(new CustomEvent("${event}", { detail: ${JSON.stringify(
      data
    )} }));
        })();
        true;
    `;
  };

  return {
    onMessage,
    setValue,
    value,
    position,
    setPosition,
    injectedJavascriptFactory
  };
};
