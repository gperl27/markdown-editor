import React from "react";
import { SafeAreaView, StyleSheet, StatusBar } from "react-native";
import { FilesProvider } from "./src/contexts/FilesContext";
import { Main } from "./src/screens/Main";

const App = () => {
  return (
    <FilesProvider>
      <SafeAreaView style={styles.safeAreaView}>
        <StatusBar barStyle="dark-content" />
        <Main />
      </SafeAreaView>
    </FilesProvider>
  );
};

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1
  }
});

export default App;
