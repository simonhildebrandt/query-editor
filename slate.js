import React from 'react'
import ReactDOM from 'react-dom'

import { Editor } from 'slate-react'
import { Value } from 'slate'

import { Parser } from 'es-query-parser'
import Plain from 'slate-plain-serializer'

import BraceCompletionPlugin from './brace-completion-plugin.js'

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


function spelunk(result) {

  const ors = []
  const build = (operator) => ors.push(operator)

  const process = (node, depth) => {
    //console.log(node)
    const { type } = node;
    switch(type) {
      case 'simple':
        process(node.value, depth + 1)
        break;
      case 'literal':
        var {value, offset} = node
        build(node)
        break;
      case 'field':
        var {field, value, offset} = node
        process(value, depth + 1)
        break;
      case 'logical':
        var {operator, children, offset} = node
        build({type: 'operator', ...operator})
        process(children[0], depth + 1)
        process(children[1], depth + 1)
        break;
      case 'quoted':
        var {value, offset} = node
        break;
      case 'bracketed':
        var {offset, value} = node
        process(value, depth + 1)
        break;
      default:
        break;
    }
  }

  process(result, 0);
  return ors;
}


const plugins = [BraceCompletionPlugin()];

class App extends React.Component {
  state = {
    value: initialValue,
  }

  onChange = ({ value }) => {
    const parser = new Parser(Plain.serialize(value))
    const results = parser.results();
    this.setState({ value, results })
  }

  decorateNode(node, editor, next) {
    const parser = new Parser(Plain.serialize(editor.value))
    const results = parser.results();
    const isValid = parser.isValid();
    if (isValid) {
      const sections = spelunk(results[0])

      const text = node.getTexts().toArray()[0]

      return sections.map(section => {
        return {
          anchor: {key: text.key, offset: section.offset},
          focus: {key: text.key, offset: section.offset + section.value.length},
          mark: {type: section.type}
        };
      })
    }
  }

  renderMark(props, editor, next) {
    const { children, mark, attributes } = props
    switch (mark.type) {
      case 'operator':
      return <strong {...attributes}>{children}</strong>
      case 'literal':
      return <i {...attributes}>{children}</i>
    }
    next()
  }

  render() {
    return <div>
      <Editor
        value={this.state.value}
        onChange={this.onChange}
        plugins={plugins}
        decorateNode={this.decorateNode}
        renderMark={this.renderMark}
      />
      <xmp key="debug">{ JSON.stringify([this.state.value, this.state.results], undefined, 4) }</xmp>
    </div>;
  }
}


ReactDOM.render(<App />, document.getElementById('widget'))
