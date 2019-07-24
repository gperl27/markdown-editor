import React from "react";
import { Editor } from "@bit/gperl27.markdown-editor.editor";

const App = () => {
  const onSave = () => {
     // @ts-ignore
     window.ReactNativeWebView && window.ReactNativeWebView.postMessage("Hello!");
  };

  return <Editor onSave={onSave} />;
};

export default App;
