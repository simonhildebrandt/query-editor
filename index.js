import React from 'react'
import ParseResult from 'es-query-parser'


class QueryEditor extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      debug: props.debug,
      content: props.content || '',
    }
  }

  render() {
    return <div className="query-editor">{ [ this.tokenList(), this.debugOutput() ]}</div>
  }

  tokenList() {
    return <span key="raw" contentEditable="true" className="edit" onInput={(event) => this.changed(event)}></span>
  }

  changed(event) {
    this.parse(event.target.textContent)
  }

  parse(text) {
    let response = new ParseResult(text)
    this.setState({parser: response.parser})
  }

  results() {
    if (!this.state.parser || !this.state.parser.results) { return [] }
    return this.state.parser.results[0]
  }

  debugOutput() {
    if (!this.state.debug) { return }
    return <xmp key="debug">{ JSON.stringify(this.results(), undefined, 4) }</xmp>
  }
}

class QueryToken extends React.Component {
  render() {
    return <span className="token">{this.props.token}</span>
  }
}

export { QueryEditor }
