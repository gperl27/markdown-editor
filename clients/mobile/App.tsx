import React, { useReducer, useRef, MutableRefObject, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  StatusBar,
  View,
  ScrollView,
  Text,
  Button
} from "react-native";
import { WebView } from "react-native-webview";
import Markdown from "react-native-markdown-renderer";
import { useLocalServer } from "./src/lib/localStaticServer";
import { iOSMarkdownStyleFactory } from "./src/lib/theme";
import { useAsyncStorage } from "@react-native-community/async-storage";
import RNFS, { ReadDirItem } from "react-native-fs";
import { AppToHtml } from "./src/domain/editorIpc";
import { useEditor } from "./src/hooks/useEditor";
import {
  editorUiInitialState,
  editorUiReducer,
  EditorUiTypes
} from "./src/reducers/editorUi";
import { CacheKeys } from "./src/domain/cache";
import { defaultPath, useFileSystem } from "./src/hooks/useFileSystem";
import { iOSUIKit } from "react-native-typography";
import { SwipeListView } from "react-native-swipe-list-view";

const App = () => {
  const {
    files,
    currentWorkingPath = defaultPath,
    setCurrentWorkingPath
  } = useFileSystem();
  const [state, dispatch] = useReducer(editorUiReducer, editorUiInitialState);
  const { uri } = useLocalServer();
  const ref = useRef<WebView>();
  const {
    getItem: getEditorCache,
    mergeItem: mergeEditorCache,
    removeItem
  } = useAsyncStorage(CacheKeys.EDITOR_STATE);
  const { onMessage, value, injectedJavascriptFactory } = useEditor({
    path: currentWorkingPath,
    dispatch
  });
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);

  const onShowEditorOnly = () => {
    dispatch({ type: EditorUiTypes.SHOW_EDITOR_ONLY });
  };

  const onShowPreviewOnly = () => {
    dispatch({ type: EditorUiTypes.SHOW_PREVIEW_ONLY });
  };

  const sendToEditor = (event: string, data: any) => {
    const injected = injectedJavascriptFactory(event, data);

    if (ref && ref.current) {
      ref.current.injectJavaScript(injected);
    }
  };

  const onGetFileContents = async (
    selectedPath: string,
    name: string | null
  ) => {
    setCurrentWorkingPath(selectedPath);
    name && setCurrentFileName(name);

    const content = await RNFS.readFile(selectedPath);
    sendToEditor(AppToHtml.UPDATE_EDITOR_VALUE, content);

    mergeEditorCache(
      JSON.stringify({ path: selectedPath, filename: name })
    ).catch(e => {
      console.log(e);
    });
  };

  const onAppLoad = async () => {
    const cachedEditorState = await getEditorCache();

    if (!cachedEditorState) {
      return;
    }

    const editorData = JSON.parse(cachedEditorState);

    if (!editorData.path) {
      return;
    }

    await onGetFileContents(editorData.path, editorData.filename);
    sendToEditor(AppToHtml.UPDATE_EDITOR_POSITION, editorData.position);
  };

  const renderFile = ({
    item
  }: {
    item: ReadDirItem;
    index: number;
    separators: any;
  }) => {
    return (
      <View style={styles.rowFront}>
        <Button
          onPress={() => onGetFileContents(item.path, item.name)}
          title={item.name}
        />
      </View>
    );
  };

  const hiddenItem = (data, rowMap) => {
    console.log(data, "data in hidden item");
    console.log(rowMap, "wtf is this");

    return (
      <View style={styles.rowBack}>
        <Text>Delete</Text>
      </View>
    );
  };

  if (!uri) {
    return (
      <SafeAreaView style={styles.safeAreaView}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeAreaView}>
      <StatusBar barStyle="dark-content" />
      <View />
      <View style={styles.container}>
        <View style={styles.directoryList}>
          {state.showDirectory && (
            <SwipeListView
              keyExtractor={(item, index) => index.toString()}
              data={files}
              renderItem={renderFile}
              renderHiddenItem={hiddenItem}
              rightOpenValue={-75}
              leftOpenValue={75}
              disableRightSwipe={true}
            />
          )}
        </View>
        <View style={styles.editorContainer}>
          <View style={styles.toolbar}>
            <View>
              <Button onPress={() => {}} title={"Change Theme"} />
            </View>
            <View>
              <Text style={iOSUIKit.title3EmphasizedObject}>
                {currentFileName || "untitled.md"}
              </Text>
            </View>
            <View style={styles.previewButtonGroup}>
              <Button title={"Show Editor Only"} onPress={onShowEditorOnly} />
              <Button
                title={"Show Both"}
                onPress={() => dispatch({ type: EditorUiTypes.SHOW_BOTH })}
              />
              <Button title={"Preview Only"} onPress={onShowPreviewOnly} />
            </View>
          </View>
          <View style={styles.innerEditorContainer}>
            <View style={state.showEditor ? styles.webViewContainer : {}}>
              <WebView
                ref={ref as MutableRefObject<WebView>}
                hideKeyboardAccessoryView={true}
                keyboardDisplayRequiresUserAction={false}
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
                source={{ uri }}
                javaScriptEnabled={true}
                originWhitelist={["*"]}
                allowFileAccess={true}
                useWebKit={true}
                onMessage={onMessage}
                onLoadEnd={onAppLoad}
              />
            </View>
            {state.showMarkdownPreview && (
              <View style={styles.markdownContainer}>
                <ScrollView>
                  <Markdown style={markdownStyles}>{value}</Markdown>
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row"
  },
  webViewContainer: {
    flex: 2
  },
  markdownContainer: {
    flex: 2
  },
  safeAreaView: {
    flex: 1
  },
  directoryList: {
    flex: 0.5
  },
  editorContainer: {
    flex: 2
  },
  innerEditorContainer: {
    flex: 1,
    flexDirection: "row"
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around"
  },
  previewButtonGroup: {
    flexDirection: "row"
  },
  rowFront: {
    alignItems: "center",
    backgroundColor: "#CCC",
    borderBottomColor: "black",
    borderBottomWidth: 1,
    justifyContent: "center",
    height: 50
  },
  rowBack: {
    alignItems: "center",
    backgroundColor: "#DDD",
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingLeft: 15
  }
});

const markdownStyles = StyleSheet.create({
  root: {
    padding: "5%"
  },
  ...iOSMarkdownStyleFactory()
});

export default App;
