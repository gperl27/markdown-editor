"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var React = __importStar(require("react"));
var react_monaco_editor_1 = __importDefault(require("react-monaco-editor"));
var primaryLanguage = 'markdown';
var defaultTheme = 'vs-dark';
var COMMAND;
(function (COMMAND) {
    COMMAND["SAVE"] = "save";
})(COMMAND || (COMMAND = {}));
exports.Editor = function (props) {
    var _a = React.useState(props.language || primaryLanguage), language = _a[0], setLanguage = _a[1];
    var _b = React.useState(props.theme || defaultTheme), theme = _b[0], setTheme = _b[1];
    var _c = React.useState(props.defaultValue || ''), value = _c[0], setValue = _c[1];
    var onChange = function (value, event) {
        setValue(value);
        props.onChange && props.onChange(value, event);
    };
    var editorDidMount = function (editor, monaco) {
        editor.focus();
        editor.addCommand(monaco.KeyCode.Tab, function () {
            alert('my command is executing!');
        });
        // @ts-ignore
        editor.addCommand(monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S), function () {
            console.log('saving');
            alert('my command is saving!!');
            props.onSave && props.onSave(COMMAND.SAVE);
        });
        props.editorDidMount && props.editorDidMount(editor, monaco);
    };
    return (React.createElement(react_monaco_editor_1.default, __assign({}, props, { language: language, theme: theme, value: value, onChange: onChange, editorDidMount: editorDidMount })));
};
//# sourceMappingURL=Editor.js.map

//# sourceMappingURL={"version":3,"file":"Editor.js","sourceRoot":"","sources":["Editor.tsx"],"names":[],"mappings":";;;;;;;;;;;;;;;;;;;;;;;AAAA,2CAA+B;AAC/B,4EAA+C;AAI/C,IAAM,eAAe,GAAG,UAAU,CAAC;AACnC,IAAM,YAAY,GAAG,SAAS,CAAC;AAE/B,IAAK,OAEJ;AAFD,WAAK,OAAO;IACR,wBAAa,CAAA;AACjB,CAAC,EAFI,OAAO,KAAP,OAAO,QAEX;AAWY,QAAA,MAAM,GAAG,UAAC,KAAY;IACzB,IAAA,sDAA2E,EAA1E,gBAAQ,EAAE,mBAAgE,CAAC;IAC5E,IAAA,gDAA+D,EAA9D,aAAK,EAAE,gBAAuD,CAAC;IAChE,IAAA,6CAA4D,EAA3D,aAAK,EAAE,gBAAoD,CAAC;IAEnE,IAAM,QAAQ,GAAG,UAAC,KAAa,EAAE,KAAoD;QACjF,QAAQ,CAAC,KAAK,CAAC,CAAC;QAEhB,KAAK,CAAC,QAAQ,IAAI,KAAK,CAAC,QAAQ,CAAC,KAAK,EAAE,KAAK,CAAC,CAAC;IACnD,CAAC,CAAC;IAEF,IAAM,cAAc,GAAG,UAAC,MAAiD,EAAE,MAA2B;QAClG,MAAM,CAAC,KAAK,EAAE,CAAC;QAEf,MAAM,CAAC,UAAU,CAAC,MAAM,CAAC,OAAO,CAAC,GAAG,EAAE;YAClC,KAAK,CAAC,0BAA0B,CAAC,CAAC;QACtC,CAAC,CAAC,CAAC;QAEH,aAAa;QACb,MAAM,CAAC,UAAU,CAAC,MAAM,CAAC,MAAM,CAAC,KAAK,CAAC,MAAM,CAAC,MAAM,CAAC,OAAO,GAAG,MAAM,CAAC,OAAO,CAAC,KAAK,CAAC,EAAE;YACjF,OAAO,CAAC,GAAG,CAAC,QAAQ,CAAC,CAAC;YACtB,KAAK,CAAC,wBAAwB,CAAC,CAAC;YAChC,KAAK,CAAC,MAAM,IAAI,KAAK,CAAC,MAAM,CAAC,OAAO,CAAC,IAAI,CAAC,CAAC;QAC/C,CAAC,CAAC,CAAC;QAEH,KAAK,CAAC,cAAc,IAAI,KAAK,CAAC,cAAc,CAAC,MAAM,EAAE,MAAM,CAAC,CAAC;IACjE,CAAC,CAAC;IAEF,OAAO,CACH,oBAAC,6BAAY,eACL,KAAK,IACT,QAAQ,EAAE,QAAQ,EAClB,KAAK,EAAE,KAAK,EACZ,KAAK,EAAE,KAAK,EACZ,QAAQ,EAAE,QAAQ,EAClB,cAAc,EAAE,cAAc,IAChC,CACL,CAAC;AACN,CAAC,CAAC"}