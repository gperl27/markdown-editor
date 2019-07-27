import React, { Fragment, useState, useReducer } from "react";
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
import Markdown from "react-native-simple-markdown";
import { WebViewMessage } from "react-native-webview/lib/WebViewTypes";
import { iOSUIKit } from "react-native-typography";
import { useLocalServer } from "./src/lib/localStaticServer";

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
  const { uri } = useLocalServer();
  const [value, setValue] = useState("");
  const [state, dispatch] = useReducer(reducer, initialState);

  const onMessage = (webviewEvent: NativeSyntheticEvent<WebViewMessage>) => {
    const decodedMessage: { event: string; value: string } = JSON.parse(
      webviewEvent.nativeEvent.data
    );

    if (decodedMessage.event === "change") {
      setValue(decodedMessage.value);
    }

    if (decodedMessage.event === "toggle_preview") {
      dispatch({ type: ActionType.TOGGLE_SHOW_PREVIEW });
    }
  };

  if (!uri) {
    return (
      <SafeAreaView style={styles.safeAreaView}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <Fragment>
      <SafeAreaView style={styles.safeAreaView}>
        <StatusBar barStyle="dark-content" />
        <View>
          <Text>Top UI Bar Here</Text>
          <View>
            <Button
              title={"Show Editor Only"}
              onPress={() => dispatch({ type: ActionType.SHOW_EDITOR_ONLY })}
            />
            <Button
              title={"Show Both"}
              onPress={() => dispatch({ type: ActionType.SHOW_BOTH })}
            />
            <Button
              title={"Preview Only"}
              onPress={() => dispatch({ type: ActionType.SHOW_PREVIEW_ONLY })}
            />
          </View>
        </View>
        <View style={styles.container}>
          {state.showEditor && (
            <View style={styles.webViewContainer}>
              <WebView
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
              />
            </View>
          )}
          {state.showMarkdownPreview && (
            <View style={styles.markdownContainer}>
              <ScrollView>
                <Markdown styles={markdownStyles}>{value}</Markdown>
              </ScrollView>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Fragment>
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
  heading1: {
    ...iOSUIKit.largeTitleEmphasizedObject,
    marginBottom: iOSUIKit.largeTitleEmphasizedObject.fontSize! * 0.3,
    marginTop: iOSUIKit.largeTitleEmphasizedObject.fontSize! * 0.3
  },
  heading2: iOSUIKit.title3EmphasizedObject,
  heading3: iOSUIKit.title3Object,
  body: iOSUIKit.bodyObject
});

export default App;
