import {
  AppState,
  AppStateStatus,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import {
  editorUiInitialState,
  editorUiReducer,
  EditorUiTypes
} from "../reducers/editorUi";
import { WebView } from "react-native-webview";
import React, {
  MutableRefObject,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState
} from "react";
import Markdown from "react-native-markdown-renderer";
import { iOSMarkdownStyleFactory } from "../lib/theme";
import { useAsyncStorage } from "@react-native-community/async-storage";
import { Cache, CacheKeys } from "../domain/cache";
import { useEditor } from "../hooks/useEditor";
import { FilesContext } from "../contexts/FilesContext";
import { AppToHtml } from "../domain/editorIpc";
import { useLocalServer } from "../hooks/useStaticServer";
import {
  Header,
  Icon,
  Text,
  Input,
  Button,
} from "react-native-elements";
import * as Animatable from "react-native-animatable";
import {
  FileWithContent,
} from "../repositories/filesRepository";
import { useOnMount } from "../hooks/useOnMount";
import {Directory} from "./Directory";

export const Main = () => {
  const {
    setCurrentWorkingFile,
    currentWorkingFile,
    updateFilename,
    loadFileFromCache,
    deleteFile
  } = useContext(FilesContext);
  const [state, dispatch] = useReducer(editorUiReducer, editorUiInitialState);
  const { uri } = useLocalServer();
  const ref = useRef<WebView>();
  const {
    getItem: getEditorCache,
    mergeItem: mergeEditorCache,
    removeItem
  } = useAsyncStorage(CacheKeys.EDITOR_STATE);

  const onNewFile = async () => {
    sendToEditor(AppToHtml.RESET);
    setCurrentWorkingFile(undefined);
    await removeItem();
  };

  const { onMessage, value, position, injectedJavascriptFactory } = useEditor({
    onNewFile,
    dispatch
  });

  const onDeleteItem = async (item: FileWithContent) => {
    await deleteFile(item);

    if (item.path === (currentWorkingFile && currentWorkingFile.path)) {
      await onNewFile();
    }
  };

  const [isEditingFilename, setIsEditingFilename] = useState(false);
  const [newFilename, setNewFilename] = useState("");

  const onShowEditorOnly = () => {
    dispatch({ type: EditorUiTypes.SHOW_EDITOR_ONLY });
  };

  const onShowPreviewOnly = () => {
    dispatch({ type: EditorUiTypes.SHOW_PREVIEW_ONLY });
  };

  const sendToEditor = (event: string, data?: any) => {
    const injected = injectedJavascriptFactory(event, data);

    if (ref && ref.current) {
      ref.current.injectJavaScript(injected);
    }
  };

  const onGetFileContents = async (file: FileWithContent) => {
    await loadFileFromCache(file);
    sendToEditor(AppToHtml.UPDATE_EDITOR_VALUE, file.content);
  };


  const onAppLoad = async () => {
    const cachedEditorState = await getEditorCache();

    if (!cachedEditorState) {
      return;
    }

    const editorData: Cache = JSON.parse(cachedEditorState);

    await onGetFileContents(editorData.file);
    sendToEditor(AppToHtml.UPDATE_EDITOR_POSITION, editorData.position);
  };

  const getFileName = () => {
    if (!currentWorkingFile) {
      return "untitled";
    }

    const filepathSegments = currentWorkingFile.path.split("/");
    return filepathSegments[filepathSegments.length - 1];
  };

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "inactive") {
        console.log("the app is closed");
        mergeEditorCache(
          JSON.stringify({
            file: currentWorkingFile,
            position,
            viewState: state
          })
        ).catch(e => console.log(e));
      }
    };

    AppState.addEventListener("change", handleAppStateChange);

    return () => AppState.removeEventListener("change", handleAppStateChange);
  });



  const isPreviewOnly = state.showMarkdownPreview && !state.showEditor;
  const isBoth = state.showMarkdownPreview && state.showEditor;
  const isEditorOnly = state.showEditor && !state.showMarkdownPreview;

  useOnMount(() => {
    const loadStateFromCache = async () => {
      const cachedEditorState = await getEditorCache();

      if (!cachedEditorState) {
        return;
      }

      const editorData: Cache = JSON.parse(cachedEditorState);

      dispatch({ type: EditorUiTypes.LOAD, payload: editorData.viewState });
    };

    loadStateFromCache().catch(e =>
      console.log(e, "could not load editor state from cache")
    );
  });

  if (!uri) {
    return (
      <SafeAreaView style={styles.safeAreaView}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {state.showDirectory && (
        <Directory
            viewProps={{ style: styles.directoryList }}
            onDeleteFile={onDeleteItem}
            onRenameItem={() => console.log('hey')}
            onClickFile={onGetFileContents}
        />
      )}
      <View style={styles.editorContainer}>
        <Header
          containerStyle={{
            justifyContent: "center",
            borderLeftColor: "blue",
            borderLeftWidth: 0.5
          }}
          backgroundColor={"lavender"}
          leftComponent={
            <View>
              <Icon name={"font"} />
            </View>
          }
          centerComponent={
            <View>
              <TouchableOpacity onPress={() => setIsEditingFilename(true)}>
                <Text h2={true}>{getFileName()}</Text>
              </TouchableOpacity>
            </View>
          }
          rightComponent={
            <View style={styles.rightToolbar}>
              <View style={styles.previewButtonGroup}>
                <Icon
                  iconStyle={[
                    styles.icon,
                    isEditorOnly ? styles.iconSelected : {}
                  ]}
                  onPress={onShowEditorOnly}
                  name="file-code-o"
                />
                <Icon
                  iconStyle={[styles.icon, isBoth ? styles.iconSelected : {}]}
                  onPress={() => dispatch({ type: EditorUiTypes.SHOW_BOTH })}
                  name="columns"
                />
                <Icon
                  iconStyle={[
                    styles.icon,
                    isPreviewOnly ? styles.iconSelected : {}
                  ]}
                  onPress={onShowPreviewOnly}
                  name="book"
                />
              </View>
              <Icon size={32} onPress={onNewFile} name="edit" />
            </View>
          }
        />
        <View style={styles.innerEditorContainer}>
          <View
            style={state.showEditor ? styles.webViewContainer : { flex: 0 }}
          >
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
          <Animatable.View
            direction={state.showMarkdownPreview ? "normal" : "reverse"}
            transition="flex"
            style={
              state.showMarkdownPreview ? styles.markdownContainer : { flex: 0 }
            }
          >
            <ScrollView>
              {state.showMarkdownPreview ?
                  <Markdown
                      style={markdownStyles}
                  >
                    {value}
                  </Markdown>
                  :
                  <View/>
              }
            </ScrollView>
          </Animatable.View>
        </View>
      </View>
      <Modal presentationStyle={"formSheet"} visible={isEditingFilename}>
        <View
          style={{
            flex: 1,
            padding: 25
          }}
        >
          <View style={{ flex: 0.5 }} />
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "space-around"
            }}
          >
            <Text h3={true}>Update Filename</Text>
            <Input
              onChangeText={setNewFilename}
              defaultValue={currentWorkingFile && currentWorkingFile.name}
              value={newFilename}
            />
            <Button
              raised={true}
              title={"Submit"}
              onPress={() => updateFilename(newFilename)}
            />
          </View>
          <View style={{ flex: 1 }} />
          <Icon
            containerStyle={{ position: "absolute", top: 25, right: 25 }}
            onPress={() => setIsEditingFilename(false)}
            name={"close"}
          />
        </View>
      </Modal>
    </View>
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
    flex: 0.5
  },
  editorContainer: {
    flex: 2
  },
  innerEditorContainer: {
    flex: 1,
    flexDirection: "row"
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around"
  },
  previewButtonGroup: {
    flexDirection: "row",
    justifyContent: "center",
    marginRight: 50
  },
  icon: {
    marginRight: 12,
    marginLeft: 12
  },
  iconSelected: {
    color: "yellow"
  },
  rightToolbar: {
    flexDirection: "row"
  }
});

const markdownStyles = StyleSheet.create({
  root: {
    padding: "5%"
  },
  ...iOSMarkdownStyleFactory()
});
