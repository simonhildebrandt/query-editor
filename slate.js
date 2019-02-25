import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'

import { Editor } from 'slate-react'
import { Value, Range, Selection } from 'slate'

import { Parser } from 'es-query-parser'
import Plain from 'slate-plain-serializer'

import BraceCompletionPlugin from './brace-completion-plugin.js'
import Modifiable from './modifiable'


function spelunk(result) {
  const decs = []
  const build = (operator) => decs.push(operator)

  const process = (node, depth) => {
    //console.log(node)
    const { type } = node;
    switch(type) {
      case 'simple':
        process(node.value, depth + 1)
        break;
      case 'literal':
        var {value, start} = node
        build(node)
        break;
      case 'field':
        var {field, value, start} = node
        process(value, depth + 1)
        if (field) {
          console.log(node)
          build({...node, value: field})
        }
        break;
      case 'logical':
        var {operator, children, start} = node
        build({type: 'operator', ...operator})
        process(children[0], depth + 1)
        process(children[1], depth + 1)
        break;
      case 'quoted':
        var {value, start} = node
        break;
      case 'bracketed':
        var {value, start} = node
        process(value, depth + 1)
        break;
      default:
        break;
    }
  }

  process(result, 0);
  return decs;
}


const plugins = [BraceCompletionPlugin()];

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

  decorateNode = (node, editor, next) => {
    const others = next() || []
    let ours = []

    const parser = new Parser(editor.value.document.text)
    const results = parser.results();
    const isValid = parser.isValid();
    if (isValid) {
      const sections = spelunk(results[0])
      const { key } = node.getFirstText()

      ours = sections.map(section => {
        const { start, type, value } = section;
        const length = value.length;
        const anchor = { key, offset: start }
        const focus = { key, offset: start + length}
        const range = { anchor, focus }
        // It would be nice to pass the anchors through `data`, but that causes
        // Weird doubling in the rendered document.
        return { ...range, mark: { type, data: {key, start, length} } };
      })
    }

    return [...others, ...ours]
  }

  renderMark = (props, editor, next) => {
    const options = {
      operator: ['OR', 'AND', '&&', '||'],
      field: ['this', 'that'],
      literal: ['a', 'b']
    }
    const { children, mark, attributes } = props

    if (Object.keys(options).includes(mark.type)) {
      return <Modifiable
        {...attributes}
        mark={mark}
        editor={editor}
        options={options[mark.type]}
        >
        {children}
      </Modifiable>
    } else {
        return next();
    }
  }

  render() {
    return <div>
      <Editor
        value={this.state.value}
        onChange={this.onChange}
        renderMark={this.renderMark}
        plugins={plugins}
        decorateNode={this.decorateNode}
      />
      <xmp key="debug">{ JSON.stringify([this.state.value, this.state.results, this.state.val], undefined, 4) }</xmp>
    </div>;
  }
}


ReactDOM.render(<App />, document.getElementById('widget'))
