import MonacoEditor from 'react-monaco-editor';
import { ComponentProps } from 'react';
declare enum COMMAND {
    SAVE = "save"
}
declare type Command<T> = (eventName: COMMAND, data?: T) => void;
interface Commands<T = {}> {
    onSave?: Command<T>;
}
interface Props extends ComponentProps<typeof MonacoEditor>, Commands {
}
export declare const Editor: (props: Props) => JSX.Element;
export {};
