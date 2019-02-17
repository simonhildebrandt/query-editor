import { is, fromJS } from 'immutable'

class QueryStructure {
  constructor(result) {
    this.structure = fromJS(this.parse(result))
  }

  changed(other) {
    return !this.same(other)
  }

  same(other) {
    if (!other) { return false }
    return is(this.structure, other.structure)
  }

  parse(node) {
    if (!node || node.length == 0) return
    switch(node[0]) {
      case 'simple':
        return 'simple'
      case 'logical':
        return ['logical', node[1], this.parse(node[2]), this.parse(node[3])]
      case 'bracketed':
        return ['bracketed', this.parse(node[1])]
      default:
        throw new Error("Don't recognise " + node)
    }
  }
}

export default QueryStructure
