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

  return <Editor onChange={onChange} onSave={onSave} />;
};

export default App;
