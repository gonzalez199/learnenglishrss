import algoliasearch from 'algoliasearch';

const ALGOLIA_APP_ID = '0UN6QTU73J';
const ALGOLIA_SEARCH_ONLY_API_KEY  = '610d6c7e6986b4d91f716598762e4cd3';

const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_ONLY_API_KEY, {
  protocol: 'https:'
});
const index = client.initIndex('rss');

export default index;
