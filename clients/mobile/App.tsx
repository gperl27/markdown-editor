import React, { Fragment, RefObject, useRef, useState } from "react";
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
import StaticServer from "react-native-static-server";
import RNFS from "react-native-fs";
import Markdown from "react-native-simple-markdown";
import { WebViewMessage } from "react-native-webview/lib/WebViewTypes";
import { iOSUIKit } from "react-native-typography";

let path = RNFS.MainBundlePath + "/build";
let server = new StaticServer(8080, path, { localOnly: true });

server.start().then((url: string) => {
  console.log("Serving at URL", url);
});

const App = () => {
  const webviewRef = useRef<WebView>();
  const [value, setValue] = useState("");
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);

  const onMessage = (webviewEvent: NativeSyntheticEvent<WebViewMessage>) => {
    const decodedMessage: { event: string; value: string } = JSON.parse(
      webviewEvent.nativeEvent.data
    );

    if (decodedMessage.event === "change") {
      setValue(decodedMessage.value);
    }

    if (decodedMessage.event === "toggle_preview") {
      setShowMarkdownPreview(!showMarkdownPreview);

      if (webviewRef.current) {
        webviewRef.current.forceUpdate();
      }
    }
  };

  return (
    <Fragment>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        <View>
          <Text>Top UI Bar Here</Text>
          <Button
            title={"click me"}
            onPress={() => setShowMarkdownPreview(!showMarkdownPreview)}
          />
        </View>
        <View style={styles.container}>
          <View style={styles.webViewContainer}>
            <WebView
              ref={webviewRef as RefObject<WebView>}
              keyboardDisplayRequiresUserAction={false}
              scrollEnabled={false}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              bounces={false}
              overScrollMode="never"
              source={{ uri: "http://localhost:8080" }}
              javaScriptEnabled={true}
              originWhitelist={["*"]}
              allowFileAccess={true}
              useWebKit={true}
              onMessage={onMessage}
            />
          </View>
          {showMarkdownPreview && (
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
  }
});

const markdownStyles = StyleSheet.create({
  heading1: {
    ...iOSUIKit.largeTitleEmphasizedObject,
    marginBottom: iOSUIKit.largeTitleEmphasizedObject.fontSize * 0.3,
    marginTop: iOSUIKit.largeTitleEmphasizedObject.fontSize * 0.3,
  },
  heading2: iOSUIKit.title3EmphasizedObject,
  heading3: iOSUIKit.title3Object,
  body: iOSUIKit.bodyObject
});

export default App;
