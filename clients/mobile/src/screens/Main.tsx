import {
  Button,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
  View
} from "react-native";
import { SwipeListView } from "react-native-swipe-list-view";
import { iOSUIKit } from "react-native-typography";
import {
  editorUiInitialState,
  editorUiReducer,
  EditorUiTypes
} from "../reducers/editorUi";
import { WebView } from "react-native-webview";
import React, { MutableRefObject, useContext, useRef, useReducer } from "react";
import Markdown from "react-native-markdown-renderer";
import { iOSMarkdownStyleFactory } from "../lib/theme";
import { useAsyncStorage } from "@react-native-community/async-storage";
import { CacheKeys } from "../domain/cache";
import { useEditor } from "../hooks/useEditor";
import { FilesContext } from "../contexts/FilesContext";
import RNFS, { ReadDirItem } from "react-native-fs";
import { AppToHtml } from "../domain/editorIpc";
import { useLocalServer } from "../hooks/useStaticServer";

export const Main = () => {
  const {
    setCurrentWorkingFile,
    currentWorkingFile,
    getFiles,
    files
  } = useContext(FilesContext);
  const [state, dispatch] = useReducer(editorUiReducer, editorUiInitialState);
  const { uri } = useLocalServer();
  const ref = useRef<WebView>();
  const {
    getItem: getEditorCache,
    mergeItem: mergeEditorCache,
    removeItem
  } = useAsyncStorage(CacheKeys.EDITOR_STATE);

  const onNewFile = () => {
    sendToEditor(AppToHtml.RESET);

    setCurrentWorkingFile(undefined);
    removeItem().catch(e => console.log(e));
  };

  const { onMessage, value, injectedJavascriptFactory } = useEditor({
    onNewFile,
    dispatch
  });

  const onShowEditorOnly = () => {
    dispatch({ type: EditorUiTypes.SHOW_EDITOR_ONLY });
  };

  const onShowPreviewOnly = () => {
    dispatch({ type: EditorUiTypes.SHOW_PREVIEW_ONLY });
  };

  const sendToEditor = (event: string, data?: any) => {
    const injected = injectedJavascriptFactory(event, data);

    if (ref && ref.current) {
      ref.current.injectJavaScript(injected);
    }
  };

  const onGetFileContents = async (file: ReadDirItem) => {
    setCurrentWorkingFile(file);

    try {
      const content = await RNFS.readFile(file.path);
      sendToEditor(AppToHtml.UPDATE_EDITOR_VALUE, content);

      mergeEditorCache(JSON.stringify({ file })).catch(e => {
        console.log(e);
      });
    } catch (e) {
      onNewFile();
    }
  };

  const onDeleteItem = (item: ReadDirItem) => {
    RNFS.unlink(item.path)
      .then(() => {
        getFiles();

        if (item.path === (currentWorkingFile && currentWorkingFile.path)) {
          console.log(item.path, currentWorkingFile, "ON DELETE");

          onNewFile();
        }

        console.log("File deleted!");
      })
      .catch(console.log);
  };

  const onAppLoad = async () => {
    const cachedEditorState = await getEditorCache();

    if (!cachedEditorState) {
      return;
    }

    const editorData = JSON.parse(cachedEditorState);

    await onGetFileContents(editorData.file);
    sendToEditor(AppToHtml.UPDATE_EDITOR_POSITION, editorData.position);
  };

  const getFileName = () => {
    if (!currentWorkingFile) {
      return "untitled";
    }

    const filepathSegments = currentWorkingFile.path.split("/");
    return filepathSegments[filepathSegments.length - 1];
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
        <Button onPress={() => onGetFileContents(item)} title={item.name} />
      </View>
    );
  };

  const hiddenItem = ({ item }: { item: ReadDirItem }) => {
    return (
      <TouchableHighlight
        style={styles.rowBack}
        onPress={() => onDeleteItem(item)}
      >
        <Text>Delete</Text>
      </TouchableHighlight>
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
            <Text style={iOSUIKit.title3EmphasizedObject}>{getFileName()}</Text>
          </View>
          <View style={styles.previewButtonGroup}>
            <Button title={"Show Editor Only"} onPress={onShowEditorOnly} />
            <Button
              title={"Show Both"}
              onPress={() => dispatch({ type: EditorUiTypes.SHOW_BOTH })}
            />
            <Button title={"Preview Only"} onPress={onShowPreviewOnly} />
          </View>
          <Button title={"New"} onPress={onNewFile} />
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
    paddingRight: 15
  }
});

const markdownStyles = StyleSheet.create({
  root: {
    padding: "5%"
  },
  ...iOSMarkdownStyleFactory()
});
