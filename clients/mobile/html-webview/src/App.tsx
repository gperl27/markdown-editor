import React, { ComponentProps, useEffect, useState } from 'react';
import { Editor } from "@bit/gperl27.markdown-editor.editor";

type Parameters<T> = T extends (...args: infer T) => any ? T : never;
type Editor = Parameters<ComponentProps<typeof Editor>["editorDidMount"]>[0];
type onEditorDidMount = (
  ...params: Parameters<ComponentProps<typeof Editor>["editorDidMount"]>
) => void;

const App = () => {
  const [editorRef, setEditorRef] = useState<Editor | undefined>(undefined)

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
    const encodedMessage = JSON.stringify({ event: "change", value });

    // @ts-ignore
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(encodedMessage);
  };

  const onTogglePreview = () => {
    const encodedMessage = JSON.stringify({ event: "toggle_preview" });
    // @ts-ignore
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(encodedMessage);
  };

  const onDidChangeCursorPosition = (e: any) => {
    const encodedMessage = JSON.stringify({ event: "editor_cursor_position", value: e });
    // @ts-ignore
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(encodedMessage);
  };

  const onEditorDidMount: onEditorDidMount = editor => {
    editor.onDidChangeCursorPosition(onDidChangeCursorPosition);

    setEditorRef(editor);
  };

  const onUpdateEditorValue = (event: CustomEvent<string>) => {
      if (editorRef) {
        editorRef.setValue(event.detail)
      }
  };

  const onUpdateEditorPosition = (event: CustomEvent<string>) => {
    if (editorRef) {
        // @ts-ignore
      editorRef.setPosition(event.detail.position)
    }
  };

  useEffect(() => {
    if (editorRef) {
      window.addEventListener(
          "updateEditorValue",
          onUpdateEditorValue as EventListener,
          false
      );
      window.addEventListener(
          "updateEditorPosition",
          onUpdateEditorPosition as EventListener,
          false
      );

      return () => {
        window.removeEventListener(
            "updateEditorValue",
            onUpdateEditorValue as EventListener
        );
        window.removeEventListener(
            "updateEditorPosition",
            onUpdateEditorPosition as EventListener
        );
      }
    }
  }, [editorRef]);

  return (
    <Editor
      editorDidMount={onEditorDidMount}
      onChange={onChange}
      onSave={onSave}
      onTogglePreview={onTogglePreview}
    />
  );
};

export default App;
