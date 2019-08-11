import React, {Component} from 'react'
import { Switch, Router, Route, withRouter } from 'react-router-dom'
import { Nav, Button, Dropdown} from 'react-bootstrap';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { devices,devicesSizeNum } from "Client/devices";
import history from 'Client/history'

export const HeaderStyledContainer = styled.div`
  background-color: white;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  width: 100%;
  height: 60px;
  &:after {
    bottom: -5px;
    box-shadow: inset 0px 4px 8px -3px rgba(17, 17, 17, .06);
    content: "";
    height: 5px;
    left: 0px;
    opacity: 1;
    pointer-events: none;
    position: absolute;
    right: 0px;
    width: 100%;
    z-index: 2050;
}
`;

const mapDispatchToProps = (dispatch) => {
  return{
  }
}


class Header extends Component {

  constructor(props) {
    super(props);
    this.state = {}
  }

  componentDidMount() {
  }

  menuItem(value, path) {
    var isActive
    let match = this.props.match
    if(match){
      if((match.url=="/" && path=="/")|| (path!="/"&&match.url.includes(path))){
        isActive = true
      }
    }
    var text
    if(isActive){
      text = <b>{value}</b>
    }else{
      text = value
    }
    return (
      <Nav.Item className="d-flex flex-nowrap p-2 mr-2 pointer" onClick={()=>{history.push(path)}}>
        <span>{text}</span>
      </Nav.Item>
    );
  }

  render() {
    return (
      <HeaderStyledContainer className="d-flex align-items-center justify-content-center pl-2 pr-2">
      <Nav>
        {this.menuItem("Home", "/")}
        {this.menuItem("Share Your Rss", "share-your-rss")}
        {this.menuItem("Rss Generator", "generator")}
      </Nav>
      </HeaderStyledContainer>
    );
  }
}
const connectedHeader = connect(undefined, mapDispatchToProps)(Header)
const RenderContent = () => {
  return(
  <Switch>
  <Route path='/:frame' component={connectedHeader}/>
  <Route path='/' component={connectedHeader}/>
  </Switch>
)
};

export default withRouter(RenderContent);
