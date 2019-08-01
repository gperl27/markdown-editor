import React from "react";
import { SafeAreaView, StyleSheet, StatusBar } from "react-native";
import { FilesProvider } from "./src/contexts/FilesContext";
import { Main } from "./src/screens/Main";
import { ThemeProvider } from "react-native-elements";
import { theme } from "./src/lib/theme";

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
