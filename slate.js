import React, { useState } from 'react'
import ReactDOM from 'react-dom'

import { Editor } from 'slate-react'
import { Value, Range, Selection } from 'slate'

import { Parser } from 'es-query-parser'
import Plain from 'slate-plain-serializer'

import { Manager, Reference, Popper } from 'react-popper';

import BraceCompletionPlugin from './brace-completion-plugin.js'


  // Overwriter
  // onChange = ({ value }) => {
  //   const recon = Plain.deserialize(text)
  //   const currentText = recon.document.getFirstText();
  //   const currentTextKey = currentText.key;
  //   const currentTextPath = currentText.path;
  //   const anchor = value.selection.anchor.toObject()
  //   const focus = value.selection.focus.toObject()
  //   //console.log(anchor.offset, focus.offset)
  //   console.log( value.selection.anchor.toJS())
  //   //const recon = value
  //   const newRange = Range.fromJSON({
  //     anchor: {
  //       key: currentTextKey,
  //       offset: anchor.offset,
  //     },
  //     focus: {
  //       key: currentTextKey,
  //       offset: focus.offset,
  //     }
  //   })
  //   //console.log(anchor.offset, focus.offset)
  //   const selection = Selection.fromJSON({
  //     anchor: {
  //       key: currentTextKey,
  //       offset: anchor.offset,
  //       path: currentTextPath,
  //     },
  //     focus: {
  //       key: currentTextKey,
  //       offset: focus.offset,
  //       path: currentTextPath,
  //     },
  //     isFocused: value.selection.isFocused
  //   })
  //   const d = Value.create({
  //     document: recon.document,
  //     selection
  //   })
  //   this.setState({ value: d, results })

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
                text: 'this AND that',
              },
            ],
          },
        ],
      },
    ],
  },
})


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


const action = (event, editor, mark, value) => {
  const {key, start, length} = mark.data.toJSON();
  const anchor = { key, offset: start }
  const focus = { key, offset: start + length}
  const range = { anchor, focus }
  editor.insertTextAtRange(Range.fromJSON({ anchor, focus }), value)
}

const Operator = ({children, editor, mark, ...rest}) => {
  const [show, setShow] = useState(false);

  // action(event, editor, mark)

  return <React.Fragment>
    <Manager>
      <Reference>
        {({ ref }) => (
          <div ref={ref} className='operator' {...rest} onClick={event => setShow(!show) }>
            {children}
          </div>
        )}
      </Reference>
      { show && <Popper placement="below">
        {({ ref, style, placement, arrowProps }) => (
          <div className="selecting" ref={ref} style={style} data-placement={placement}>
            <div onClick={event => {action(event, editor, mark, 'OR'); setShow(!show)}}>OR</div>
            <div onClick={event => {action(event, editor, mark, 'AND'); setShow(!show)}}>AND</div>
            <div ref={arrowProps.ref} style={arrowProps.style} />
          </div>
        )}
      </Popper> }
    </Manager>
  </React.Fragment>;
};


const plugins = [BraceCompletionPlugin()];

class App extends React.Component {
  state = {
    value: initialValue,
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
    const { children, mark, attributes } = props
    switch (mark.type) {
      case 'operator':
        return <Operator {...attributes} mark={mark} editor={editor}>{children}</Operator>
      case 'literal':
        return <i {...attributes}>{children}</i>
      default:
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
