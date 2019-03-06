import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'

import { Editor } from 'slate-react'
import { Value, Range, Selection } from 'slate'

import { Parser } from 'es-query-parser'
import Plain from 'slate-plain-serializer'

import BraceCompletionPlugin from './brace-completion-plugin.js'
import ESQuerySyntaxPlugin from './es-query-syntax-plugin.js'


const plugins = [
  BraceCompletionPlugin(),
  ESQuerySyntaxPlugin({
    fieldTypes: () => ['this', 'that', 'the-other'],
    values: (field) => {
      return ['f', 'n', 'm'].map(k => `${k}-${field}`)
    }
  })
];

class App extends React.Component {
  state = {
    value: Plain.deserialize('this AND that:other'),
  }

  onChange = ({ value }) => {
    const text = value.document.text
    const parser = new Parser(text)
    const results = parser.results();
    this.setState({ value, results })
  }

  render() {
    return <div>
      <Editor
        value={this.state.value}
        onChange={this.onChange}
        plugins={plugins}
      />
      { /*<xmp>{JSON.stringify(this.state.value, null, 4)}</xmp> */}
    </div>;
  }
}


ReactDOM.render(<App />, document.getElementById('widget'))
