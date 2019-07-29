import { NativeSyntheticEvent } from "react-native";
import { WebViewMessage } from "react-native-webview/lib/WebViewTypes";
import { HtmlToApp } from "../domain/editorIpc";
import RNFS from "react-native-fs";
import { Dispatch, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useAsyncStorage } from "@react-native-community/async-storage";
import { CacheKeys } from "../domain/cache";
import { Action } from "../reducers";
import { EditorUiTypes } from "../reducers/editorUi";
import { IPosition } from "monaco-editor";

const DEBOUNCE = 500;

interface Props {
  path: string;
  dispatch: Dispatch<Action<EditorUiTypes>>;
}

export const useEditor = (props: Props) => {
  const [value, setValue] = useState("");
  const [position, setPosition] = useState<IPosition | undefined>(undefined);
  const { setItem } = useAsyncStorage(CacheKeys.EDITOR_STATE);

  const [autoSaveOnChange] = useDebouncedCallback(async contents => {
    const savePath =
      props.path.length > 0
        ? props.path
        : RNFS.DocumentDirectoryPath + "/untitled.md";

    await RNFS.writeFile(savePath, contents, "utf8");
    await setItem(JSON.stringify({ path: savePath, position }));
  }, DEBOUNCE);

  const [autoSaveOnPositionChange] = useDebouncedCallback(async newPosition => {
    await setItem(JSON.stringify({ path: props.path, position: newPosition }));
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
    injectedJavascriptFactory
  };
};
