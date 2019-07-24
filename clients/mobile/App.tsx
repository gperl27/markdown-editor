import React, { Fragment, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  StatusBar,
  View,
  NativeSyntheticEvent,
  ScrollView
} from "react-native";
import { WebView } from "react-native-webview";
import StaticServer from "react-native-static-server";
import RNFS from "react-native-fs";
import Markdown from "react-native-simple-markdown";
import { WebViewMessage } from "react-native-webview/lib/WebViewTypes";

let path = RNFS.MainBundlePath + "/build";
let server = new StaticServer(8080, path, { localOnly: true });

server.start().then((url: string) => {
  console.log("Serving at URL", url);
});

const App = () => {
  const [value, setValue] = useState("");

  const onMessage = (webviewEvent: NativeSyntheticEvent<WebViewMessage>) => {
    const decodedMessage: { event: string; value: string } = JSON.parse(
      webviewEvent.nativeEvent.data
    );

    setValue(decodedMessage.value);
  };

  return (
    <Fragment>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.container}>
          <View style={styles.webViewContainer}>
            <WebView
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
          <View style={styles.markdownContainer}>
            <ScrollView>
              <Markdown>{value}</Markdown>
            </ScrollView>
          </View>
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
    flex: 2
    // width: "60%"
  },
  markdownContainer: {
    flex: 1
    // width: "40%"
  }
});

export default App;
