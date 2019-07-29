import React, { useReducer, useRef, MutableRefObject } from "react";
import {
  SafeAreaView,
  StyleSheet,
  StatusBar,
  View,
  ScrollView,
  Text,
  Button,
  FlatList
} from "react-native";
import { WebView } from "react-native-webview";
import Markdown from "react-native-markdown-renderer";
import { useLocalServer } from "./src/lib/localStaticServer";
import { iOSMarkdownStyleFactory } from "./src/lib/theme";
import { useAsyncStorage } from "@react-native-community/async-storage";
import RNFS from "react-native-fs";
import { AppToHtml } from "./src/domain/editorIpc";
import { useEditor } from "./src/hooks/useEditor";
import {
  editorUiInitialState,
  editorUiReducer,
  EditorUiTypes
} from "./src/reducers/editorUi";
import { CacheKeys } from "./src/domain/cache";
import { defaultPath, useFileSystem } from "./src/hooks/useFileSystem";

const App = () => {
  const {
    files,
    currentWorkingPath = defaultPath,
    setCurrentWorkingPath
  } = useFileSystem();
  const [state, dispatch] = useReducer(editorUiReducer, editorUiInitialState);
  const { uri } = useLocalServer();
  const ref = useRef<WebView>();
  const { getItem: getEditorState, setItem: setEditorState } = useAsyncStorage(
    CacheKeys.EDITOR_STATE
  );
  const { onMessage, value, position, injectedJavascriptFactory } = useEditor({
    path: currentWorkingPath,
    dispatch
  });

  const onShowEditorOnly = () => {
    dispatch({ type: EditorUiTypes.SHOW_EDITOR_ONLY });
  };

  const onShowPreviewOnly = () => {
    dispatch({ type: EditorUiTypes.SHOW_PREVIEW_ONLY });
  };

  const sendToEditor = (event: string, data: any) => {
    const injected = injectedJavascriptFactory(event, data);

    if (ref && ref.current) {
      console.log("send to editor");
      ref.current.injectJavaScript(injected);
    }
  };

  const onGetFileContents = (selectedPath: string) => async () => {
    setCurrentWorkingPath(selectedPath);
    await setEditorState(JSON.stringify({ path: selectedPath, position }));
    RNFS.readFile(selectedPath).then(result => {
      sendToEditor(AppToHtml.UPDATE_EDITOR_VALUE, result);
    });
  };

  const onAppLoad = async () => {
    const cachedEditorState = await getEditorState();

    if (!cachedEditorState) {
      return;
    }

    const editorData = JSON.parse(cachedEditorState);
    if (!editorData.path) {
      return;
    }

    setCurrentWorkingPath(editorData.path);
    const content = await RNFS.readFile(editorData.path);

    sendToEditor(AppToHtml.UPDATE_EDITOR_VALUE, content);
    sendToEditor(AppToHtml.UPDATE_EDITOR_POSITION, editorData.position);
  };

  const renderFile = item => {
    console.log(item, "item");

    return (
      <Button
        onPress={onGetFileContents(item.item.path)}
        title={item.item.name}
      />
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
      <View>
        <Text>Top UI Bar Here</Text>
        <View>
          <Button title={"Show Editor Only"} onPress={onShowEditorOnly} />
          <Button
            title={"Show Both"}
            onPress={() => dispatch({ type: EditorUiTypes.SHOW_BOTH })}
          />
          <Button title={"Preview Only"} onPress={onShowPreviewOnly} />
        </View>
      </View>
      <View style={styles.container}>
        <FlatList
          style={styles.directoryList}
          data={files}
          renderItem={renderFile}
        />
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
    flex: 1
  }
});

const markdownStyles = StyleSheet.create({
  root: {
    padding: "5%"
  },
  ...iOSMarkdownStyleFactory()
});

export default App;
