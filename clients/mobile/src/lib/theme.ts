import { iOSUIKit } from "react-native-typography";

interface StyleObject {
  fontSize?: number;
}

const decorateTextMarginBasedOnFontSize = (
  styleObject: StyleObject,
  percent: number
) => {
  if (!styleObject.fontSize) {
    return styleObject;
  }

  return {
    marginTop: styleObject.fontSize * (percent / 100),
    marginBottom: styleObject.fontSize * (percent / 100),
    ...styleObject
  };
};

export const iOSMarkdownStyleFactory = () => {
  return {
    text: {
      fontFamily: iOSUIKit.largeTitleEmphasizedObject.fontFamily,
    },
    heading1: decorateTextMarginBasedOnFontSize(
      iOSUIKit.largeTitleEmphasizedObject,
      35
    ),
    heading2: decorateTextMarginBasedOnFontSize(
      iOSUIKit.title3EmphasizedObject,
      35
    ),
    heading3: decorateTextMarginBasedOnFontSize(iOSUIKit.title3Object, 35),
    paragraph: decorateTextMarginBasedOnFontSize(
      iOSUIKit.largeTitleEmphasizedObject,
      35
    )
  };
};
