import React from 'react';
import injectSheet from 'react-jss'
import deepmerge from 'deepmerge'

export default (styleOverrides) => {

  const colour = '#DDD';

  const defaultStyles = {
    menuList: {
      listStyle: 'none',
      border: `1px solid ${colour}`,
      borderRadius: '0.5em',
      padding: 0,
    },
    menuItem: {
      padding: "1em",
      textAlign: 'center',
      cursor: 'pointer',
      '&:not(:last-child)': {
        borderBottom: `1px solid ${colour}`,
      }
    },
  }

  const styles = deepmerge(defaultStyles, styleOverrides)

  const Select = ({classes, select, values, selected, scheduleUpdate}) => {
    return <React.Fragment>
      <ul className={classes.menuList}>
        { values.map(value =>
          <li className={classes.menuItem} key={value} onClick={(e) => select(e, value)}>{value}</li>)
        }
      </ul>
    </React.Fragment>
  }

  return injectSheet(styles)(Select)
}
