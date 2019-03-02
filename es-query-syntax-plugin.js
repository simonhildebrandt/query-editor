import React from 'react';

import Modifiable from './modifiable'
import { Parser } from 'es-query-parser'


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

export default function ESQuerySyntaxPlugin(options={}) {
  return {
    decorateNode(node, editor, next) {
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
    },

    renderMark(props, editor, next) {
      const modifiables = {
        operator: ['OR', 'AND', '&&', '||'],
        field: options.fieldTypes || [],
        literal: ['a', 'b']
      }
      const { children, mark, attributes } = props

      if (Object.keys(modifiables).includes(mark.type)) {
        return <Modifiable
          {...attributes}
          mark={mark}
          editor={editor}
          options={modifiables[mark.type]}
          >
          {children}
        </Modifiable>
      } else {
          return next();
      }
    }
  }
}
