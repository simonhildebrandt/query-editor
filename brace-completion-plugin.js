const defaultMatches = {
  "(": ")",
  '"': '"',
  "'": "'",
  "[": "]",
  "{": "}",
  "<": ">",
  "`": "`"
};


export default function BraceCompletionPlugin(options={}) {
  return {
    onKeyDown(event, editor, next) {
      const focusOffset = editor.value.selection.focus.offset;
      const focusText = editor.value.focusText.text;
      const followingCharacter = focusText[focusOffset]
      const { key } = event;

      const matches = options.matches || defaultMatches;

      if (Object.values(matches).includes(key) && followingCharacter == key) {
        event.preventDefault()
        editor.moveForward(1)
      } else if (Object.keys(matches).includes(key)) {
        event.preventDefault()
        editor.wrapText(key, matches[key])
      } else {
        next()
      }
    }
  }
}
