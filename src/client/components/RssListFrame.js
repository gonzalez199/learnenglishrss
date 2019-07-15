import React, {Component} from "react";
import styled from 'styled-components';
import {isEmpty, hashCode, rssKeyByName, getHashColorFromString} from 'Utils'
import ContentLoader from "react-content-loader"
import {Row, Col,Dropdown,DropdownButton, Button, Badge} from 'react-bootstrap'
import { Switch, Router, Route, Link, withRouter } from 'react-router-dom'
import {GET_RSSS,GET_RSSS_OWNER, GET_RSSS_SUBSCRIBED, CLEAR_RSSS_SUBSCRIBED, UPDATE_RSS_ITEM} from 'Constants/actionTypes'
import { connect } from 'react-redux';
import {MdMoreVert, MdSort} from 'react-icons/md';
import { Waypoint } from 'react-waypoint'
import {fb, db} from 'Firebase'
import RSSParser from 'rss-parser'
import {ADMIN_UID} from 'Constants'
import history from 'Client/history'
import LoadingView from "Client/LoadingView";
import LoadMoreView from "Client/LoadMoreView";
import { devicesSizeNum } from "Client/devices";
const mapStateToProps = (state) =>{
  return{
    items: state.rss.popular,
  }
}

const mapStateToPropsRssItem = (state) => {
  return{
    }
}

const mapDispatchToPropsRssItem = (dispatch) => {
  return{
    }
}

const mapDispatchToProps = (dispatch) => {
  return{
    onRsss: (value, clear) => {
      dispatch({type:GET_RSSS, value, clear})
    }
  }
}

const RssItemFrameStyled = styled.div`
  background: ${props => props.background || "transparent"};
  .more-icon{
    display: block;
  }
  :hover{
    .more-icon{
      display: block;
    }
  }
`
const RssImgStyled = styled.div`
  border: solid 3px whitesmoke;
  background: ${props => props.color};
  img{
    height: 80px;
    width: 80px;
  }
  span{
    max-height: 69px;
    color: white;
    text-align: center;
  }
`

class RssItem extends Component {
  constructor(props){
    super(props)
  }
  componentDidMount(){

  }

  onReportClick(){
    var rss = this.props.rss._source
  }

  render(){
    var itemData = this.props.rss
    var rss = itemData.data()


    rss.key = itemData.id

    var color = getHashColorFromString(rss.name)


    const link = rss.link
    var imageView
    if(rss.image){
      imageView = <img src={rss.image}/>
    }else{
      imageView = <span>{rss.image}</span>
    }
    return(
      <RssItemFrameStyled background={this.props.background} className="pl-2 pr-2 pt-3 pb-3 d-flex">
      <div>
      <Link to={link}>
      <RssImgStyled color={color}
       className="d-flex align-items-center justify-content-center pointer">
      {imageView}
      </RssImgStyled>
      </Link>
      </div>
      <div className="pl-2 w-100 text-truncate">
      <div className="text-truncate">
      <Link to={link}><b>{rss.name}</b>
      </Link>
      </div>
      <div className="text-truncate mt-1">
      <a href={rss.link} className="text-info" target="_blank">{rss.link}</a>
      </div>
      </div>
      </RssItemFrameStyled>
    )
  }
}

export const RssItemConnected = connect(mapStateToPropsRssItem, mapDispatchToPropsRssItem)(RssItem)
const rssFilters = {created: "New", popular: "Voted"}
class RsssFrame extends Component {
  constructor(props){
    super(props)
    this.state={filter: "popular"}
  }

  setRssItems(items, clear){
    this.props.onRsss(items, clear)
  }
  onAgentData(documentSnapshots, clear){
    this.state.apiRunning = false
    if(documentSnapshots.docs){
      this.setRssItems(documentSnapshots.docs, clear)
    }
  }

  getData(start, filter){
    if(this.state.apiRunning){
      return
    }
    var first = db.collection("rss")
        .orderBy("created")
        .startAfter(start)
        .limit(25);
    this.setState({apiRunning: true})
    first.get().then((documentSnapshots)=>{
      this.onAgentData(documentSnapshots, start===0)
    });
  }

  nextItems(){
    if(this.props.items && this.props.items.length>0){
      this.getData(this.props.items.length)
    }
  }
  componentDidUpdate(){
    if(!this.props.items){
      this.getData(0)
    }
  }

  componentDidMount(){
    if(this.props.items){
      this.setRssItems(undefined, true)
    }else{
      this.getData(0)
    }
  }
  onFilterSelect(key){
    this.state.filter = key
    this.setRssItems(undefined, true)
  }

  getFilterItems(filters){
    var filterItems = []
    Object.keys(filters).map((key)=>{
      const item = filters[key]
      var selected
      var variant = "light"
      if(this.state.filter===key){
        selected = "selected"
        variant="outline-primary"
      }
      filterItems.push(<Button className={`ml-2 mt-2 mb-2 ${selected}`} key={key} variant={variant} onClick={()=>{this.onFilterSelect(key)}}>{item}</Button>)
    })
    return filterItems
  }
  onSortIconClick(){
    this.setRssItems(undefined, true)
    this.getData(0)
  }
  render(){
    var rows
    var filterItems  = this.getFilterItems(rssFilters)
    var filter = <div className="d-flex align-items-center">
      {filterItems}
      </div>
    if(this.props.items){
      rows = generateRssRows(this.props.items)
      var loadMoreView
      if(rows.length>0 && rows.length%10===0){
        loadMoreView = <div><LoadMoreView loading={this.state.apiRunning}/>
        <Waypoint onEnter={this.nextItems.bind(this)} /></div>
      }
      if(rows.length>0){
        return(
          <div>
          {filter}
          {rows}
          <div className="mt-2">
          {loadMoreView}
          </div>
          </div>
        )
      }else{
        return <div className="p-3">No items for this view</div>
      }
    }else{
      return <LoadingView/>
    }
  }
}

const RssImageStyled = styled.img`
  object-fit: cover;
  object-position: center;
  width: 80px;
  height: 80px;
`


function generateRssRows(items){
  var rows=[]
  if(items){
    items.forEach( item =>{
      var color
      if(rows.length%2==1){
        color= "whitesmoke"
      }
      rows.push(<RssItemConnected background={color} key={rows.length} rss={item}/>);
    })
  }
  return rows
}



export default connect(mapStateToProps, mapDispatchToProps)(RsssFrame)
