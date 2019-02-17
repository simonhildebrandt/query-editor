import React from 'react'
import ParseResult from 'es-query-parser'
import {Editor, EditorState, CompositeDecorator, SelectionState, Modifier} from 'draft-js'
import QueryStructure from './query-structure'

let types = ['simple', 'literal', 'field', 'logical', 'quoted', 'bracketed', 'leftquote', 'rightquote', 'leftbracket', 'rightbracket']

let strategy = function(contentBlock, callback, contentState) {
  let type = this.type
  let parent = this.parent
  let text = contentBlock.getText();
  let response = new ParseResult(text)
  let parser = response.parser
  let result = response.parser.results ? response.parser.results[0] : undefined

  if (result) {
    let build = (node_type, offset, value) => {
      let length = value.length
      if (node_type == type) {
        console.log(node_type, offset, length)
        callback(offset, offset + length)
      }
      return length
    }

    const process = (node) => {
      switch(node.type) {
        case 'simple':
          return process(node.value)
        case 'literal':
          var {value, offset} = node
          return build('literal', offset, value)
        case 'field':
          var {field, value, offset} = node
          if(field) {
            var width = 1 + build('field', offset, field)
          } else {
            width = 0
          }
          return width + process(value)
        case 'logical':
          var {operator, children, offset} = node
          let first = process(children[0])
          var distance = first
          let op = build('logical', offset + distance + 1, operator)
          let second = process(children[1])
          return distance + op + 1 + second + 1
        case 'quoted':
          var {value, offset} = node
          let lquote = build('leftquote', offset, "\"")
          let quote = build('quoted', offset + lquote, value)
          let rquote = build('rightquote', offset + lquote + quote, "\"")
          return lquote + quote + rquote
        case 'bracketed':
          var {offset, value} = node
          build('leftbracket', offset, '(')
          var distance = process(value) + 1
          build('rightbracket', offset + distance, ')')
          return distance + 1
        default:
      }

    }
    console.log('total', process(result, 0))
  }
  parent.setState({result})
}


class Selector extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return <div className="selector">
      { this.props.options.map((option, index) =>
        <div key={index}>{option}</div>
      ) }
    </div>
  }
}

class Token extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return <span ref={ref => this.ref = ref} className={this.props.type}>
      {this.props.children}
    </span>
  }

  options () {
    return [1, 2, 3]
  }
}

const TokenFor = (type, parent) => {
  return class extends React.Component {
    constructor(props) {
      super(props)
      this.type = type
    }

    render() {
      return <Token type={this.type} parent={parent} {...this.props}>{this.props.children}</Token>
    }
  }
}


class QueryEditor extends React.Component {

  constructor(props) {
    super(props)

    const compositeDecorator = new CompositeDecorator(
      types.map(type => ({
        strategy: strategy.bind({type: type, parent: this}),
        component: TokenFor(type, this)
      }))
    )

    this.state = {
      debug: props.debug,
      editorState: EditorState.createEmpty(), //compositeDecorator
      queryStructure: new QueryStructure(null),
      selectorSource: null,
      selector: null,
      currentText: ''
    }
    //
    // this.listener = (event) => {
    //   this.closeSelector()
    // }
  }

  componentDidMount() {
    window.addEventListener('click', this.listener)
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.listener)
  }

  onChange(editorState) {
    const currentText = editorState.getCurrentContent().getPlainText()
    const selectionState = editorState.getSelection()
    if (this.state.selectionState != selectionState) {
      console.log('moved', editorState.getLastChangeType())
    }


    if (this.state.currentText != currentText) {
      console.log('changed')
      const contentState = editorState.getCurrentContent()
      const currentContentBlock = contentState.getFirstBlock()
      const blockKey = currentContentBlock.getKey()
      const wholeArea = new SelectionState({
        anchorKey: blockKey,
        anchorOffset: 0,
        focusKey: blockKey,
        focusOffset: currentText.length
      })

      const contentStateWithEntity = contentState.createEntity(
        'LINK',
        'MUTABLE',
        {url: 'http://www.zombo.com'}
      )

      const entityKey = contentStateWithEntity.getLastCreatedEntityKey()
      const contentStateWithLink = Modifier.applyEntity(
        contentStateWithEntity,
        wholeArea,
        entityKey
      )

      editorState = EditorState.set(editorState, { currentContent: contentStateWithLink })
    }

    this.setState({editorState, currentText, selectionState})
  }
  //
  // toggleSelector(source) {
  //   if (this.state.selectorSource) {
  //     this.closeSelector()
  //   } else {
  //     this.openSelector(source)
  //   }
  // }
  //
  // openSelector(source) {
  //   this.setState({selector: <Selector options={source.options()}/>, selectorSource: source})
  // }
  //
  // closeSelector() {
  //   this.setState({selector: null, selectorSource: null})
  // }

  render() {
    return <div className="query-editor">
      <div className="editables">
        <Editor
          editorState={this.state.editorState}
          onChange={(editorState) => this.onChange(editorState)}
        />
        <div className="tools">{this.state.selector}</div>
      </div>
      { this.debugOutput() }
    </div>
  }

  parse(editorState) {
    let text = editorState.getCurrentContent().getPlainText()
    // console.log("parsing: " + text)
    let response = new ParseResult(text)
    let parser = response.parser
    let result = response.parser.results ? response.parser.results[0] : undefined
    let queryStructure = new QueryStructure(result)
    return { editorState, queryStructure, parser, result }
  }

  result() {
    return this.state.result
  }

  structure() {
    return this.state.queryStructure ? this.state.queryStructure.structure : null
  }

  debugOutput() {
    if (!this.state.debug) { return null }
    return <xmp key="debug">{ JSON.stringify([this.structure(), this.result()], undefined, 4) }</xmp>
  }
}

export { QueryEditor }
