import * as React from 'react';
import MonacoEditor from 'react-monaco-editor';
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';
import { ComponentProps } from 'react';

const primaryLanguage = 'markdown';
const defaultTheme = 'vs-dark';

enum COMMAND {
    SAVE = 'save'
}

type Command<T> = (eventName: COMMAND, data?: T) => void;

interface Commands<T = {}> {
   onSave?: Command<T>
}

interface Props extends ComponentProps<typeof MonacoEditor>, Commands {
}

const defaultOptions: monacoEditor.editor.IEditorOptions = {
    wordWrap: "on"
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

        editor.addCommand(monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, monaco.KeyCode.Unknown), () => {
            props.onSave && props.onSave(COMMAND.SAVE);
        });

        props.editorDidMount && props.editorDidMount(editor, monaco);
    };

    return (
        <MonacoEditor
            {...props}
            options={{...defaultOptions, ...props.options}}
            language={language}
            theme={theme}
            value={value}
            onChange={onChange}
            editorDidMount={editorDidMount}
        />
    );
};
