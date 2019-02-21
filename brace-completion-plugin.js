export default function BraceCompletionPlugin(options) {
  return {
    onKeyDown(event, editor, next) {
      const focusOffset = editor.value.selection.focus.offset;
      const focusText = editor.value.focusText.text;
      const followingCharacter = focusText[focusOffset]

      if (event.key == '(') {
        event.preventDefault()
        editor.wrapText('(', ')')
      } else if (event.key == ')' && followingCharacter == ')') {
        event.preventDefault()
        editor.moveForward(1)
      } else {
        next()
      }
    }
  }
}
