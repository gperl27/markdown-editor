import React, { ComponentProps, useEffect, useState } from 'react';
import { Editor } from "@bit/gperl27.markdown-editor.editor";
import { IPosition } from 'monaco-editor';
import { COMMAND } from '@bit/gperl27.markdown-editor.editor/dist/Editor';

type Parameters<T> = T extends (...args: infer T) => any ? T : never;
type Editor = Parameters<ComponentProps<typeof Editor>["editorDidMount"]>[0];
type onEditorDidMount = (
  ...params: Parameters<ComponentProps<typeof Editor>["editorDidMount"]>
) => void;

enum HtmlToApp {
  CHANGE_VALUE,
  CHANGE_POSITION,
  TOGGLE_PREVIEW
}

enum AppToHtml {
  UPDATE_EDITOR_VALUE = "updateEditorValue",
  UPDATE_EDITOR_POSITION = "updateEditorPosition",
RESET = "reset"
}

const App = () => {
  const [editorRef, setEditorRef] = useState<Editor | undefined>(undefined)
  const [capturedValue, setCapturedValue] = useState<string | undefined>(undefined);
  const [capturedPositionValue, setCapturedPositionValue] = useState<IPosition | undefined>(undefined);
  const [shouldReset, setShouldReset] = useState(false);

  const onSave = () => {
    const encodedMessage = JSON.stringify({
      event: "save"
    });

    // @ts-ignore
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(encodedMessage);
  };

  const logDebug = (message: string) => {
    const encodedMessage = JSON.stringify({
      event: "debug",
      value: message
    });
    // @ts-ignore
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(encodedMessage);
  };

  const onChange = (value: string) => {
    const encodedMessage = JSON.stringify({ event: HtmlToApp.CHANGE_VALUE, value });

    // @ts-ignore
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(encodedMessage);
  };

  const onTogglePreview = () => {
    const encodedMessage = JSON.stringify({ event: HtmlToApp.TOGGLE_PREVIEW });
    // @ts-ignore
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(encodedMessage);
  };

  const onDidChangeCursorPosition = (e: any) => {
    const encodedMessage = JSON.stringify({ event: HtmlToApp.CHANGE_POSITION, value: e });
    // @ts-ignore
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(encodedMessage);
  };

  const onNewFile = (event: COMMAND) => {

    console.log(event, 'new event from html')

    const encodedMessage = JSON.stringify({ event });
    // @ts-ignore
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(encodedMessage);
  };

  const onEditorDidMount: onEditorDidMount = editor => {
    editor.onDidChangeCursorPosition(onDidChangeCursorPosition);

    setEditorRef(editor);
  };

  useEffect(() => {
    if (editorRef) {
      if (capturedValue) {
        editorRef.setValue(capturedValue)
      }

      if (capturedPositionValue) {
        editorRef.setPosition(capturedPositionValue)
      }
    }
  }, [editorRef, capturedValue, capturedPositionValue]);

  useEffect(() => {
    if (editorRef) {
      if (shouldReset) {
        editorRef.setValue("");
        setShouldReset(false);
      }
    }
  }, [editorRef, shouldReset]);

  useEffect(() => {
      const onUpdateEditorValue = (event: CustomEvent<string>) => {
          setCapturedValue(event.detail);
      };

      const onUpdateEditorPosition = (event: CustomEvent<string>) => {
        // @ts-ignore
        setCapturedPositionValue(event.detail.position);
      };

      const onReset = () => {
        setShouldReset(true);
      };

      window.addEventListener(
          AppToHtml.UPDATE_EDITOR_VALUE,
          onUpdateEditorValue as EventListener,
          false
      );
      window.addEventListener(
          AppToHtml.RESET,
          onReset,
          false
      );
      window.addEventListener(
          AppToHtml.UPDATE_EDITOR_POSITION,
          onUpdateEditorPosition as EventListener,
          false
      );

      return () => {
        window.removeEventListener(
            AppToHtml.UPDATE_EDITOR_VALUE,
            onUpdateEditorValue as EventListener
        );
        window.removeEventListener(
            AppToHtml.UPDATE_EDITOR_POSITION,
            onUpdateEditorPosition as EventListener
        );
        window.removeEventListener(
            AppToHtml.RESET,
            onReset
        );
      }
  }, []);

  return (
    <Editor
      editorDidMount={onEditorDidMount}
      onChange={onChange}
      onSave={onSave}
      onTogglePreview={onTogglePreview}
      onNewFile={onNewFile}
    />
  );
};

export default App;
