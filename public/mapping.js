'use strict'
const broad_category_to_product_lines = {
    "footwear": ["flats", "heels", "casual shoes"],
    "bottomwear": ["jeans","skirts","shorts","trousers","capris","jeggings"],
    "topwear": ["dresses","tops","tshirts","shirts","jackets","blazers","sweaters","sweatshirts","jumpsuits"],
    "innerwear":[],
    "westernwear":["jeans","skirts","shorts","trousers","capris","jeggings","dresses","tops","tshirts","shirts","jackets","blazers","sweaters","sweatshirts","jumpsuits"],
    "ethnicwear":[],
    "accessories":["handbags"],
    "nightwear" : [],
    "indianwear" : []
};
const  product_line_to_db_keys= {
    "tops":"women_tops",
    "dresses" : "women_dresses",
    "jackets":"women_jackets",
    "jeans":"women_jeans",
    "tshirts":"women_tshirts",
    "shirts":"women_shirts",
    "sweaters":"women_sweaters",
    "shorts":"women_shorts",
    "blazers":"women_blazers",
    "capris":"women_capris",
    "kurtas":"women_kurta",
    "jeggings":"women_jeggings",
    "jumpsuits":"women_jumpsuits",
    "skirts":"women_skirts",
    "trousers":"women_trousers",
    "sweatshirts":"women_sweatshirts",
}
/*const product_line_to_db_keys =
{
    "tops":"women_tops",
    "dresses":"women_dresses",
    "kurtas":"women_kurta",
    "jeans":"women_jeans",
    "tshirts":"women_tshirts",
    "jackets":"women_jackets",
    "heels":"women_heels",
    "handbags":"women_handbags",
    "flats":"women_flats",
    "casual shoes":"women_casual_shoes",

    "trousers":"women_trousers",
    "sweatshirts":"women_sweatshirts",
    "shirts":"women_shirts",
    "shorts":"women_shorts",
    "skirts":"women_skirts",
    "sweaters":"women_sweaters",
    "capris":"women_capris",
    "blazers":"women_blazers",
    "jeggings":"women_jeggings",
    "jumpsuits":"women_jumpsuits"
};*/

module.exports = {
    broad_category_to_product_lines : broad_category_to_product_lines,
    product_line_to_db_keys : product_line_to_db_keys
};
