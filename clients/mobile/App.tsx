import React, {
  useState,
  useReducer,
  useRef,
  MutableRefObject,
  useEffect
} from "react";
import {
  SafeAreaView,
  StyleSheet,
  StatusBar,
  View,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  Button,
  FlatList,
  AppState,
  AppStateStatus
} from "react-native";
import { WebView } from "react-native-webview";
import Markdown from "react-native-markdown-renderer";
import { WebViewMessage } from "react-native-webview/lib/WebViewTypes";
import { useLocalServer } from "./src/lib/localStaticServer";
import { iOSMarkdownStyleFactory } from "./src/lib/theme";
import { useAsyncStorage } from "@react-native-community/async-storage";
import RNFS from "react-native-fs";

enum ActionType {
  SHOW_PREVIEW_ONLY,
  SHOW_EDITOR_ONLY,
  SHOW_BOTH,
  TOGGLE_SHOW_EDITOR,
  TOGGLE_SHOW_PREVIEW
}

interface Action<T extends {} | ((...params: any) => any) = {}> {
  type: ActionType;
  payload?: T;
}

interface State {
  showEditor: boolean;
  showMarkdownPreview: boolean;
}

const initialState: State = {
  showEditor: true,
  showMarkdownPreview: true
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case ActionType.SHOW_PREVIEW_ONLY:
      return {
        showEditor: false,
        showMarkdownPreview: true
      };
    case ActionType.SHOW_EDITOR_ONLY:
      return {
        showEditor: true,
        showMarkdownPreview: false
      };
    case ActionType.SHOW_BOTH:
      return {
        showEditor: true,
        showMarkdownPreview: true
      };
    case ActionType.TOGGLE_SHOW_EDITOR:
      return {
        ...state,
        showEditor: !state.showEditor
      };
    case ActionType.TOGGLE_SHOW_PREVIEW:
      return {
        ...state,
        showMarkdownPreview: !state.showMarkdownPreview
      };
    default:
      console.log("Improper type dispatched, resetting");

      return initialState;
  }
};

const App = () => {
  const [appState, setAppState] = useState(AppState.currentState);
  const [value, setValue] = useState("");
  const [path, setPath] = useState("");
  const [position, setPosition] = useState<any | null>(null);
  const [files, setFiles] = useState([]);
  const [state, dispatch] = useReducer(reducer, initialState);
  const { uri } = useLocalServer();
  const ref = useRef<WebView>();
  const { getItem, setItem } = useAsyncStorage("editorState");

  const writeItemToStorage = async (newValue: string) => {
    await setItem(newValue);
  };

  const onMessage = async (
    webviewEvent: NativeSyntheticEvent<WebViewMessage>
  ) => {
    const decodedMessage: { event: string; value: string } = JSON.parse(
      webviewEvent.nativeEvent.data
    );

    if (decodedMessage.event === "change") {
      setValue(decodedMessage.value);
    }

    if (decodedMessage.event === "editor_cursor_position") {
      setPosition(decodedMessage.value);
    }

    if (decodedMessage.event === "toggle_preview") {
      dispatch({ type: ActionType.TOGGLE_SHOW_PREVIEW });
    }

    if (decodedMessage.event === "debug") {
      console.log(decodedMessage.value);
    }

    if (decodedMessage.event === "save") {
      const savePath =
        path.length > 0 ? path : RNFS.DocumentDirectoryPath + "/untitled.md";

      await RNFS.writeFile(savePath, value, "utf8");
      await writeItemToStorage(JSON.stringify({ path: savePath, position }));
    }
  };

  const onShowEditorOnly = () => {
    dispatch({ type: ActionType.SHOW_EDITOR_ONLY });
  };

  const onShowPreviewOnly = () => {
    dispatch({ type: ActionType.SHOW_PREVIEW_ONLY });
  };

  const onAppLoad = async () => {
    const cachedEditorState = await getItem();

    console.log(cachedEditorState, "cached state");

    if (!cachedEditorState) {
      return;
    }

    const editorData = JSON.parse(cachedEditorState);
    if (!editorData.path) {
      return;
    }

    setPath(editorData.path);
    const content = await RNFS.readFile(editorData.path);

    console.log(content, editorData.position);

    sendToEditor("updateEditorValue", content);
    sendToEditor("updateEditorPosition", editorData.position);
  };

  const sendToEditor = (event: string, data: any) => {
    const injected = `
        (function(){
          window.dispatchEvent(new CustomEvent("${event}", { detail: ${JSON.stringify(
      data
    )} }));
        })();
        true;
    `;

    if (ref && ref.current) {
      console.log("send to editor");
      ref.current.injectJavaScript(injected);
    }
  };

  const onGetFileContents = (selectedPath: string) => () => {
    setPath(selectedPath);
    RNFS.readFile(selectedPath).then(result => {
      console.log(result, "get file contents");
      sendToEditor("updateEditorValue", result);
    });
  };

  const onAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.match(/inactive|background/)) {
      writeItemToStorage(JSON.stringify({ path, position })).catch(e =>
        console.log(e, "error writing to editor state cache")
      );

      console.log("App has closed");
    }
    setAppState(nextAppState);
  };

  useEffect(() => {
    RNFS.readDir(RNFS.DocumentDirectoryPath)
      .then(result => {
        console.log("GOT RESULT", result);
        setFiles(result);

        return result;
      })
      .catch(err => {
        console.log(err.message, err.code);
      });
  }, []);

  useEffect(() => {
    AppState.addEventListener("change", onAppStateChange);

    return () => AppState.removeEventListener("change", onAppStateChange);
  }, []);

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
            onPress={() => dispatch({ type: ActionType.SHOW_BOTH })}
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
