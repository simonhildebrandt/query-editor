import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'

import { Range } from 'slate'
import Popper from 'popper.js'

import injectSheet from 'react-jss'
import deepmerge from 'deepmerge'

const EVENT_PREFIX = 'eq-query-syntax-plugin:';

const farAway = {
  position: 'absolute',
  left: -9999,
};


const action = (event, editor, mark, value) => {
  const {key, start, length} = mark.data.toJSON();
  const anchor = { key, offset: start }
  const focus = { key, offset: start + length}
  const range = { anchor, focus }
  editor.insertTextAtRange(Range.fromJSON({ anchor, focus }), value)
}


export default (styleOverrides) => {

  const defaultStyles = {
    operator: {
      color: 'blue'
    },
    field: {
      color: 'red'
    },
    literal: {
      color: 'grey'
    },
    quoted: {
      color: 'green'
    }
  }

  const styles = deepmerge(defaultStyles, styleOverrides)


  const Modifiable = ({classes, Select, children, editor, mark, values, ...rest}) => {
    const [show, setShow] = useState(false);
    const targetRef = useRef(null);

    const act = (event, value) => {
      event.stopPropagation();
      action(event, editor, mark, value)
      setShow(!show)
    }

    const [position, setPosition] = useState({});
    const selectRef = useRef(null);
    useEffect(() => {
      const popper = new Popper(targetRef.current, selectRef.current, {
        placement: 'bottom',
      });
      return () => {
        popper.destroy();
      }
    }, [show])

    const drop = (event) => {
      event.stopPropagation();
      window.dispatchEvent(new Event(EVENT_PREFIX + 'other-click'));
      setShow(true)
    }

    useEffect(() => {
      const clear = (event) => {
        setShow(false);
      }
      window.addEventListener('click', clear);
      window.addEventListener(EVENT_PREFIX + 'other-click', clear);
      return () => {
        window.removeEventListener('click', clear);
        window.removeEventListener(EVENT_PREFIX + 'other-click', clear);
      }
    }, []);

    const styleClass = classes[mark.type];
    return <span ref={targetRef} className={styleClass} {...rest} onClick={event => drop(event) }>
      {children}

      { ReactDOM.createPortal(
        <div ref={selectRef} style={{visibility: show ? 'visible' : 'hidden'}}>
          <Select select={act} values={values}/>
        </div>,
        document.querySelector('#menus'))
      }
    </span>;
  };

  return injectSheet(styles)(Modifiable)
}
