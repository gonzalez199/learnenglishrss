import {isEmpty} from "Utils"
import {
  GET_RSSS, GET_RSSS_SUBSCRIBED, GET_RSSS_OWNER, RSS_FEED, CLEAR_RSSS_SUBSCRIBED, CLEAR_ALL_RSSS_CACHED, UPDATE_RSS_ITEM
} from 'Constants/actionTypes';
export default (state = {}, action) => {
  switch (action.type) {
    case GET_RSSS:
    console.log("checkongetrss", action.value)
    var popular
    if(state.popular && !action.clear){
      popular = [...state.popular, ...action.value]
    }else{
      popular = action.value
    }
    return {
      ...state,
      popular: popular
    }
    case GET_RSSS_SUBSCRIBED:
    var subscribed
    if(state.subscribed && !action.clear){
      subscribed = [...state.subscribed, ...action.value]
    }else{
      subscribed = action.value
    }
    return {
      ...state,
      subscribed: subscribed
    }
    case UPDATE_RSS_ITEM:
      return {
        ...state,
        popular: state.popular?state.popular.map((content, i) => content._id === action.value.key ? action.value : content):state.popular,
     }
    case CLEAR_ALL_RSSS_CACHED:
    return {
      ...state,
      subscribed: undefined,
      popular: undefined,
      owner: undefined
    }
    case CLEAR_RSSS_SUBSCRIBED:
    return {
      ...state,
      subscribed: undefined
    }
    case GET_RSSS_OWNER:
    return {
      ...state,
      owner: action.value
    }
    case RSS_FEED:
    return {
      ...state,
      rssFeed: action.value
    }
    default:
      return state
  }
}
