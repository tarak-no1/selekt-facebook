'use strict';

// Wit.ai parameters
//const WIT_TOKEN = process.env.WIT_TOKEN;
const WIT_TOKEN = "CZJTZENICTHGLO7R5UBOHFAKY2AKVWFI";
if (!WIT_TOKEN) {
  throw new Error('missing WIT_TOKEN');
}

// Messenger API parameters
//const FB_PAGE_TOKEN = process.env.FB_PAGE_TOKEN;
const FB_PAGE_TOKEN = "EAAEtZAkA3XQUBAL5FqmPmHgZB2wHpNAzLtwSlX5WJekob52ZCGU4eLNs7vEbCp1EreISyErBAZBgPVZCuMKJmZCCQnNdTxxGhS1iaDU5niGOAwIU5kQF8Rbi94wC8f3t2PLDqIAKukkW2NRizJGmVQWAJBNTfIzSa1sauRuZBAiJCrBs0FzN2at";
var FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;
if (!FB_VERIFY_TOKEN) {
  FB_VERIFY_TOKEN = "fashion_bot_token";
}

module.exports = {
  WIT_TOKEN: WIT_TOKEN,
  FB_PAGE_TOKEN: FB_PAGE_TOKEN,
  FB_VERIFY_TOKEN: FB_VERIFY_TOKEN,
};