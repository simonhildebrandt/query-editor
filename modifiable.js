import React, { useState, useEffect } from 'react'
import { Manager, Reference, Popper } from 'react-popper';
import { Range } from 'slate'


const action = (event, editor, mark, value) => {
  const {key, start, length} = mark.data.toJSON();
  const anchor = { key, offset: start }
  const focus = { key, offset: start + length}
  const range = { anchor, focus }
  editor.insertTextAtRange(Range.fromJSON({ anchor, focus }), value)
}

const Select = ({select, options, selected}) => {
  return <ul>
    { options.map(option =>
      <li key={option} onClick={(e) => select(e, option)}>{option}</li>)
    }
  </ul>
}

const Modifiable = ({children, editor, mark, options, ...rest}) => {
  const [show, setShow] = useState(false);

  const act = (event, value) => {
    event.stopPropagation();
    action(event, editor, mark, value)
    setShow(!show)
  }

  const toggle = (event) => {
    event.stopPropagation();
    setShow(!show)
  }

  useEffect(() => {
    const clear = (event) => {
      setShow(false);
    }
    window.addEventListener('click', clear);
    return () => {
      window.removeEventListener('click', clear);
    }
  }, []);

  return <React.Fragment>
    <Manager>
      <Reference>
        {({ ref }) => (
          <div ref={ref} className={mark.type} {...rest} onClick={event => toggle(event) }>
            {children}
          </div>
        )}
      </Reference>
      { /* add portal here: https://github.com/FezVrasta/react-popper#usage-with-reactdomcreateportal */ }
      { show && <Popper placement="below">
        {({ ref, style, placement, arrowProps }) => (
          <div className="selecting" ref={ref} style={style} data-placement={placement}>
            <Select select={act} options={options}/>
            <div ref={arrowProps.ref} style={arrowProps.style} />
          </div>
        )}
      </Popper> }
    </Manager>
  </React.Fragment>;
};

export default Modifiable;
