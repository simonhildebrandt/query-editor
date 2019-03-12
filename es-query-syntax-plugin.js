import React from 'react';

import Modifiable from './modifiable'
import StylableSelect from './select'
import StylableError from './error'
import { Parser } from 'es-query-parser'


function spelunk(result) {
  const decs = []
  const build = (operator) => decs.push(operator)

  const process = (node, depth, currentField) => {
    const { type } = node;
    switch(type) {
      case 'simple':
        process(node.value, depth + 1)
        break;
      case 'literal':
        var {value, start} = node
        build({...node, context: currentField})
        break;
      case 'field':
        var {field, value, start} = node
        process(value, depth + 1, field)
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

const emptyArray = () => [];
const defaultOperators = () => ['OR', 'AND', '&&', '||'];

export default function ESQuerySyntaxPlugin(options={}) {

  const Select = StylableSelect(options.styles || {});
  const Error = StylableError(options.styles || {});

  return {
    decorateNode(node, editor, next) {
      const others = next() || []
      let ours = []

      const {text} = editor.value.document;

      const parser = new Parser(text, true)
      const {results, error} = parser;
      if (results.length > 0) {
        const sections = spelunk(results[0])
        const { key } = node.getFirstText()

        ours = sections.map(section => {
          const { start, type, value, context } = section;
          const length = value.length;
          const anchor = { key, offset: start }
          const focus = { key, offset: start + length}
          const range = { anchor, focus }
          // It would be nice to pass the anchors through `data`, but that causes
          // Weird doubling in the rendered document.
          return { ...range, mark: { type, data: {key, start, length, context} } };
        })

        if (error) {
          ours.push({
            anchor: { key, offset: error.offset },
            focus: { key, offset: text.length },
            mark: {type: 'error'}
          })
        }
      }

      return [...others, ...ours]
    },

    onKeyDown(event, editor, next) {
      if (event.key == 'Enter') {
        event.preventDefault();
      } else {
        return next()
      }
    },

    renderMark(props, editor, next) {
      const modifiables = {
        operator: defaultOperators,
        field: options.fieldTypes || emptyArray,
        literal: options.values || emptyArray
      }
      const { children, mark, attributes } = props

      if (Object.keys(modifiables).includes(mark.type)) {
        const values = modifiables[mark.type](mark.data.get('context'))

        return <Modifiable
          {...attributes}
          mark={mark}
          editor={editor}
          values={values}
          Select={Select}
          >
          {children}
        </Modifiable>
      } else if (mark.type == 'error') {
          return <Error {...attributes}>{children}</Error>;
      } else {
          return next();
      }
    }
  }
}
