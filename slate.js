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
    this.setState({ value })
    console.log( new Parser(Plain.serialize(value)).results() )
  }

  result() {}

  // Render the editor.
  render() {
    return <div>
      <Editor value={this.state.value} onChange={this.onChange} />
      <xmp key="debug">{ JSON.stringify([this.state.value, this.result()], undefined, 4) }</xmp>
    </div>;
  }
}


ReactDOM.render(<App />, document.getElementById('widget'))
