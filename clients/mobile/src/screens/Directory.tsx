import { StyleSheet, TouchableHighlight, View} from "react-native";
import {Button, Header, Icon, Input, ListItem, Text} from "react-native-elements";
import {SwipeListView} from "react-native-swipe-list-view";
import React, {ComponentProps, useContext, useState} from "react";
import {FileFromDir, FileIndex, FileWithContent, Folder, isDirectory} from "../repositories/filesRepository";
import {FilesContext} from "../contexts/FilesContext";
import Tooltip from "react-native-walkthrough-tooltip";

type ListViewItem = FileFromDir & {
    depth: number;
    hiddenItemProps?: HiddenItemProps;
};

interface HiddenItemProps {
    onDeleteItem(item: FileWithContent): void;
    onRenameItem?(item: FileWithContent): void;
}

interface HiddenItem {
    item: FileWithContent;
    hiddenItemProps: HiddenItemProps;
}

const HiddenItem = (props: HiddenItem) => {
    const { item, hiddenItemProps } = props;
    const [showTooltip, setShowTooltip] = useState(false);

    const onDeleteItem = () => {
        hiddenItemProps.onDeleteItem(item);
        setShowTooltip(false);
    };

    return (
        <View style={styles.rowBack}>
            <Tooltip
                animated
                isVisible={showTooltip}
                content={(
                    <View>
                        <Button type={"clear"} onPress={onDeleteItem} title={"Delete"}/>
                    </View>
                )}
                placement="top"
                onClose={() => setShowTooltip(false)}
            >
                <TouchableHighlight onPress={() => setShowTooltip(true)}>
                    <Text>Delete</Text>
                </TouchableHighlight>
            </Tooltip>
            <TouchableHighlight
                onPress={() =>
                    hiddenItemProps.onRenameItem && hiddenItemProps.onRenameItem(item)
                }
            >
                <Text>Rename</Text>
            </TouchableHighlight>
        </View>
    );
};

interface Props {
   viewProps: Partial<ComponentProps<typeof View>>;
   onDeleteFile: (file: FileFromDir) => void;
   onRenameItem: (file: FileFromDir) => void;
   onClickFolder?: (file: Folder) => void;
   onClickFile?: (file: FileWithContent) => void;
}

const getNameFromFilePath = (filepath: string) => {
    const fileChunks = filepath.split("/");

    return fileChunks[fileChunks.length - 1];
};

export const Directory = (props: Props) => {
    const {
        files,
        newFolder,
        toggleFolderOpen,
    } = useContext(FilesContext);
    const [newFolderPath, setNewFolderPath] = useState("");

    const getListItemProps = (item: ListViewItem) => {
        const fileOrFolderProps: Partial<ComponentProps<typeof ListItem>> = {};

        const commonProps: Partial<ComponentProps<typeof ListItem>> = {
            containerStyle: {
                marginLeft: item.depth * 10
            }
        };

        const onClickFolder = () => {
            toggleFolderOpen(item as Folder);

           props.onClickFolder && props.onClickFolder(item as Folder);
        };

        if (isDirectory(item)) {
            fileOrFolderProps.chevron = true;
            fileOrFolderProps.leftIcon = <Icon name="folder" />;
            fileOrFolderProps.onPress = onClickFolder;
            fileOrFolderProps.onLongPress = () => console.log('long press mate')
        } else if (item.isFile()) {
            fileOrFolderProps.leftIcon = <Icon type="font-awesome" name="file" />;
            fileOrFolderProps.onPress = async () => props.onClickFile && await props.onClickFile(item);
            fileOrFolderProps.onLongPress = () => console.log('long press mate')
        }

        return {
            ...commonProps,
            ...fileOrFolderProps
        };
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

    const transformFileIndexToArrayLike = (
        filesToTransform?: FileIndex,
        depth: number = 0
    ) => {
        const transformedFiles: ListViewItem[] = [];

        if (!filesToTransform) {
            return [];
        }

        Object.keys(filesToTransform).forEach(key => {
            const currentFile = filesToTransform[key];

            transformedFiles.push({
                ...currentFile,
                depth
            });

            // only show subtree if directory is "open"
            if (isDirectory(currentFile) && currentFile.files && currentFile.open) {
                transformedFiles.push(
                    ...transformFileIndexToArrayLike(
                        currentFile.files,
                        depth + 1
                    )
                );
            }
        });

        return transformedFiles;
    };

    const renderHiddenItem = ({ item }: { item: FileWithContent }) => {
        const hiddenItemProps = {
            onDeleteItem: () => props.onDeleteFile(item),
            onRenameItem: () => console.log("rename me")
        };

        return <HiddenItem item={item} hiddenItemProps={hiddenItemProps} />;
    };

    return (
        <View {...props.viewProps}>
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
                renderHiddenItem={renderHiddenItem}
                rightOpenValue={-150}
                leftOpenValue={75}
                stopRightSwipe={-225}
                stopLeftSwipe={1}
                closeOnScroll={true}
                closeOnRowPress={true}
            />
        </View>
    )
};

const styles = StyleSheet.create({
    directoryList: {
        flex: 0.5
    },
    rowBack: {
        alignItems: "center",
        backgroundColor: "#DDD",
        flex: 1,
        flexDirection: "row",
        justifyContent: "flex-end",
        paddingRight: 15
    },
    rowFront: {
        alignItems: "center",
        backgroundColor: "#CCC",
        borderBottomColor: "black",
        borderBottomWidth: 1,
        justifyContent: "center",
        height: 50
    },
});

