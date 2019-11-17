import React, {Component} from "react";
import styled from 'styled-components';
import {isEmpty, hashCode, rssKeyByName, getHashColorFromString} from 'Utils'
import ContentLoader from "react-content-loader"
import {Row, Col,Dropdown,DropdownButton, Button, Badge, Modal, Accordion, Card} from 'react-bootstrap'
import { Switch, Router, Route, Link, withRouter } from 'react-router-dom'
import {GET_RSSS, UPDATE_RSS_ITEM} from 'Constants/actionTypes'
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
import { StickyContainer, Sticky } from 'react-sticky';
import axios from 'axios';
const mapStateToProps = (state) =>{
  return{
    items: state.rss.popular,
    authState: state.user.authState,
  }
}

const mapStateToPropsRssItem = (state) => {
  return{
    authState: state.user.authState
    }
}

const mapDispatchToProps = (dispatch) => {
  return{
    onRsss: (value, clear) => {
      dispatch({type:GET_RSSS, value, clear})
    }
  }
}
const mapDispatchToPropsRssItem = (dispatch) => {
  return{
    updateRss: (value) => {
      dispatch({type: UPDATE_RSS_ITEM, value})
    }
  }
}

const RssItemFrameStyled = styled.div`
  background: ${props => props.background || "transparent"};
`
const TranscriptPreview = styled.pre`
overflow-x: auto;
          white-space: pre-wrap;
          white-space: -moz-pre-wrap;
          white-space: -pre-wrap;
          white-space: -o-pre-wrap;
          word-wrap: break-word;
  background: white;
  height: 30vh;
`

const RssImgStyled = styled.div`
  border: solid 3px whitesmoke;
  background: ${props => props.color};
  img{
    object-fit: cover;
    object-position: center;
    height: 100px;
    width: 100px;
  }
  span{
    max-height: 69px;
    color: white;
    text-align: center;
  }
`
const FilterContainer = styled.div`
`
const HeaderFrame = styled.div`
  height: 7rem;
  width: 100%;
`
const SearchBox = styled.div`
  z-index: 100;
  background: white;
`
const ContentFrame = styled.div`
`
const MessagePlaceHolder = styled.div`
  height: 1.5rem;
`
function isHTML(str) {
  var a = document.createElement('div');
  a.innerHTML = str;

  for (var c = a.childNodes, i = c.length; i--; ) {
    if (c[i].nodeType == 1) return true;
  }

  return false;
}
class RssItem extends Component {
  constructor(props){
    super(props)
    this.state = {}
  }
  componentDidMount(){

  }
  onCopyTranscriptClick(transcriptId, value){
    copy(value)

    this.state.transcripts.forEach(item=>{
      if(item.id == transcriptId){
        if(!item.data.clipboarded){
          var ref = db.collection('transcripts').doc(transcriptId);
          ref.update({
              copied: fb.firestore.FieldValue.increment(1)
          });
          if(item.data.copied){
            item.data.copied++
          }else{
            item.data.copied = 1
          }

          item.data.clipboarded = true
          this.forceUpdate()
        }
      }
    })

  }
  onCopyClick(value){
    copy(value)
    if(!this.state.copied){
      var itemData = this.props.rss
      var rss = itemData.data

      var ref = db.collection('rss').doc(this.props.rss.id);
      if(rss.copied){
        ref.update({
            copied: fb.firestore.FieldValue.increment(1)
        });
      }else{
        ref.update({
            copied: 1
        });
      }
      this.state.message = "Copied to clipboard!"
      this.state.copied = true
      var clone = Object.assign({}, this.props.rss)
      clone.data.copied++
      this.props.updateRss(clone)
    }

  }
  onVoteClick(){
    var ref = db.collection('rss').doc(this.props.rss.id);
    ref.update({
        vote: fb.firestore.FieldValue.increment(1)
    });
    var clone = Object.assign({}, this.props.rss)
    if(clone.data.vote){
      clone.data.vote++
    }else{
      clone.data.vote = 1
    }

    this.props.updateRss(clone)
    this.setState({voted: true})
  }
  onReportClick(){
    this.setState({ showReport: true });
  }
  onDeleteClick(){
    if(!this.state.chainDeleteRssClick){
      this.state.chainDeleteRssClick = 1
    }else{
      this.state.chainDeleteRssClick++;
      if(this.state.chainDeleteRssClick>3){
        db.collection('rss').doc(this.props.rss.id).delete();
        this.state.message = "Deleted"
        this.forceUpdate()
      }
    }
  }
  onVoteTranscriptClick(transcriptId){
    var ref = db.collection('transcripts').doc(transcriptId);
    ref.update({
        vote: fb.firestore.FieldValue.increment(1)
    });
    this.state.transcripts.forEach(item=>{
      if(item.id == transcriptId){
        if(item.data.vote){
          item.data.vote++
        }else{
          item.data.vote = 1
        }
        item.data.voted = true
      }
    })
    this.forceUpdate()

  }
  onReportTranscriptClick(transcriptId){

  }
  onDeleteTranscriptClick(transcriptId){
    if(!this.state.chainDeleteTranscriptClick){
      this.state.chainDeleteTranscriptClick = 1
    }else{
      this.state.chainDeleteTranscriptClick++
      if(this.state.chainDeleteTranscriptClick>2){
        this.state.chainDeleteTranscriptClick = 0
        for( var i = 0; i < this.state.transcripts.length; i++){
           if ( this.state.transcripts[i].id === transcriptId) {
             db.collection('transcripts').doc(transcriptId).delete();
             this.state.transcripts.splice(i, 1);
             break
           }
        }
        var clone = Object.assign({}, this.props.rss)
        if(clone.data.transcripts){
          clone.data.transcripts--
        }
        this.props.updateRss(clone)
      }
    }
  }
onContributeTranscriptClick(){
  this.setState({showContributeTranscript: true})
}

handleContributeClose(){
  this.setState({ showContributeTranscript: false});
}
  handleReportClose() {
   this.setState({ showReport: false});
 }

onSaveTranscript(){
  const link = this.state.transcriptLink
  const description = this.transcriptDescriptionInput.value
  var postData = {
    rssId: this.props.rss.id,
    created: fb.firestore.FieldValue.serverTimestamp(),
    link: link,
    vote: 0,
    copied: 0
  };
  if(description){
    postData.description = description
  }
  var newPostRef = db.collection('transcripts');
      newPostRef.add(postData)
      .then((docRef) =>{
          const transcriptItem = {
            id: docRef.id,
            data: postData
          }
          if(this.state.transcripts){
            this.state.transcripts.push(transcriptItem)
          }
          this.transcriptLinkInput.value = ''
          this.transcriptDescriptionInput.value = ''
          this.state.isCorrectTranscriptFormat = undefined
          this.state.transcriptPreview = undefined
          var clone = Object.assign({}, this.props.rss)
          if(clone.data.transcripts){
            clone.data.transcripts++
          }else{
            clone.data.transcripts = 1
          }
          this.state.transcriptMessage= "Contribute transcript completed"
          this.props.updateRss(clone)
      })
      .catch((error)=> {
        console.error("Error adding document: ", error);
        this.setState({transcriptMessage: "Something error"})
      });
}
onCheckTranscript(){
  const link = this.transcriptLinkInput.value.trim()
  this.state.transcriptLink = link
  this.state.isCorrectTranscriptFormat = undefined
  this.state.transcriptPreview = undefined
  if(link){
    var transcriptsQuery = db.collection("transcripts")
          .where("rssId", "==", this.props.rss.id)
          .where("link", "==", link)
    transcriptsQuery.get().then((documentSnapshots)=>{
      if(documentSnapshots.docs.length>0){
        this.setState({transcriptMessage: "This transcript url already exists"})
      }else{
        const redirect = `${window.location.origin}/read-url/${link}`
        this.setState({transcriptMessage: "Checking..."})
        axios.get(redirect).then((response)=>{
            this.state.transcriptPreview = response.data
            var isCorrectTranscriptFormat = !isHTML(response.data)
            this.state.isCorrectTranscriptFormat = isCorrectTranscriptFormat
            if(isCorrectTranscriptFormat){
              this.setState({transcriptMessage: undefined})
            }else{
              this.setState({transcriptMessage: "Only enable import transcript with plain text"})
            }

        }).catch((error)=> {
          console.log(error)
          if (error.response) {
            this.setState({transcriptMessage: "Url error"})
          }
          }
        );
      }
    });


  }else{
    this.setState({transcriptMessage: "Enter transcript url"})
  }

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
   const rssData = this.props.rss.data
   var postData = {
   created: fb.firestore.FieldValue.serverTimestamp(),
   link: rssData.link,
   name: rssData.name,
   email: email,
   content: content
   };
   db.collection("report").doc().set(postData)
   .then(()=> {
       this.setState({reportMessage: "Reported", reported: true})
   })
   .catch((error)=> {
     this.setState({reportMessage: "Something error"})
   });


 }

onCheckConstantBitrateTag(){
  let rssRef = db.collection('rss').doc(this.props.rss.id);
  var clone = Object.assign({}, this.props.rss)
  clone.data.isConstantBitrate = !(this.props.rss.data.isConstantBitrate||false)
  rssRef.update({isConstantBitrate: clone.data.isConstantBitrate});
  this.props.updateRss(clone)
}

onCheckNoAdsTag(){
  let rssRef = db.collection('rss').doc(this.props.rss.id);
  var clone = Object.assign({}, this.props.rss)
  clone.data.isNoAds = !(this.props.rss.data.isNoAds||false)
  rssRef.update({isNoAds: clone.data.isNoAds});
  this.props.updateRss(clone)
}
getTranscripts(){
  var transcriptsQuery = db.collection("transcripts")
        .orderBy("created", "desc").where("rssId", "==", this.props.rss.id)
  transcriptsQuery.get().then((documentSnapshots)=>{
    var rssTranscriptItems = []
    documentSnapshots.docs.forEach( item =>{
      rssTranscriptItems.push({id: item.id, data: item.data()})
    })
    this.setState({transcripts: rssTranscriptItems})
  });
}
onToggleTranscript(){
  if(!this.state.transcripts){
    this.getTranscripts()
  }
}
  render(){
    var itemData = this.props.rss
    var rss = itemData.data
    var color = getHashColorFromString(rss.name)


    const link = rss.link
    var imageView
    if(rss.image){
      imageView = <img src={rss.image}/>
    }else{
      imageView = <span>{rss.image}</span>
    }
    var transcriptToggle
    if(rss.transcripts){
      transcriptToggle = <Accordion.Toggle as={Button}  onClick={this.onToggleTranscript.bind(this)} className="ml-md-5 ml-3" variant="link" eventKey="0">
        <span>Transcript({rss.transcripts})</span>
      </Accordion.Toggle>
    }
    var transcriptsContent;
    if(this.state.transcripts && this.state.transcripts.length>0){
      var transcriptItems = []
      var transcriptItem
      var transcriptData
      var btnDeleteTranscript
      this.state.transcripts.forEach(transcript=>{
        transcriptData = transcript.data
        if(this.props.authState){
          btnDeleteTranscript = <Button className="text-secondary" size="sm" variant="link"
           onClick={this.onDeleteTranscriptClick.bind(this, transcript.id)}>Delete</Button>

        }
        transcriptItem = <div key={transcriptItems.length}>
          <div className="d-flex flex-wrap"><span  className="mr-2 text-secondary" >{transcriptData.link}</span>
          <Button size="sm"  className="mr-2 text-secondary"  variant="link"
           onClick={this.onReportTranscriptClick.bind(this, transcript.id)}>Report</Button>
           {btnDeleteTranscript}
           </div>
           <div>{transcriptData.description}</div>
          <div><span>Copied: {transcriptData.copied||0}</span>
          <span className="ml-md-5 ml-3">Votes: {transcriptData.vote||0}</span>
          </div>

          <div className="mt-1 mb-1">
            <Button size="md" variant="outline-primary"
            onClick={this.onCopyTranscriptClick.bind(this, transcript.id, transcriptData.link)}>Copy url</Button>
            <Button className="ml-md-5 ml-3" size="md" variant="light"
            disabled={transcriptData.voted} onClick={this.onVoteTranscriptClick.bind(this, transcript.id)}>Vote up</Button>
          </div>
        </div>
        transcriptItems.push(transcriptItem)
      })
      transcriptsContent = <div>{transcriptItems}</div>
    }else{
      transcriptsContent = <div>No transcripts</div>
    }
    var footer
    if(this.state.isCorrectTranscriptFormat){
      footer = <Modal.Footer>
        <Button variant="primary" onClick={this.onSaveTranscript.bind(this)}>
          Save transcript
        </Button>
      </Modal.Footer>
    }
    var transcriptPreview
    if(this.state.transcriptPreview){
      transcriptPreview = <TranscriptPreview className="mb-3" >
      {this.state.transcriptPreview}
      </TranscriptPreview>
    }
    var btnDeleteRss
    var constantBitrateTag
    var noAdsTag
    if(this.props.authState){
      btnDeleteRss = <Button className="ml-2 text-secondary" size="sm" variant="link"
       onClick={this.onDeleteClick.bind(this, link)}>Delete</Button>
       constantBitrateTag = <label className="mb-0" className="mr-3"><div className="d-flex align-items-center ">
       <input type="checkbox" checked={rss.isConstantBitrate} onChange={()=>{this.onCheckConstantBitrateTag()}}/>
       <span className='ml-1'>Constant Bitrate</span></div></label>
       noAdsTag = <label className="mb-0" className="mr-3"><div className="d-flex align-items-center ">
       <input type="checkbox" checked={rss.isNoAds} onChange={()=>{this.onCheckNoAdsTag()}}/>
       <span className='ml-1'>No Ads</span></div></label>
    }else{
      if(rss.isConstantBitrate){
        constantBitrateTag = <Badge variant="primary" className="mr-3">Constant bitrate</Badge>
      }
      if(rss.isNoAds){
        noAdsTag = <Badge variant="primary" className="mr-3">No Ads</Badge>
      }
    }
    return(
      <RssItemFrameStyled background={this.props.background} className="pl-2 pr-2 pt-2 d-flex">
      <div>
      <RssImgStyled color={color}
       className="d-flex align-items-center justify-content-center">
      {imageView}
      </RssImgStyled>
      </div>
      <div className="pl-2 w-100 text-truncate">
      <div className="d-flex align-items-center">
      <div className="text-truncate">
      <b>{rss.name}</b>
      </div>
      <Button className="ml-2 text-secondary" size="sm" variant="link"
       onClick={this.onReportClick.bind(this, link)}>Report</Button>
      {btnDeleteRss}
      </div>
      <div className="text-truncate mt-1">
      <span>{rss.link}</span>
      </div>
      <div className="mt-1">

      <Accordion>
        <Card>
          <Card.Header>
          <span>Copied: {rss.copied}</span>
          <span className="ml-md-5 ml-3">Votes: {rss.vote}</span>
          {transcriptToggle}
          </Card.Header>
          <Accordion.Collapse eventKey="0">
            <Card.Body>
            {transcriptsContent}
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      </Accordion>
      </div>
      <div className="mt-1 mb-2">
      {constantBitrateTag}
      {noAdsTag}
      </div>
      <div className="mt-1 mb-1 d-flex flex-wrap">
      <Button size="md" variant="outline-primary"
      onClick={this.onCopyClick.bind(this, link)}>Copy url</Button>
      <Button className="ml-md-5 ml-3 mr-md-5 mr-3" size="md" variant="light"
      disabled={this.state.voted} onClick={this.onVoteClick.bind(this)}>Vote up</Button>
      <Button size="md" variant="link"
      onClick={this.onContributeTranscriptClick.bind(this, link)}>Contribute transcript</Button>
      </div>
      <MessagePlaceHolder><span className="text-success">{this.state.message}</span></MessagePlaceHolder>
      </div>

      <Modal size="lg" show={this.state.showContributeTranscript} onHide={this.handleContributeClose.bind(this)}>
          <Modal.Header closeButton>
            <Modal.Title>Contribute transcript - {rss.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
          <div>
          <div className="mb-2"><span>Transcript link</span></div>
          <input type="text" ref={el => this.transcriptLinkInput=el}
           placeholder="http://example.com/some-transcript.txt" className="form-control mb-3" />
           <div className="mb-2"><span>Description (Optional)</span></div>
           <input type="text" ref={el => this.transcriptDescriptionInput=el}
            placeholder="Description" className="form-control mb-3" />
          <div className="mb-2">
          <Button variant="primary" onClick={this.onCheckTranscript.bind(this)}>
            Check transcript
          </Button>
          <div className="mt-2">
          <span className="text-danger">{this.state.transcriptMessage}</span>
          </div>
          </div>
          {transcriptPreview}
          </div>
          </Modal.Body>
          {footer}
      </Modal>

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
const SITE_HEADER_HEIGHT = 60
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
      var rssItems = []
      if(documentSnapshots.docs.length>0){
        this.lastDocumentSnapshot = documentSnapshots.docs[documentSnapshots.docs.length-1]
      }else{
        this.lastDocumentSnapshot = undefined
      }
      documentSnapshots.docs.forEach( item =>{
        if(!this.conditionHaveTranscript || item.data().transcripts){
          rssItems.push({id: item.id, data: item.data()})
        }
      })
      this.setRssItems(rssItems, clear)
      if(this.conditionHaveTranscript){
        if(documentSnapshots.docs.length>rssItems.length){
          if(!this.props.items){
            this.nextItems()
          }else {
            if(this.props.items.length%10+rssItems.length<10){
              this.nextItems()
            }
          }
        }
      }
    }
  }

  getData(startDocumentSnapshot){
    if(this.state.apiRunning){
      return
    }
    var first = db.collection("rss")
      .orderBy(this.state.filter, "desc")

    if(startDocumentSnapshot){
      first = first.startAfter(startDocumentSnapshot)
    }
    first = first.limit(10);
    this.setState({apiRunning: true})
    first.get().then((documentSnapshots)=>{
      this.onAgentData(documentSnapshots, !startDocumentSnapshot)
    });
  }

  nextItems(){
    if(this.props.items && this.props.items.length>0){
      if(this.lastDocumentSnapshot){
        this.getData(this.lastDocumentSnapshot)
      }
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
        variant="outline-primary"
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

  generateRssRows(items){
    var rows=[]
    if(items){
      items.forEach( item =>{

          rows.push(<RssItemConnected key={rows.length} rss={item}/>);


      })
    }
    return rows
  }

  getContent(){
    var rows = this.generateRssRows(this.props.items)
    var loadMoreView
    if(this.props.items.length>0){
      if(this.lastDocumentSnapshot){
        loadMoreView = <div><Waypoint onEnter={this.nextItems.bind(this)} /><LoadMoreView loading={this.state.apiRunning}/>
        </div>
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
  onCheckHaveTranscript(){
    if(this.conditionHaveTranscript){
      this.conditionHaveTranscript = false
    }else{
      this.conditionHaveTranscript = true
    }
    this.setRssItems(undefined, true)
  }
  render(){
    var filterItems  = this.getFilterItems(rssFilters)
    var filter = <FilterContainer className="d-flex flex-nowrap align-items-center">
      {filterItems}
      <div className="ml-5">
    <label className="mb-0"><div className="d-flex align-items-center ">
    <input type="checkbox" onChange={()=>{this.onCheckHaveTranscript()}}/>
    <span className='ml-1'>Have transcript</span></div></label>
    </div>
      </FilterContainer>
        return(
          <StickyContainer className={this.props.className}>
            <HeaderFrame className="d-flex flex-wrap align-items-center">
            <div className="pt-2">
            {filter}
            </div>
            <div className="w-100">
            <Sticky relative={this.props.relative}>
            {({ style, distanceFromBottom }) => {
              let styleCopy = Object.assign({}, style)
              if(!this.props.relative){
                styleCopy.top = distanceFromBottom <= SITE_HEADER_HEIGHT ? 0 : SITE_HEADER_HEIGHT
              }
            return (
              <SearchBox className="p-2" style={styleCopy}>
                <input type="text" ref={el => this.searchInput=el}
                onChange={this.handleSearchInputChange.bind(this)} placeholder="Search" className="form-control" />
              </SearchBox>
            )
            }
            }
            </Sticky>
              </div>
            </HeaderFrame>
            <ContentFrame>
            {this.props.items?this.getContent():<LoadingView/>}
            </ContentFrame>
          </StickyContainer>
        )
  }
}

const RssImageStyled = styled.img`
  object-fit: cover;
  object-position: center;
  width: 80px;
  height: 80px;
`



export default connect(mapStateToProps, mapDispatchToProps)(RsssFrame)
