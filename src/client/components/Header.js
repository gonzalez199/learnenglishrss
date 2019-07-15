import React, {Component} from 'react'
import { Switch, Router, Route, withRouter } from 'react-router-dom'
import { Nav, Button, Dropdown} from 'react-bootstrap';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { devices,devicesSizeNum } from "Client/devices";
import history from 'Client/history'

export const HeaderStyledContainer = styled.div`
  background-color: lavender;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  width: 100%;
  height: 50px;
`;

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
    console.log("checkmatch", match)
    if(match){
      if(match.url.includes(path) || (match.url==="/"&&path.includes("home"))){
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
const RenderContent = () => {
  return(
  <Switch>
  <Route path='/:frame' component={Header}/>
  <Route path='/' component={Header}/>
  </Switch>
)
};

export default withRouter(RenderContent);
