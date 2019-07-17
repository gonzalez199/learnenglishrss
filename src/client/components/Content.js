import React, {Component} from "react";
import Loadable from 'react-loadable';
import LoadingComponent from "Client/LoadingComponent";
import { devices, devicesSizeNum } from "Client/devices";
import styled from 'styled-components';
import { Switch, Router, Route, Link, withRouter } from 'react-router-dom'
import history from 'Client/history'
import RssGeneratorFrame from "Components/RssGeneratorFrame"
import AddRssFrame from "Components/AddRssFrame"
import RssListFrame from "Components/RssListFrame"
const FrameStyled = styled.div`
  padding-top: 55px;
  background: gainsboro;
  min-height: 100vh;
`
const ContentInside = styled.div`
  border-radius: 4px;
  width: 100%;
  max-width: 900px;
  background: whitesmoke;
`

class Content extends Component {
  constructor(props) {
    super(props);
    this.state = {}
  }


  render(){
    return(
      <FrameStyled className="d-flex justify-content-center">
      <ContentInside className="pl-2 pr-2">
      <Switch>
      <Route exact path='/' component={RssListFrame}/>
      <Route exact path='/generator/' component={RssGeneratorFrame}/>
      <Route exact path='/share-your-rss/' component={AddRssFrame}/>
      </Switch>
      </ContentInside>
      </FrameStyled>
    );
  }
}
export default withRouter(Content);
