import React from 'react'
import ReactDOM from 'react-dom'

import { Editor } from 'slate-react'
import { Value } from 'slate'

import { Parser } from 'es-query-parser'
import Plain from 'slate-plain-serializer'


const initialValue = Value.fromJSON({
  document: {
    nodes: [
      {
        object: 'block',
        type: 'paragraph',
        nodes: [
          {
            object: 'text',
            leaves: [
              {
                text: 'this AND (that OR "the other")',
              },
            ],
          },
        ],
      },
    ],
  },
})

// Define our app...
class App extends React.Component {
  // Set the initial value when the app is first constructed.
  state = {
    value: initialValue,
  }

  // On change, update the app's React state with the new editor value.
  onChange = ({ value }) => {
    const result = new Parser(Plain.serialize(value)).results()
    this.setState({ value, result })
  }

  onKeyDown = (event, editor, next) => {
    const focusOffset = this.state.value.selection.focus.offset;
    const focusText = this.state.value.focusText.text;
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

  // Render the editor.
  render() {
    return <div>
      <Editor
        value={this.state.value}
        onChange={this.onChange}
        onKeyDown={this.onKeyDown}
      />
      <xmp key="debug">{ JSON.stringify([this.state.value, this.state.result], undefined, 4) }</xmp>
    </div>;
  }
}


ReactDOM.render(<App />, document.getElementById('widget'))
