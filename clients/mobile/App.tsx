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
  Button
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
      console.log("Improper type dispatched, restting");

      return initialState;
  }
};

const App = () => {
  const [value, setValue] = useState("");
  const [position, setPosition] = useState<any | null>(null);
  const [state, dispatch] = useReducer(reducer, initialState);
  const { uri } = useLocalServer();
  const ref = useRef<WebView>();
  const { getItem, setItem } = useAsyncStorage("editorState");

  const writeItemToStorage = async (newValue: string) => {
    await setItem(newValue);
  };

  const onMessage = (webviewEvent: NativeSyntheticEvent<WebViewMessage>) => {
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
  };

  const onShowEditorOnly = () => {
    dispatch({ type: ActionType.SHOW_EDITOR_ONLY });
  };

  const onShowPreviewOnly = () => {
    dispatch({ type: ActionType.SHOW_PREVIEW_ONLY });

    writeItemToStorage(JSON.stringify({ value, position })).catch(e =>
      console.log(e, "error writing to editor state cache")
    );
  };

  const getInjectedStr = async () => {
    // await removeItem();
    const cachedEditorState = await getItem();

    if (!cachedEditorState) {
      return null;
    }

    const editorData = JSON.parse(cachedEditorState);

    return `
        window.MarkdownEditor = { 
          value: ${JSON.stringify(editorData.value)},
          position: ${JSON.stringify(editorData.position)},
        }; 
        true;
    `;
  };

  useEffect(() => {
    // require the module

    // get a list of files and directories in the main bundle
    RNFS.readDir(RNFS.DocumentDirectoryPath)
      .then(result => {
        console.log("GOT RESULT", result);

        // stat the first file
        return Promise.all([RNFS.stat(result[0].path), result[0].path]);
      })
      .then(statResult => {
        if (statResult[0].isFile()) {
          // if we have a file, read it
          return RNFS.readFile(statResult[1], "utf8");
        }

        return "no file";
      })
      .then(contents => {
        // log the file contents
        console.log(contents);
      })
      .catch(err => {
        console.log(err.message, err.code);
      });
  }, []);

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
            onLoadStart={async () => {
              const injected = await getInjectedStr();

              if (!injected) {
                return;
              }

              if (ref && ref.current) {
                ref.current.injectJavaScript(injected);
              }
            }}
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
    flex: 1,
    backgroundColor: "blue"
  },
  markdownContainer: {
    flex: 1
  },
  safeAreaView: {
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
