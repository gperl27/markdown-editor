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
import {
  FilesContext,
} from "../contexts/FilesContext";
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
import * as Animatable from "react-native-animatable";
import {
  FileFromDir,
  FileIndex,
  FileWithContent,
  isDirectory
} from "../repositories/filesRepository";

type ListViewItem = FileFromDir & {
  depth: number;
};

const AnimatedScrollView = Animatable.createAnimatableComponent(ScrollView);

export const Main = () => {
  const {
    setCurrentWorkingFile,
    currentWorkingFile,
    files,
    deleteFile,
    updateFilename,
    newFolder,
    toggleFolderOpen
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
  const [newFolderPath, setNewFolderPath] = useState("");

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
      await onNewFile();
    }
  };

  const onAppLoad = async () => {
    // TODO: FIXME
    await removeItem();
    return;

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

  const getListItemProps = (item: ListViewItem) => {
    const fileOrFolderProps: Partial<ComponentProps<typeof ListItem>> = {};

    const commonProps: Partial<ComponentProps<typeof ListItem>> = {
      containerStyle: {
        marginLeft: item.depth * 10
      }
    };

    if (isDirectory(item)) {
      fileOrFolderProps.chevron = true;
      fileOrFolderProps.leftIcon = <Icon name="folder" />;
      fileOrFolderProps.onPress = () => toggleFolderOpen(item);
    } else if (item.isFile()) {
      fileOrFolderProps.leftIcon = <Icon type="font-awesome" name="file" />;
      fileOrFolderProps.onPress = () => onGetFileContents(item);
    }

    return {
      ...commonProps,
      ...fileOrFolderProps
    };
  };

  const getNameFromFilePath = (filepath: string) => {
    const fileChunks = filepath.split("/");

    return fileChunks[fileChunks.length - 1];
  };

  const renderFile = ({
    item
  }: {
    item: ListViewItem;
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

  const transformFileIndexToArrayLike = (
    filesToTransform?: FileIndex,
    depth: number = 0
  ) => {
    const transformedFiles: ListViewItem[] = [];

    if (!filesToTransform) {
      return [];
    }

    Object.keys(filesToTransform).forEach(key => {
      transformedFiles.push({
        ...filesToTransform[key],
        depth
      });

      if (filesToTransform[key].files && filesToTransform[key].open) {
        transformedFiles.push(
          ...transformFileIndexToArrayLike(
            filesToTransform[key].files,
            depth + 1
          )
        );
      }
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
  }, []);

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
            rightComponent={<Icon name={"files-o"} />}
          />
          <View>
            <Input value={newFolderPath} onChangeText={setNewFolderPath} />
            <Button onPress={() => newFolder(newFolderPath)} title={"Submit"} />
          </View>
          <SwipeListView
            keyExtractor={(item, index) => index.toString()}
            data={transformFileIndexToArrayLike(files)}
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
              <Markdown
                style={
                  state.showMarkdownPreview
                    ? markdownStyles
                    : { padding: 0 }
                }
              >
                {value}
              </Markdown>
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
