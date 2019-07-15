import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import rss from './rssReducer'

export const initialState = {
  rss: {
    popular: undefined
  },
};

export const makeRootReducer = (history) => {
  return combineReducers({
    router: connectRouter(history),
    rss
  })
}
export default makeRootReducer
