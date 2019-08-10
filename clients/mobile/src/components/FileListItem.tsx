import React, {ComponentProps, useContext, useState} from "react";
import Tooltip from "react-native-walkthrough-tooltip";
import {Icon, ListItem} from "react-native-elements";
import {ItemProps, ListViewItem} from "../screens/Directory";
import {FileFromDir, FileWithContent, Folder, isDirectory} from "../repositories/filesRepository";
import {FilesContext} from "../contexts/FilesContext";

interface Props {
    item: ItemProps;
    onDeleteFile: (file: FileFromDir) => void;
    onRenameItem: (file: FileFromDir) => void;
    onClickFolder?: (file: Folder) => void;
    onClickFile?: (file: FileWithContent) => void;
}

const getNameFromFilePath = (filepath: string) => {
    const fileChunks = filepath.split("/");

    return fileChunks[fileChunks.length - 1];
};

export const FileListItem = (props: Props) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const {
        newFolder,
        toggleFolderOpen,
    } = useContext(FilesContext);

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

    return (
        <Tooltip isVisible={showTooltip}>
            <ListItem
                title={getNameFromFilePath(props.item.item.path)}
                {...getListItemProps(props.item.item)}
            />
        </Tooltip>
    );
};
