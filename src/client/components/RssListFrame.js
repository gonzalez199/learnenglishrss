import React, {Component} from "react";
import styled from 'styled-components';
import {isEmpty, hashCode, rssKeyByName, getHashColorFromString} from 'Utils'
import ContentLoader from "react-content-loader"
import {Row, Col,Dropdown,DropdownButton, Button, Badge, Modal} from 'react-bootstrap'
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
import algolia from "Client/Algolia"
import {MdDescription} from 'react-icons/md';
import copy from 'copy-to-clipboard';
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
const FilterContainer = styled.div`
width: 250px;
`

class RssItem extends Component {
  constructor(props){
    super(props)
    this.state = {}
  }
  componentDidMount(){

  }

  onReportClick(){
    var rss = this.props.rss._source
  }

  onCopyClick(value){
    copy(value)
    this.setState({message: "Copied to clipboard!"})
  }
  onVoteClick(){
    var ref = db.collection('rss').doc(this.props.rss.id||this.props.rss.objectID);
    ref.update({
        vote: fb.firestore.FieldValue.increment(1)
    });
    this.setState({voted: true})
  }
  onReportClick(){
    this.setState({ showReport: true });
  }

  handleReportClose() {
   this.setState({ showReport: false});
 }

 handleSendReport(){
   const email = this.reportEmailInput.value
   const content = this.reportContentInput.value
   if(!email){
     this.setState({reportMessage: "Enter your email address"})
     return
   }

   if(!validateEmail(email)){
     this.setState({reportMessage: "Please enter a vailed email address"})
     return
   }

   if(!content){
     this.setState({reportMessage: "Enter report content"})
     return
   }
   const rssData = this.props.rss.data()
   var postData = {
   created: fb.firestore.FieldValue.serverTimestamp(),
   link: rssData.link,
   name: rssData.name,
   email: email,
   content: content,
   vote: 0
   };
   db.collection("report").doc().set(postData)
   .then(()=> {
       this.setState({reportMessage: "Reported", reported: true})
   })
   .catch((error)=> {
     this.setState({reportMessage: "Something error"})
   });


 }

  render(){
    var itemData = this.props.rss
    var rss
    if(itemData.objectID){
      rss = itemData
    }else{
      rss = itemData.data()
      rss.objectID = itemData.id
    }
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
      <RssImgStyled color={color}
       className="d-flex align-items-center justify-content-center">
      {imageView}
      </RssImgStyled>
      </div>
      <div className="pl-2 w-100 text-truncate">
      <div className="text-truncate">
      <b>{rss.name}</b>
      </div>
      <div className="text-truncate mt-1">
      <span>{rss.link}</span>
      </div>
      <div className="mt-1">
      <span>Votes: {rss.vote+(this.state.voted?1:0)}</span>
      </div>
      <div className="mt-1 mb-1">
      <Button size="sm" variant="light" disabled={this.state.voted} onClick={this.onVoteClick.bind(this, link)}>Vote up</Button>
      <Button className="ml-3" size="sm" variant="light" onClick={this.onReportClick.bind(this, link)}>Report</Button>
      <Button className="ml-3" size="sm" variant="light" onClick={this.onCopyClick.bind(this, link)}>Copy url</Button>

      <span className="ml-3 text-success">{this.state.message}</span>
      </div>
      </div>
      <Modal show={this.state.showReport} onHide={this.handleReportClose.bind(this)}>
          <Modal.Header closeButton>
            <Modal.Title>Report rss</Modal.Title>
          </Modal.Header>
          <Modal.Body>
          <div>
          <span>Your email address</span>
          <input type="email" ref={el => this.reportEmailInput=el} placeholder="email@email.com" className="form-control mb-3" />
          <span>Report content</span>
          <textarea type="text" rows="10" ref={el => this.reportContentInput=el}
          placeholder="Describe your problem" className="form-control mb-3" />
          </div>
          </Modal.Body>
          <Modal.Footer>
            <span className="text-warning">
            {this.state.reportMessage}
            </span>
            <Button variant="primary" disabled={this.state.reported} onClick={this.handleSendReport.bind(this)}>
              Send Report
            </Button>
          </Modal.Footer>
      </Modal>
      </RssItemFrameStyled>
    )
  }
}
function validateEmail(email)
{
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
}

export const RssItemConnected = connect(mapStateToPropsRssItem, mapDispatchToPropsRssItem)(RssItem)
const rssFilters = {created: "New", vote: "Most votes"}
class RsssFrame extends Component {
  constructor(props){
    super(props)
    this.state={filter: "vote"}
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

  getData(startDocumentSnapshot){
    if(this.state.apiRunning){
      return
    }
    var first
    if(startDocumentSnapshot){
      first = db.collection("rss")
          .orderBy(this.state.filter, "desc")
          .startAfter(startDocumentSnapshot)
          .limit(10);
    }else{
      first = db.collection("rss")
          .orderBy(this.state.filter, "desc")
          .limit(10);
    }

    this.setState({apiRunning: true})
    first.get().then((documentSnapshots)=>{
      this.onAgentData(documentSnapshots, !startDocumentSnapshot)
    });
  }

  nextItems(){
    if(this.props.items && this.props.items.length>0){
      this.getData(this.props.items[this.props.items.length-1])
    }
  }
  componentDidUpdate(){
    if(!this.props.items){
      this.getData()
    }
  }

  componentDidMount(){
    if(this.props.items){
      this.setRssItems(undefined, true)
    }else{
      this.getData()
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
        variant="outline-secondary"
      }
      filterItems.push(<Button className={`ml-2 mt-2 mb-2 ${selected}`} key={key} variant={variant} onClick={()=>{this.onFilterSelect(key)}}>{item}</Button>)
    })
    return filterItems
  }
  onSortIconClick(){
    this.setRssItems(undefined, true)
    this.getData()
  }

  handleSearchInputChange(){
    const value = this.searchInput.value
    if(value){
      algolia.search(value)
      .then((responses)=> {
        this.setRssItems(responses.hits, true)
      });
    }else{
      this.getData()
    }

  }

  getContent(){
    var rows = generateRssRows(this.props.items)
    var loadMoreView
    if(rows.length>0){
      if(rows.length%10===0){
        loadMoreView = <div><LoadMoreView loading={this.state.apiRunning}/>
        <Waypoint onEnter={this.nextItems.bind(this)} /></div>
      }
      return <div>
        {rows}
        <div className="mt-2">
        {loadMoreView}
        </div>
      </div>
    }else{
      return <div className="p-3">No items for this view</div>
    }

  }
  render(){
    var filterItems  = this.getFilterItems(rssFilters)
    var filter = <FilterContainer className="d-flex flex-nowrap align-items-center">
      {filterItems}
      </FilterContainer>
        return(
          <div>
            <div className="d-flex align-items-center">
            {filter}
            <input type="text" ref={el => this.searchInput=el} onChange={this.handleSearchInputChange.bind(this)} placeholder="Search" className="form-control" />
            </div>
            {this.props.items?this.getContent():<LoadingView/>}
          </div>
        )
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
