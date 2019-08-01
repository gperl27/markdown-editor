import {
  AppState,
  AppStateStatus,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  View
} from "react-native";
import { SwipeListView } from "react-native-swipe-list-view";
import {
  editorUiInitialState,
  editorUiReducer,
  EditorUiTypes
} from "../reducers/editorUi";
import { WebView } from "react-native-webview";
import React, {
  ComponentProps,
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
import { FilesContext, FileWithContent } from "../contexts/FilesContext";
import { AppToHtml } from "../domain/editorIpc";
import { useLocalServer } from "../hooks/useStaticServer";
import {
  Header,
  Icon,
  ListItem,
  Text,
  Input,
  Button
} from "react-native-elements";

export const Main = () => {
  const {
    setCurrentWorkingFile,
    currentWorkingFile,
    files,
    deleteFile,
    updateFilename
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
    setCurrentWorkingFile(file);
    sendToEditor(AppToHtml.UPDATE_EDITOR_VALUE, file.content);
  };

  const onDeleteItem = async (item: FileWithContent) => {
    await deleteFile(item);

    if (item.path === (currentWorkingFile && currentWorkingFile.path)) {
      console.log(item.path, currentWorkingFile, "ON DELETE");
      await onNewFile();
    }
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

  const getListItemProps = (item: FileWithContent) => {
    const fileOrFolderProps: Partial<ComponentProps<typeof ListItem>> = {};

    if (item.isDirectory()) {
      fileOrFolderProps.chevron = true;
      fileOrFolderProps.leftIcon = <Icon name="folder" />;
      fileOrFolderProps.onPress = () => console.log("open directory");
    } else if (item.isFile()) {
      fileOrFolderProps.leftIcon = <Icon type="font-awesome" name="file" />;
      fileOrFolderProps.onPress = () => onGetFileContents(item);
    }

    return fileOrFolderProps;
  };

  const getNameFromFilePath = (filepath: string) => {
    const fileChunks = filepath.split("/");

    return fileChunks[fileChunks.length - 1];
  };

  const renderFile = ({
    item
  }: {
    item: FileWithContent;
    index: number;
    separators: any;
  }) => {
    return (
      <ListItem
        title={getNameFromFilePath(item.path)}
        {...getListItemProps(item)}
      />
    );
  };

  const hiddenItem = ({ item }: { item: FileWithContent }) => {
    return (
      <TouchableHighlight
        style={styles.rowBack}
        onPress={() => onDeleteItem(item)}
      >
        <Text>Delete</Text>
      </TouchableHighlight>
    );
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

  const transformFileIndexToArrayLike = () => {
    const transformedFiles: FileWithContent[] = [];

    if (!files) {
      return [];
    }

    Object.keys(files).forEach(key => {
      transformedFiles.push(files[key]);
    });

    return transformedFiles;
  };

  const isPreviewOnly = state.showMarkdownPreview && !state.showEditor;
  const isBoth = state.showMarkdownPreview && state.showEditor;
  const isEditorOnly = state.showEditor && !state.showMarkdownPreview;

  useEffect(() => {
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
  }, [getEditorCache]);

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
        <View style={styles.directoryList}>
          <Header
            backgroundColor={"lavender"}
            centerComponent={<Text h2={true}>Files</Text>}
          />
          <SwipeListView
            keyExtractor={(item, index) => index.toString()}
            data={transformFileIndexToArrayLike()}
            renderItem={renderFile}
            renderHiddenItem={hiddenItem}
            rightOpenValue={-75}
            leftOpenValue={75}
            stopRightSwipe={-150}
            stopLeftSwipe={1}
            closeOnScroll={true}
            closeOnRowPress={true}
          />
        </View>
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
              onLoadEnd={onAppLoad}
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
  rowFront: {
    alignItems: "center",
    backgroundColor: "#CCC",
    borderBottomColor: "black",
    borderBottomWidth: 1,
    justifyContent: "center",
    height: 50
  },
  rowBack: {
    alignItems: "center",
    backgroundColor: "#DDD",
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingRight: 15
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
