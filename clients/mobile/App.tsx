/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/emin93/react-native-template-typescript
 *
 * @format
 */

import React, { Fragment } from "react";
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  StatusBar,
  View
} from "react-native";

import { Colors } from "react-native/Libraries/NewAppScreen";

import { WebView } from "react-native-webview";
import StaticServer from "react-native-static-server";
import RNFS from "react-native-fs";

// path where files will be served from (index.html here)
let path = RNFS.MainBundlePath + "/build";
let server = new StaticServer(8080, path, { localOnly: true });

server.start().then(url => {
  console.log("Serving at URL", url);
});

const App = () => {
  return (
    <Fragment>
      <StatusBar barStyle="dark-content" />
      <WebView
        source={{ uri: "http://localhost:8080" }}
        javaScriptEnabled={true}
        originWhitelist={["*"]}
        allowFileAccess={true}
        useWebKit={false}
        onMessage={event => {
          alert(event.nativeEvent.data);
        }}
      />
    </Fragment>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter
  },
  engine: {
    position: "absolute",
    right: 0
  },
  body: {
    backgroundColor: Colors.white
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.black
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "400",
    color: Colors.dark
  },
  highlight: {
    fontWeight: "700"
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: "600",
    padding: 4,
    paddingRight: 12,
    textAlign: "right"
  }
});

export default App;
