import {isEmpty} from "Utils"
import {
  GET_RSSS, SEARCH_QUERY
} from 'Constants/actionTypes';
export default (state = {}, action) => {
  switch (action.type) {
    case SEARCH_QUERY:
    return {
      ...state,
      searchQuery: action.value
    }
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
    default:
      return state
  }
}
