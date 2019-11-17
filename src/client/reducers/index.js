import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import rss from './rssReducer'
import user from './userReducer'

export const initialState = {
  rss: {
    popular: undefined
  },
};

export const makeRootReducer = (history) => {
  return combineReducers({
    router: connectRouter(history),
    rss,
    user
  })
}
export default makeRootReducer
