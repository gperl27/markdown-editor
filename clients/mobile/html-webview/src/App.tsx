import React from "react";
import { Editor } from "@bit/gperl27.markdown-editor.editor";

const App = () => {
  const onSave = () => {
     // @ts-ignore
     window.ReactNativeWebView && window.ReactNativeWebView.postMessage("Hello!");
  };

  const onChange = (value: string) => {
    const encodedMessage = JSON.stringify({ event: 'change', value });
    // @ts-ignore
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(encodedMessage);
  };

  const onTogglePreview = () => {
    const encodedMessage = JSON.stringify({ event: 'toggle_preview' });
    // @ts-ignore
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(encodedMessage);
  };

  return <Editor onChange={onChange} onSave={onSave} onTogglePreview={onTogglePreview} />;
};

export default App;
