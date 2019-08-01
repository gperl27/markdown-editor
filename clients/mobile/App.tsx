import React from "react";
import { SafeAreaView, StyleSheet, StatusBar } from "react-native";
import { FilesProvider } from "./src/contexts/FilesContext";
import { Main } from "./src/screens/Main";
import { ThemeProvider } from "react-native-elements";
import { iOSUIKit } from "react-native-typography";

const theme = {
  Text: {
    h1Style: iOSUIKit.largeTitleEmphasizedObject,
    h2Style: iOSUIKit.title3EmphasizedObject,
    h3Style: iOSUIKit.title3Object
  }
};

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <FilesProvider>
        <SafeAreaView style={styles.safeAreaView}>
          <StatusBar barStyle="dark-content" />
          <Main />
        </SafeAreaView>
      </FilesProvider>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1
  }
});

export default App;
