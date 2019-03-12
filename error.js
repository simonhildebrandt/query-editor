import React from 'react';
import injectSheet from 'react-jss'
import deepmerge from 'deepmerge'

export default (styleOverrides) => {

  const defaultStyles = {
    error: {
      // backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0), rgba(255, 255, 255, 0), rgba(255, 0, 0, 0.5), rgba(255, 0, 0, 1))'
      borderBottom: '1px solid red'
    }
  }

  const styles = deepmerge(defaultStyles, styleOverrides)

  const Error = ({classes, children, ...rest}) =>
    <span className={classes.error} {...rest}>{children}</span>


  return injectSheet(styles)(Error)
}
