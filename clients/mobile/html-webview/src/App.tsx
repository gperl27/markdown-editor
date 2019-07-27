import React, { useEffect, ComponentProps, useState, useCallback } from 'react';
import { Editor } from "@bit/gperl27.markdown-editor.editor";

type Parameters<T> = T extends (...args: infer T) => any ? T : never;
type Editor = Parameters<ComponentProps<typeof Editor>["editorDidMount"]>[0];
type onEditorDidMount = (
  ...params: Parameters<ComponentProps<typeof Editor>["editorDidMount"]>
) => void;

const App = () => {
  const [editorRef, setEditorRef] = useState<Editor | undefined>(undefined);
  const [capturedEditorState, setCapturedEventValue] = useState<string | undefined>(undefined);

  const onSave = () => {
    const encodedMessage = JSON.stringify({
      event: "change",
      value: "hello mother"
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

    if (editorRef && capturedEditorState) {
      const { position } = JSON.parse(capturedEditorState);
      logDebug("RESTORE VIEW AFTER CHANGE")

      editorRef.restoreViewState(position);
    }
  };

  const onTogglePreview = () => {
    const encodedMessage = JSON.stringify({ event: "toggle_preview" });
    // @ts-ignore
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(encodedMessage);
  };

  const onDidChangeCursorPosition = (e: any) => {
    const encodedMessage = JSON.stringify({ event: "editor_state", value: JSON.stringify(e) });
    // @ts-ignore
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(encodedMessage);
  };

  const onEditorDidMount: onEditorDidMount = editor => {
    editor.onDidChangeCursorPosition(onDidChangeCursorPosition)

    setEditorRef(editor);
  };

  const onSetValue = (event: CustomEvent<string>) => {
    logDebug(event.detail)
    setCapturedEventValue(event.detail);
  };

  useEffect(() => {
    if (editorRef && capturedEditorState) {
      const { value, position } = JSON.parse(capturedEditorState);

      if (value) {
        editorRef.setValue(value);
      }

      // if (position) {
      //   editorRef.restoreViewState(position);
      // }
    }
  }, [capturedEditorState, editorRef]);

  useEffect(() => {
    window.addEventListener(
      "updateEditorState",
      onSetValue as EventListener,
      false
    );

    return () => {
      window.removeEventListener(
          "updateEditorState",
          onSetValue as EventListener
      );
    }
  }, []);

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
