import { NativeSyntheticEvent } from "react-native";
import { WebViewMessage } from "react-native-webview/lib/WebViewTypes";
import { HtmlToApp } from "../domain/editorIpc";
import { Dispatch, useContext, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Action } from "../reducers";
import { EditorUiTypes } from "../reducers/editorUi";
import { IPosition } from "monaco-editor";
import { FilesContext } from "../contexts/FilesContext";

const DEBOUNCE = 1000;

interface Props {
  dispatch: Dispatch<Action<EditorUiTypes>>;
  onNewFile: () => Promise<void>;
}

export const useEditor = (props: Props) => {
  const { currentWorkingFile, updateFile } = useContext(FilesContext);
  const [value, setValue] = useState("");
  const [position, setPosition] = useState<IPosition | undefined>(undefined);

  const [autoSaveOnChange] = useDebouncedCallback(async contents => {
    updateFile(contents, currentWorkingFile);
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
        await autoSaveOnChange(decodedMessage.value);
        break;
      case HtmlToApp.CHANGE_POSITION:
        if (isEditorDefaultPosition(decodedMessage.value)) {
          return;
        }
        setPosition(decodedMessage.value);
        break;
      case HtmlToApp.TOGGLE_PREVIEW:
        props.dispatch({ type: EditorUiTypes.TOGGLE_SHOW_PREVIEW });
        break;
      case "new_file":
        await props.onNewFile();
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
