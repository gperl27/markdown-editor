import * as React from 'react';
import MonacoEditor from 'react-monaco-editor';
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';
import { ComponentProps } from 'react';

export enum COMMAND {
    SAVE = 'save',
    TOGGLE_PREVIEW = 'toggle_preview',
    TOGGLE_FOCUS_MODE = 'toggle_focus_mode',
    NEW_FILE = 'new_file'
}

export type Command<T> = (eventName: COMMAND, data?: T) => void;

export interface Commands<T = {}> {
    onSave?: Command<T>;
    onTogglePreview?: Command<T>
    onToggleFocusMode?: Command<T>
    onNewFile?: Command<T>
}

export interface Props extends ComponentProps<typeof MonacoEditor>, Commands {
}

const primaryLanguage = 'markdown';
const defaultTheme = 'vs-dark';
const defaultOptions: monacoEditor.editor.IEditorOptions = {
    automaticLayout: true,
    wordWrap: 'on',
};

export const Editor = (props: Props) => {
    const [language, setLanguage] = React.useState(props.language || primaryLanguage);
    const [theme, setTheme] = React.useState(props.theme || defaultTheme);
    const [value, setValue] = React.useState(props.defaultValue || '');

    const onChange = (value: string, event: monacoEditor.editor.IModelContentChangedEvent) => {
        setValue(value);

        props.onChange && props.onChange(value, event);
    };

    const editorDidMount = (editor: monacoEditor.editor.IStandaloneCodeEditor, monaco: typeof monacoEditor) => {
        editor.focus();

        editor.addCommand(monaco.KeyMod.chord(monaco.KeyMod.Alt | monaco.KeyCode.KEY_S, monaco.KeyCode.Unknown), () => {
            props.onSave && props.onSave(COMMAND.SAVE);
        });

        editor.addCommand(monaco.KeyMod.chord(monaco.KeyMod.Alt | monaco.KeyCode.KEY_R, monaco.KeyCode.Unknown), () => {
            props.onTogglePreview && props.onTogglePreview(COMMAND.TOGGLE_PREVIEW);
        });

        editor.addCommand(monaco.KeyMod.chord(monaco.KeyMod.Alt | monaco.KeyCode.KEY_D, monaco.KeyCode.Unknown), () => {
            props.onToggleFocusMode && props.onToggleFocusMode(COMMAND.TOGGLE_FOCUS_MODE);
        });

        editor.addCommand(monaco.KeyMod.chord(monaco.KeyMod.Alt | monaco.KeyCode.KEY_N, monaco.KeyCode.Unknown), () => {
            props.onNewFile && props.onNewFile(COMMAND.NEW_FILE);
        });

        editor.addCommand(monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, monaco.KeyCode.Unknown), () => {
            props.onSave && props.onSave(COMMAND.SAVE);
        });

        editor.addCommand(monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_R, monaco.KeyCode.Unknown), () => {
            props.onTogglePreview && props.onTogglePreview(COMMAND.TOGGLE_PREVIEW);
        });

        editor.addCommand(monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_D, monaco.KeyCode.Unknown), () => {
            props.onToggleFocusMode && props.onToggleFocusMode(COMMAND.TOGGLE_FOCUS_MODE);
        });

        props.editorDidMount && props.editorDidMount(editor, monaco);
    };


    return (
        <MonacoEditor
            {...props}
            options={{ ...defaultOptions, ...props.options }}
            language={language}
            theme={theme}
            value={value}
            onChange={onChange}
            editorDidMount={editorDidMount}
        />
    );
};
