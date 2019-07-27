import React, {
  useState,
  useReducer,
  useRef,
  MutableRefObject,
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
  const [firstLoad, setFirstLoad] = useState(true);
  const [value, setValue] = useState("");
  const [position, setPosition] = useState<any | null>(null);
  const [state, dispatch] = useReducer(reducer, initialState);
  const { uri } = useLocalServer();
  const ref = useRef<WebView>();
  const { getItem, setItem, removeItem } = useAsyncStorage("editorState");

  const writeItemToStorage = async (newValue: string) => {
    await setItem(newValue);
  };

  const onMessage = (webviewEvent: NativeSyntheticEvent<WebViewMessage>) => {
    const decodedMessage: { event: string; value: string } = JSON.parse(
      webviewEvent.nativeEvent.data
    );

    if (decodedMessage.event === "change") {
      // console.log(decodedMessage.value, "ON CHANGE FROM EDITOR");
      setValue(decodedMessage.value);
    }

    if (decodedMessage.event === "editor_state") {
      // console.log(decodedMessage.value, "editor state!");
      if (
        decodedMessage.value !==
        '{"position":{"lineNumber":1,"column":1},"secondaryPositions":[],"reason":1,"source":"model"}'
      ) {
        setPosition(decodedMessage.value);
      } else {
        console.log("YOU TRIED TO RESET");
      }
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

    writeItemToStorage(
      JSON.stringify({ value, position: JSON.parse(position) })
    ).catch(e => console.log(e, "error writing to editor state cache"));
  };

  if (!uri) {
    return (
      <SafeAreaView style={styles.safeAreaView}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  const getInjectedStr = async () => {
    const editorCache = await getItem();
    console.log(editorCache, "EDITOR CACHE");

    if (!editorCache) {
      return null;
    }

    return `
        const updateEvent = new CustomEvent("updateEditorState", { detail: ${JSON.stringify(
          editorCache
        )} });
        window.dispatchEvent(updateEvent);
        true;
    `;
  };

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
            onLoad={async () => {
              if (ref && ref.current) {
                if (firstLoad) {
                  await removeItem();
                  setFirstLoad(false);
                }
                const injected = await getInjectedStr();

                if (injected) {
                  ref.current.injectJavaScript(injected);
                }
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
