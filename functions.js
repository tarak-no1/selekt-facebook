'use strict'

const Sessions = require("./public/sessions.js");
const Mapping = require("./public/mapping.js");
const Elasticsearch = require("./db_config/elasticSearch.js");
const Helper = require("./helper.js");
process.on('uncaughtException', function (error) {
    console.log(error.stack);
});

const profile_benefits =
{
    "women_kurta": {
        "Broad Shoulders": {
          "benefit": "body_neutralise_look",
          "reason": "that will soften your shoulders, thereby taking the attention away from them. We avoided well-defined sleeves"
        },
        "Large Busts": {
          "benefit": "body_proportionate_look",
          "reason": "to divert attention away from your bust. The selected ones will make your arms and neck more prominent"
        },
        "Big Arms": {
          "benefit": "body_slim_look",
          "reason": "to divert the attention away from the arms by avoiding short sleeves"
        },
        "Tummy": {
          "benefit": "body_flawless_look",
          "reason": "that will conceal your tummy area by opting for right styles"
        },
        "Small Hips": {
          "benefit": "body_shapely_look",
          "reason": "that will give you a proportionate frame by opting for proper fits and right styles."
        },
        "Big Thighs": {
          "benefit": "body_slenderize_look",
          "reason": "that will conceal your thighs. We chose longer length and flared styles to make you look slender and proportionate"
        },
        "Narrow Shoulders": {
          "benefit": "body_broader_look",
          "reason": "to create an illusion of broadening shoulders by opting for well defined sleeves"
        },
        "Small Busts": {
          "benefit": "body_curvier_look",
          "reason": "to make you look fuller by choosing the right styles."
        },
        "Wide Hips": {
          "benefit": "body_slimmer_look",
          "reason": "that will drive the attention to your top half by making the shoulders broader and hence making you look proportionate"
        },
        "Small Torso": {
          "benefit": "body_even_look",
          "reason": "that will make your torso appear elongated, making it proportionate to your legs"
        },
        "Long Torso": {
          "benefit": "body_elongated_look",
          "reason": "will create the illusion to shorten your torso and to make you look proportionate."
        },
        "18-27": {
            "benefit": "",
            "reason": ""
        },
        "28-38": {
            "benefit": "classic_trendy",
            "reason": "which are trendy keeping your comfort zone in mind. Classic style would be Apt"
        },
        "39+": {
            "benefit": "classic_graceful",
            "reason": "which are classic, graceful and encorporating the applicable trends"
        },
        "tall": {
            "benefit": "complement_height",
            "reason": "that will not make your frame look shorter but anything that will complement or elongate your frame"
        },
        "average": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance and make you look taller"
        },
        "short": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance and make you look taller"
        },
        "apple": {
            "benefit": "even_shape",
            "reason": "which divert attention from your mid section, evens out the body shape and gives a slimmer or shapey look"
        },
        "rectangle": {
            "benefit": "thinner_waist",
            "reason": "that draw attention to your waist, make it appear thinner and give  you that curvy look"
        },
        "pear": {
            "benefit": "proportionate_top",
            "reason": "that will draw attention to the upper half and highlight the waist giving a balanced shape"
        },
        "hourglass": {
            "benefit": "defining_waist",
            "reason": "that will highlight your perfect body shape by defining your waist. This will flaunt your curves"
        },
        "wheatish": {
            "benefit": "complement_wheatish",
            "reason": "that will not overpower your skin tone but will complement it"
        },
        "dark": {
            "benefit": "complement_dark",
            "reason": "that will not overpower your skin tone but will complement it"
        },
        "fair": {
            "benefit": "complement_fair",
            "reason": "that will not overpower your skin tone but will complement it"
        }
    },
    "women_casual_shoes": {
        "Thin Legs": {
          "benefit": "body_fuller_look",
          "reason": "that will create an illusion of having shapely legs by choosing the right styles."
        },
        "Short Legs": {
          "benefit": "body_elongated_look",
          "reason": "will create an illusion of elongation of legs."
        },
        "Long Legs": {
          "benefit": "body_even_look",
          "reason": "that will make your legs appear shorter, making it proportionate to your upper half"
        },
        "18-27": {
            "benefit": "",
            "reason": ""
        },
        "28-38": {
            "benefit": "",
            "reason": ""
        },
        "39+": {
            "benefit": "classic_graceful_fit",
            "reason": "which are classic, graceful and encorporating the applicable trends. Focus on good fit"
        },
        "tall": {
            "benefit": "complement_height",
            "reason": "that will not make your frame look shorter but anything that will complement or elongate your frame"
        },
        "average": {
            "benefit": "taller_appearance",
            "reason": "that will give an elongated appearance to your legs and make you look taller"
        },
        "short": {
            "benefit": "taller_appearance",
            "reason": "that will give an elongated appearance to your legs and make you look taller"
        },
        "apple": {
            "benefit": "bright_colored",
            "reason": "with detailing and bright colors that will take away the attention from mid section"
        },
        "rectangle": {
            "benefit": "curvy_appearance",
            "reason": "that are curvy looking to give a curvy appearance to your body shape"
        },
        "pear": {
            "benefit": "bright_colored",
            "reason": "with detailing and bright colors that will take away the attention from lower half"
        },
        "hourglass": {
            "benefit": "elongated_appearance",
            "reason": "that will lengthen the leg line, giving a vertical appearance. Thus highlighting the curves better"
        },
        "wheatish": {
            "benefit": "",
            "reason": ""
        },
        "dark": {
            "benefit": "",
            "reason": ""
        },
        "fair": {
            "benefit": "",
            "reason": ""
        }
    },
    "women_handbags": {
        "Large Busts": {
          "benefit": "body_proportionate_look",
          "reason": "to divert attention away from your bust. The selected ones will make your arms and neck more prominent"
        },
        "Tummy": {
          "benefit": "body_flawless_look",
          "reason": "that will divert the attention from your tummy area by opting for the right styles"
        },
        "Big Thighs": {
          "benefit": "body_slenderize_look",
          "reason": "which do not extend beyond your waist to make your lower body less prominent"
        },
        "Wide Hips": {
          "benefit": "body_slimmer_look",
          "reason": "that will divert the attention from the lower half by avoiding small sizes and right patterns"
        },
        "Short Legs": {
          "benefit": "body_elongated_look",
          "reason": "will not overpower your frame"
        },
        "Small Torso": {
          "benefit": "body_even_look",
          "reason": "that will end at your hip level, and detailed so that the attention from your torso is diverted to the bag"
        },
        "18-27": {
            "benefit": "",
            "reason": ""
        },
        "28-38": {
            "benefit": "functional_trendy",
            "reason": "which more of functional use, lot of room but trendy as well"
        },
        "39+": {
            "benefit": "functional_trendy",
            "reason": "to show functional handbags, with a lot of room but trendy as well"
        },
        "tall": {
            "benefit": "balanced_height",
            "reason": "which are unstructured, slouchy with detailing giving a balanced appearance to the tall frame"
        },
        "average": {
            "benefit": "taller_appearance",
            "reason": "that are smaller in size comparatively giving your frame a taller appearance"
        },
        "short": {
            "benefit": "taller_appearance",
            "reason": "that are smaller in size comparatively giving your frame a taller appearance"
        },
        "apple": {
            "benefit": "slimmer_look",
            "reason": "which are thin, sleek to contradict your roundness and make you look slimmer/shapely"
        },
        "rectangle": {
            "benefit": "curvy_appearance",
            "reason": "that are unstructured, slouchy with detailing giving a curvy appearance to your body shape"
        },
        "pear": {
            "benefit": "proportionate_top",
            "reason": "with detailing that ends on waist to shift focus to upper body"
        },
        "hourglass": {
            "benefit": "curvy_appearance",
            "reason": "that are unstructured, slouchy with detailing giving a curvy appearance to your body shape"
        },
        "wheatish": {
            "benefit": "",
            "reason": ""
        },
        "dark": {
            "benefit": "",
            "reason": ""
        },
        "fair": {
            "benefit": "",
            "reason": ""
        }
    },
    "women_flats": {
        "Thin Legs": {
          "benefit": "body_fuller_look",
          "reason": "that will create an illusion of having shapely legs by choosing the right styles."
        },
        "Short Legs": {
          "benefit": "body_elongated_look",
          "reason": "will create an illusion of elongation of legs."
        },
        "Long Legs": {
          "benefit": "body_even_look",
          "reason": "that will make your legs appear shorter, making it proportionate to your upper half"
        },
        "18-27": {
            "benefit": "",
            "reason": ""
        },
        "28-38": {
            "benefit": "",
            "reason": ""
        },
        "39+": {
            "benefit": "classic_graceful_fit",
            "reason": "which are classic, graceful and encorporating the applicable trends. Focus on good fit"
        },
        "tall": {
            "benefit": "complement_height",
            "reason": "that will not make your frame look shorter but anything that will complement or elongate your frame"
        },
        "average": {
            "benefit": "taller_appearance",
            "reason": "that will give an elongated appearance to your legs and make you look taller"
        },
        "short": {
            "benefit": "taller_appearance",
            "reason": "that will give an elongated appearance to your legs and make you look taller"
        },
        "apple": {
            "benefit": "bright_colored",
            "reason": "with detailing and bright colors that will take away the attention from mid section"
        },
        "rectangle": {
            "benefit": "curvy_appearance",
            "reason": "that are curvy looking to give a curvy appearance to your body shape"
        },
        "pear": {
            "benefit": "bright_colored",
            "reason": "with detailing and bright colors that will take away the attention from lower half"
        },
        "hourglass": {
            "benefit": "elongated_appearance",
            "reason": "that will lengthen the leg line, giving a vertical appearance. Thus highlighting the curves better"
        },
        "wheatish": {
            "benefit": "",
            "reason": ""
        },
        "dark": {
            "benefit": "",
            "reason": ""
        },
        "fair": {
            "benefit": "",
            "reason": ""
        }
    },
    "women_jackets": {
        "Broad Shoulders": {
          "benefit": "body_neutralise_look",
          "reason": "that will soften your shoulders, thereby taking the attention away from them. We avoided well-defined sleeves"
        },
        "Large Busts": {
          "benefit": "body_proportionate_look",
          "reason": "to divert attention away from your bust. The selected ones will make your arms and neck more prominent"
        },
        "Big Arms": {
          "benefit": "body_slim_look",
          "reason": "to divert the attention away from the arms by avoiding short sleeves"
        },
        "Tummy": {
          "benefit": "body_flawless_look",
          "reason": "that will conceal your tummy area by opting for right styles"
        },
        "Small Hips": {
          "benefit": "body_shapely_look",
          "reason": "which make you look proportionate by opting for styles which are a proper fit"
        },
        "Big Thighs": {
          "benefit": "body_slenderize_look",
          "reason": "which are longer in length, to make your thighs look slender and also to give you a proportionate frame"
        },
        "Narrow Shoulders": {
          "benefit": "body_broader_look",
          "reason": "to create an illusion of broadening shoulders by opting for well defined sleeves"
        },
        "Small Busts": {
          "benefit": "body_curvier_look",
          "reason": "to make you look fuller by choosing the right styles."
        },
        "Wide Hips": {
          "benefit": "body_slimmer_look",
          "reason": "that will drive the attention to your top half by making the shoulders broader and hence making you look proportionate"
        },
        "Small Torso": {
          "benefit": "body_even_look",
          "reason": "that will make your torso appear elongated, making it proportionate to your legs"
        },
        "Long Torso": {
          "benefit": "body_elongated_look",
          "reason": "will create the illusion to shorten your torso and to make you look proportionate."
        },
        "18-27": {
            "benefit": "",
            "reason": ""
        },
        "28-38": {
            "benefit": "classic_trendy",
            "reason": "which are trendy keeping your comfort zone in mind. Classic style would be Apt"
        },
        "39+": {
            "benefit": "classic_graceful",
            "reason": "which are classic, graceful and encorporating the applicable trends"
        },
        "tall": {
            "benefit": "complement_height",
            "reason": "that will not make your frame look shorter but anything that will complement or elongate your frame"
        },
        "average": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance and make you look taller"
        },
        "short": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance and make you look taller"
        },
        "apple": {
            "benefit": "even_shape",
            "reason": "which divert attention from your mid section, evens out the body shape and gives a slimmer or shapey look"
        },
        "rectangle": {
            "benefit": "thinner_waist",
            "reason": "that draw attention to your waist, make it appear thinner and give  you that curvy look"
        },
        "pear": {
            "benefit": "proportionate_top",
            "reason": "that will draw attention to the upper half and highlight the waist giving a balanced shape"
        },
        "hourglass": {
            "benefit": "defining_waist",
            "reason": "that will highlight your perfect body shape by defining your waist. This will flaunt your curves"
        },
        "wheatish": {
            "benefit": "complement_wheatish",
            "reason": "that will not overpower your skin tone but will complement it"
        },
        "dark": {
            "benefit": "complement_dark",
            "reason": "that will not overpower your skin tone but will complement it"
        },
        "fair": {
            "benefit": "complement_fair",
            "reason": "that will not overpower your skin tone but will complement it"
        }
    },
    "women_tops": {
        "Broad Shoulders": {
          "benefit": "body_neutralise_look",
          "reason": "that will soften your shoulders, thereby taking the attention away from them. We avoided well-defined sleeves"
        },
        "Large Busts": {
          "benefit": "body_proportionate_look",
          "reason": "to divert attention away from your bust. The selected ones will make your arms and neck more prominent"
        },
        "Big Arms": {
          "benefit": "body_slim_look",
          "reason": "to divert the attention from the arms. We opted for open necklines and avoided short sleeves"
        },
        "Tummy": {
          "benefit": "body_flawless_look",
          "reason": "that will conceal your tummy area by opting for right styles"
        },
        "Small Hips": {
          "benefit": "body_shapely_look",
          "reason": "which make you look proportionate by opting for styles which are a proper fit"
        },
        "Big Thighs": {
          "benefit": "body_slenderize_look",
          "reason": "which sit loose on your body, to make your thighs look slender and also to give you a proportionate frame"
        },
        "Narrow Shoulders": {
          "benefit": "body_broader_look",
          "reason": "to create an illusion of broadening shoulders by opting for well defined sleeves"
        },
        "Small Busts": {
          "benefit": "body_curvier_look",
          "reason": "to make you look fuller by choosing the right styles."
        },
        "Wide Hips": {
          "benefit": "body_slimmer_look",
          "reason": "that will drive the attention to your top half by making the shoulders broader and hence making you look proportionate"
        },
        "Small Torso": {
          "benefit": "body_even_look",
          "reason": "that will make your torso appear elongated, making it proportionate to your legs"
        },
        "Long Torso": {
          "benefit": "body_elongated_look",
          "reason": "will create the illusion to shorten your torso and to make you look proportionate."
        },
        "18-27": {
            "benefit": "",
            "reason": ""
        },
        "28-38": {
            "benefit": "classic_trendy",
            "reason": "which are trendy keeping your comfort zone in mind. Classic style would be Apt"
        },
        "39+": {
            "benefit": "classic_graceful",
            "reason": "which are classic, graceful and encorporating the applicable trends"
        },
        "tall": {
            "benefit": "complement_height",
            "reason": "that will not make your frame look shorter but anything that will complement or elongate your frame"
        },
        "average": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance and make you look taller"
        },
        "short": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance and make you look taller"
        },
        "apple": {
            "benefit": "even_shape",
            "reason": "which divert attention from your mid section, evens out the body shape and gives a slimmer or shapey look"
        },
        "rectangle": {
            "benefit": "thinner_waist",
            "reason": "that draw attention to your waist, make it appear thinner and give  you that curvy look"
        },
        "pear": {
            "benefit": "proportionate_top",
            "reason": "that will draw attention to the upper half and highlight the waist giving a balanced shape"
        },
        "hourglass": {
            "benefit": "defining_waist",
            "reason": "that will highlight your perfect body shape by defining your waist. This will flaunt your curves"
        },
        "wheatish": {
            "benefit": "complement_wheatish",
            "reason": "that will not overpower your skin tone but will complement it"
        },
        "dark": {
            "benefit": "complement_dark",
            "reason": "that will not overpower your skin tone but will complement it"
        },
        "fair": {
            "benefit": "complement_fair",
            "reason": "that will not overpower your skin tone but will complement it"
        }
    },
    "women_dresses": {
        "Broad Shoulders": {
          "benefit": "body_neutralise_look",
          "reason": "that will soften your shoulders, thereby taking the attention away from them. We avoided well-defined sleeves"
        },
        "Large Busts": {
          "benefit": "body_proportionate_look",
          "reason": "to divert attention away from your bust. The selected ones will make your arms and neck more prominent"
        },
        "Big Arms": {
          "benefit": "body_slim_look",
          "reason": "with patterns that create an illusion of thinner arms. Further, to divert the attention from the arms we opted for open necklines and avoided short sleeves"
        },
        "Tummy": {
          "benefit": "body_flawless_look",
          "reason": "that will conceal your tummy area by opting for right styles"
        },
        "Small Hips": {
          "benefit": "body_shapely_look",
          "reason": "that will give you a proportionate frame by opting for proper fits and right styles."
        },
        "Big Thighs": {
          "benefit": "body_slenderize_look",
          "reason": "that will conceal your thighs. We avoided tight fitting dresses and opted flare out styles to make you look slender and proportionate"
        },
        "Narrow Shoulders": {
          "benefit": "body_broader_look",
          "reason": "to create an illusion of broadening shoulders by opting for well defined sleeves"
        },
        "Small Busts": {
          "benefit": "body_curvier_look",
          "reason": "to make you look fuller by choosing the right styles."
        },
        "Wide Hips": {
          "benefit": "body_slimmer_look",
          "reason": "that will drive the attention to your top half by making the shoulders broader and hence making you look proportionate"
        },
        "Thin Legs": {
          "benefit": "body_fuller_look",
          "reason": "that will create an illusion of having shapely legs by choosing styles which add volume to lower body"
        },
        "Short Legs": {
          "benefit": "body_elongated_look",
          "reason": "will create the illusion to shorten your torso and to make you look proportionate."
        },
        "Small Torso": {
          "benefit": "body_even_look",
          "reason": "that will make your torso appear elongated, making it proportionate to your legs"
        },
        "Long Torso": {
          "benefit": "body_elongated_look",
          "reason": "will create the illusion to shorten your torso and to make you look proportionate."
        },
        "Long Legs": {
          "benefit": "body_even_look",
          "reason": "that will make your torso appear elongated, making it proportionate to your legs"
        },
        "18-27": {
            "benefit": "",
            "reason": ""
        },
        "28-38": {
            "benefit": "classic_trendy",
            "reason": "which are trendy keeping your comfort zone in mind. Classic style would be Apt"
        },
        "39+": {
            "benefit": "classic_graceful",
            "reason": "which are classic, graceful and encorporating the applicable trends"
        },
        "tall": {
            "benefit": "complement_height",
            "reason": "that will not make your frame look shorter but anything that will complement or elongate your frame"
        },
        "average": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance and make you look taller"
        },
        "short": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance and make you look taller"
        },
        "apple": {
            "benefit": "even_shape",
            "reason": "which divert attention from your mid section, evens out the body shape and gives a slimmer or shapey look"
        },
        "rectangle": {
            "benefit": "thinner_waist",
            "reason": "that draw attention to your waist, make it appear thinner and give  you that curvy look"
        },
        "pear": {
            "benefit": "proportionate_top",
            "reason": "that will draw attention to the upper half and highlight the waist giving a balanced shape"
        },
        "hourglass": {
            "benefit": "defining_waist",
            "reason": "that will highlight your perfect body shape by defining your waist. This will flaunt your curves"
        },
        "wheatish": {
            "benefit": "complement_wheatish",
            "reason": "that will not overpower your skin tone but will complement it"
        },
        "dark": {
            "benefit": "complement_dark",
            "reason": "that will not overpower your skin tone but will complement it"
        },
        "fair": {
            "benefit": "complement_fair",
            "reason": "that will not overpower your skin tone but will complement it"
        },
        "broad shoulders": {
            "benefit": "body_neutralise_look",
            "reason": "that will soften your shoulders, thereby taking the attention away from them. We avoided well-defined sleeves"
        },
        "large busts": {
            "benefit": "body_proportionate_look",
            "reason": "to divert attention away from your bust. The selected ones will make your arms and neck more prominent"
        },
        "big arms": {
            "benefit": "body_slim_look",
            "reason": "with patterns that create an illusion of thinner arms. Further, to divert the attention from the arms we opted for open necklines and avoided short sleeves"
        },
        "tummy": {
            "benefit": "body_flawless_look",
            "reason": "that will conceal your tummy area by opting for right styles"
        },
        "small hips": {
            "benefit": "body_shapely_look",
            "reason": "that will give you a proportionate frame by opting for proper fits and right styles."
        },
        "big thighs": {
            "benefit": "body_slenderize_look",
            "reason": "that will conceal your thighs. We avoided tight fitting dresses and opted flare out styles to make you look slender and proportionate"
        },
        "narrow shoulders": {
            "benefit": "body_broader_look",
            "reason": "to create an illusion of broadening shoulders by opting for well defined sleeves"
        },
        "small busts": {
            "benefit": "body_curvier_look",
            "reason": "to make you look fuller by choosing the right styles."
        },
        "wide hips": {
            "benefit": "body_slimmer_look",
            "reason": "that will drive the attention to your top half by making the shoulders broader and hence making you look proportionate"
        },
        "thin legs": {
            "benefit": "body_fuller_look",
            "reason": "that will create an illusion of having shapely legs by choosing styles which add volume to lower body"
        },
        "short legs": {
            "benefit": "body_elongated_look",
            "reason": "will create the illusion to shorten your torso and to make you look proportionate."
        },
        "small torso": {
            "benefit": "body_even_look",
            "reason": "that will make your torso appear elongated, making it proportionate to your legs"
        },
        "long torso": {
            "benefit": "body_elongated_look",
            "reason": "will create the illusion to shorten your torso and to make you look proportionate."
        },
        "long legs": {
            "benefit": "body_even_look",
            "reason": "that will make your torso appear elongated, making it proportionate to your legs"
        }
    },
    "women_jeans": {
        "Tummy": {
          "benefit": "body_flawless_look",
          "reason": "that will conceal your tummy area by opting for right styles"
        },
        "Small Hips": {
          "benefit": "body_shapely_look",
          "reason": "that will make your hips look prominent by opting the right colors and patterns"
        },
        "Big Thighs": {
          "benefit": "body_slenderize_look",
          "reason": "that will make your thighs look less prominent by opting the right colors and patterns"
        },
        "Wide Hips": {
          "benefit": "body_slimmer_look",
          "reason": "that will take away the attention from the lower body by choosing right styles"
        },
        "Thin Legs": {
          "benefit": "body_fuller_look",
          "reason": "that will create an illusion of having shapely legs by choosing styles which add volume to lower body"
        },
        "Short Legs": {
          "benefit": "body_elongated_look",
          "reason": "will create an illusion of elongation of legs."
        },
        "Long Legs": {
          "benefit": "body_even_look",
          "reason": "that will make your torso appear elongated, making it proportionate to your legs"
        },
        "18-27": {
            "benefit": "",
            "reason": ""
        },
        "28-38": {
            "benefit": "classic_trendy",
            "reason": "which are trendy keeping your comfort zone in mind. Classic style would be Apt"
        },
        "39+": {
            "benefit": "classic_graceful",
            "reason": "which are classic, graceful and encorporating the applicable trends"
        },
        "tall": {
            "benefit": "complement_height",
            "reason": "that will not make your frame look shorter but anything that will complement or elongate your frame"
        },
        "average": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance to your legs and make you look taller"
        },
        "short": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance to your legs and make you look taller"
        },
        "apple": {
            "benefit": "proportionate_legs",
            "reason": "which will make your legs look broader and hence appear proportionate with your mid section and give that shapey/Slimmer look"
        },
        "rectangle": {
            "benefit": "curvy_legs",
            "reason": "that are figure hugging, making your legs look shapy. Brings out the curves."
        },
        "pear": {
            "benefit": "slim_legs",
            "reason": "that will take away the attention from your thighs and gives you a slimmer look"
        },
        "hourglass": {
            "benefit": "waist_fitting",
            "reason": "that flares and sits perfectly at waist highlighting those perfect curves"
        },
        "wheatish": {
            "benefit": "",
            "reason": ""
        },
        "dark": {
            "benefit": "",
            "reason": ""
        },
        "fair": {
            "benefit": "",
            "reason": ""
        }
    },
    "women_tshirts": {
        "Broad Shoulders": {
          "benefit": "body_neutralise_look",
          "reason": "that will soften your shoulders, thereby taking the attention away from them. We avoided well-defined sleeves"
        },
        "Large Busts": {
          "benefit": "body_proportionate_look",
          "reason": "to divert attention away from your bust. The selected ones will make your arms and neck more prominent"
        },
        "Big Arms": {
          "benefit": "body_slim_look",
          "reason": "to divert the attention away from the arms by avoiding short sleeves"
        },
        "Tummy": {
          "benefit": "body_flawless_look",
          "reason": "that will conceal your tummy area by opting for right styles"
        },
        "Narrow Shoulders": {
          "benefit": "body_broader_look",
          "reason": "to create an illusion of broadening shoulders by opting for well defined sleeves"
        },
        "Small Busts": {
          "benefit": "body_curvier_look",
          "reason": "to make you look fuller by choosing the right styles."
        },
        "Small Torso": {
          "benefit": "body_even_look",
          "reason": "that will make your torso appear elongated, making it proportionate to your legs"
        },
        "Long Torso": {
          "benefit": "body_elongated_look",
          "reason": "will create the illusion to shorten your torso and to make you look proportionate."
        },
        "18-27": {
            "benefit": "",
            "reason": ""
        },
        "28-38": {
            "benefit": "classic_trendy",
            "reason": "which are trendy keeping your comfort zone in mind. Classic style would be Apt"
        },
        "39+": {
            "benefit": "classic_graceful",
            "reason": "which are classic, graceful and encorporating the applicable trends"
        },
        "tall": {
            "benefit": "complement_height",
            "reason": "that will not make your frame look shorter but anything that will complement or elongate your frame"
        },
        "average": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance and make you look taller"
        },
        "short": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance and make you look taller"
        },
        "apple": {
            "benefit": "even_shape",
            "reason": "which divert attention from your mid section, evens out the body shape and gives a slimmer or shapey look"
        },
        "rectangle": {
            "benefit": "thinner_waist",
            "reason": "that draw attention to your waist, make it appear thinner and give  you that curvy look"
        },
        "pear": {
            "benefit": "proportionate_top",
            "reason": "that will draw attention to the upper half and highlight the waist giving a balanced shape"
        },
        "hourglass": {
            "benefit": "tight_fitting",
            "reason": "that are tight fitting to highlight the perfect figure"
        },
        "wheatish": {
            "benefit": "complement_wheatish",
            "reason": "that will not overpower your skin tone but will complement it"
        },
        "dark": {
            "benefit": "complement_dark",
            "reason": "that will not overpower your skin tone but will complement it"
        },
        "fair": {
            "benefit": "complement_fair",
            "reason": "that will not overpower your skin tone but will complement it"
        }
    },
    "women_heels": {
        "Thin Legs": {
          "benefit": "body_fuller_look",
          "reason": "that will create an illusion of having shapely legs by choosing the right styles."
        },
        "Short Legs": {
          "benefit": "body_elongated_look",
          "reason": "will create an illusion of elongation of legs."
        },
        "Long Legs": {
          "benefit": "body_even_look",
          "reason": "that will make your legs appear shorter, making it proportionate to your upper half"
        },
        "18-27": {
            "benefit": "",
            "reason": ""
        },
        "28-38": {
            "benefit": "",
            "reason": ""
        },
        "39+": {
            "benefit": "classic_graceful_fit",
            "reason": "which are classic, graceful and encorporating the applicable trends. Focus on good fit"
        },
        "tall": {
            "benefit": "complement_height",
            "reason": "that will not make your frame look shorter but anything that will complement or elongate your frame"
        },
        "average": {
            "benefit": "taller_appearance",
            "reason": "that will give an elongated appearance to your legs and make you look taller"
        },
        "short": {
            "benefit": "taller_appearance",
            "reason": "that will give an elongated appearance to your legs and make you look taller"
        },
        "apple": {
            "benefit": "bright_colored",
            "reason": "with detailing and bright colors that will take away the attention from mid section"
        },
        "rectangle": {
            "benefit": "curvy_appearance",
            "reason": "that are curvy looking to give a curvy appearance to your body shape"
        },
        "pear": {
            "benefit": "bright_colored",
            "reason": "with detailing and bright colors that will take away the attention from lower half"
        },
        "hourglass": {
            "benefit": "elongated_appearance",
            "reason": "that will lengthen the leg line, giving a vertical appearance. Thus highlighting the curves better"
        },
        "wheatish": {
            "benefit": "",
            "reason": ""
        },
        "dark": {
            "benefit": "",
            "reason": ""
        },
        "fair": {
            "benefit": "",
            "reason": ""
        }
    },

    "women_shirts": {
        "Broad Shoulders": {
          "benefit": "body_neutralise_look",
          "reason": "that will soften your shoulders, thereby taking the attention away from them. We avoided well-defined sleeves"
        },
        "Large Busts": {
          "benefit": "body_proportionate_look",
          "reason": "to divert attention away from your bust. The selected ones will make your arms and neck more prominent"
        },
        "Big Arms": {
          "benefit": "body_slim_look",
          "reason": "with patterns that create an illusion of thinner arms. Further, to divert the attention from the arms we avoided short sleeves"
        },
        "Tummy": {
          "benefit": "body_flawless_look",
          "reason": "that will conceal your tummy area by opting for right styles"
        },
        "Small Hips": {
          "benefit": "body_shapely_look",
          "reason": "which make you look proportionate by opting for styles which are a proper fit"
        },
        "Narrow Shoulders": {
          "benefit": "body_broader_look",
          "reason": "to create an illusion of broadening shoulders by opting for well defined sleeves"
        },
        "Small Busts": {
          "benefit": "body_curvier_look",
          "reason": "to make you look fuller by choosing the right styles."
        },
        "Wide Hips": {
          "benefit": "body_slimmer_look",
          "reason": "that will drive the attention to your top half by making the shoulders broader and hence making you look proportionate"
        },
        "Small Torso": {
          "benefit": "body_even_look",
          "reason": "that will make your torso appear elongated, making it proportionate to your legs"
        },
        "Long Torso": {
          "benefit": "body_shorter_look",
          "reason": "will create the illusion to shorten your torso and to make you look proportionate."
        },
        "18-27": {
            "benefit": "",
            "reason": ""
        },
        "28-38": {
            "benefit": "classic_trendy",
            "reason": "which are trendy keeping your comfort zone in mind. Classic style would be Apt"
        },
        "39+": {
            "benefit": "classic_graceful",
            "reason": "which are classic, graceful and encorporating the applicable trends"
        },
        "tall": {
            "benefit": "complement_height",
            "reason": "that will not make your frame look shorter but anything that will complement or elongate your frame"
        },
        "average": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance and make you look taller"
        },
        "short": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance and make you look taller"
        },
        "apple": {
            "benefit": "even_shape",
            "reason": "which divert attention from your mid section, evens out the body shape and gives a slimmer or shapey look"
        },
        "rectangle": {
            "benefit": "thinner_waist",
            "reason": "that draw attention to your waist, make it appear thinner and give you that curvy look"
        },
        "pear": {
            "benefit": "proportionate_top",
            "reason": "that will draw attention to the upper half, highlight the waist and make the top half look proportionate giving a balanced shape"
        },
        "hourglass": {
            "benefit": "defining_waist",
            "reason": "that will highlight your perfect body shape by defining your waist. This will flaunt your curves"
        },
        "wheatish": {
            "benefit": "complement_wheatish",
            "reason": "that will not overpower your skin tone but will complement it"
        },
        "dark": {
            "benefit": "complement_dark",
            "reason": "that will not overpower your skin tone but will complement it"
        },
        "fair": {
            "benefit": "complement_fair",
            "reason": "that will not overpower your skin tone but will complement it"
        }
    },
    "women_skirts": {
        "Small Hips": {
          "benefit": "body_shapely_look",
          "reason": "that will make your hips look prominent by opting the right fits and patterns"
        },
        "Big Thighs": {
          "benefit": "body_slenderize_look",
          "reason": "that will conceal your thighs. We chose flared styles to make you look slender and proportionate"
        },
        "Wide Hips": {
          "benefit": "body_slimmer_look",
          "reason": "that will take away the attention from the lower body by choosing right styles"
        },
        "Thin Legs": {
          "benefit": "body_fuller_look",
          "reason": "that will create an illusion of having shapely legs by choosing styles which add volume to lower body"
        },
        "Short Legs": {
          "benefit": "body_elongated_look",
          "reason": "will create an illusion of elongation of legs."
        },
        "Small Torso": {
          "benefit": "body_even_look",
          "reason": "that will make your torso appear elongated, making it proportionate to your legs"
        },
        "Long Legs": {
          "benefit": "body_highlight_look",
          "reason": "that will make your torso appear elongated, making it proportionate to your legs"
        },
        "Long Torso": {
          "benefit": "body_shorter_look",
          "reason": "will create an illusion of elongation of legs."
        },
        "18-27": {
            "benefit": "",
            "reason": ""
        },
        "28-38": {
            "benefit": "classic_trendy",
            "reason": "which are trendy keeping your comfort zone in mind. Classic style would be Apt"
        },
        "39+": {
            "benefit": "classic_graceful",
            "reason": "which are classic, graceful and encorporating the applicable trends"
        },
        "tall": {
            "benefit": "complement_height",
            "reason": "that will not make your frame look shorter but anything that will complement or elongate your frame"
        },
        "average": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance to your legs and make you look taller"
        },
        "short": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance to your legs and make you look taller"
        },
        "apple": {
            "benefit": "proportionate_legs",
            "reason": "which will make your legs look broader and hence appear proportionate with your mid section and give that shapey/Slimmer look"
        },
        "rectangle": {
            "benefit": "curvy_legs",
            "reason": "that are figure hugging, making your legs look shapy. Brings out the curves."
        },
        "pear": {
            "benefit": "slim_legs",
            "reason": "with silhouette that will take away the attention from lower half and give a slimmer look"
        },
        "hourglass": {
            "benefit": "waist_fitting",
            "reason": "that will highlight your perfect body shape by defining your waist. This will flaunt your curves"
        },
        "wheatish": {
            "benefit": "complement_wheatish",
            "reason": "that will not overpower your skin tone but will complement it"
        },
        "dark": {
            "benefit": "complement_dark",
            "reason": "that will not overpower your skin tone but will complement it"
        },
        "fair": {
            "benefit": "complement_fair",
            "reason": "that will not overpower your skin tone but will complement it"
        }
    },
    "women_trousers": {
        "Small Hips": {
          "benefit": "body_shapely_look",
          "reason": "that will make your hips look prominent by opting the right colors and patterns"
        },
        "Big Thighs": {
          "benefit": "body_slenderize_look",
          "reason": "that will make your thighs look less prominent by opting for right colors and patterns"
        },
        "Wide Hips": {
          "benefit": "body_slimmer_look",
          "reason": "that will take away the attention from the lower body by choosing right styles"
        },
        "Thin Legs": {
          "benefit": "body_fuller_look",
          "reason": "that will create an illusion of having shapely legs by choosing styles which add volume to lower body"
        },
        "Short Legs": {
          "benefit": "body_elongated_look",
          "reason": "will create an illusion of elongation of legs."
        },
        "Small Torso": {
          "benefit": "body_even_look",
          "reason": "that will make your torso appear elongated, making it proportionate to your legs"
        },
        "Long Legs": {
          "benefit": "body_highlight_look",
          "reason": "that will make your torso appear elongated, making it proportionate to your legs"
        },
        "Long Torso": {
          "benefit": "body_shorter_look",
          "reason": "will create an illusion of elongation of legs."
        },
        "18-27": {
            "benefit": "",
            "reason": ""
        },
        "28-38": {
            "benefit": "classic_trendy",
            "reason": "which are trendy keeping your comfort zone in mind. Classic style would be Apt"
        },
        "39+": {
            "benefit": "classic_graceful",
            "reason": "which are classic, graceful and encorporating the applicable trends"
        },
        "tall": {
            "benefit": "complement_height",
            "reason": "that will not make your frame look shorter but anything that will complement or elongate your frame"
        },
        "average": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance to your legs and make you look taller"
        },
        "short": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance to your legs and make you look taller"
        },
        "apple": {
            "benefit": "proportionate_legs",
            "reason": "which will make your legs look broader and hence appear proportionate with your mid section and give that shapey/Slimmer look"
        },
        "rectangle": {
            "benefit": "curvy_legs",
            "reason": "that are figure hugging, making your legs look shapy. Brings out the curves."
        },
        "pear": {
            "benefit": "slim_legs",
            "reason": "with silhouette that will take away the attention from lower half and give a slimmer look"
        },
        "hourglass": {
            "benefit": "waist_fitting",
            "reason": "that flares and sits perfectly at waist highlighting those perfect curves"
        },
        "wheatish": {
            "benefit": "",
            "reason": ""
        },
        "dark": {
            "benefit": "",
            "reason": ""
        },
        "fair": {
            "benefit": "",
            "reason": ""
        }
    },
    "women_sweatshirts": {
        "Broad Shoulders": {
          "benefit": "body_neutralise_look",
          "reason": "that will soften your shoulders, thereby taking the attention away from them. We avoided well-defined sleeves"
        },
        "Large Busts": {
          "benefit": "body_proportionate_look",
          "reason": "to divert attention away from your bust. The selected ones will make your arms and neck more prominent"
        },
        "Big Arms": {
          "benefit": "body_slim_look",
          "reason": "with patterns that create an illusion of thinner arms. Further, to divert the attention from the arms we opted for open necklines and avoided short sleeves"
        },
        "Tummy": {
          "benefit": "body_flawless_look",
          "reason": "that will conceal your tummy area by opting for right styles"
        },
        "Small Hips": {
          "benefit": "body_shapely_look",
          "reason": "which make you look proportionate by opting for styles which are a proper fit"
        },
        "Narrow Shoulders": {
          "benefit": "body_broader_look",
          "reason": "to create an illusion of broadening shoulders by opting for well defined sleeves"
        },
        "Small Busts": {
          "benefit": "body_curvier_look",
          "reason": "to make you look fuller by choosing the right styles."
        },
        "Wide Hips": {
          "benefit": "body_slimmer_look",
          "reason": "that will drive the attention to your top half by making the shoulders broader and hence making you look proportionate"
        },
        "Small Torso": {
          "benefit": "body_even_look",
          "reason": "that will make your torso appear elongated, making it proportionate to your legs"
        },
        "Long Torso": {
          "benefit": "body_shorter_look",
          "reason": "will create the illusion to shorten your torso and to make you look proportionate."
        },
        "18-27": {
            "benefit": "",
            "reason": ""
        },
        "28-38": {
            "benefit": "classic_trendy",
            "reason": "which are trendy keeping your comfort zone in mind. Classic style would be Apt"
        },
        "39+": {
            "benefit": "classic_graceful",
            "reason": "which are classic, graceful and encorporating the applicable trends"
        },
        "tall": {
            "benefit": "complement_height",
            "reason": "that will not make your frame look shorter but anything that will complement or elongate your frame"
        },
        "average": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance and make you look taller"
        },
        "short": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance and make you look taller"
        },
        "apple": {
            "benefit": "even_shape",
            "reason": "which divert attention from your mid section, evens out the body shape and gives a slimmer or shapey look"
        },
        "rectangle": {
            "benefit": "thinner_waist",
            "reason": "that draw attention to your waist, make it appear thinner and give you that curvy look"
        },
        "pear": {
            "benefit": "proportionate_top",
            "reason": "that will draw attention to the upper half, highlight the waist and make the top half look proportionate giving a balanced shape"
        },
        "hourglass": {
            "benefit": "defining_waist",
            "reason": "that will highlight your perfect body shape by defining your waist. This will flaunt your curves"
        },
        "wheatish": {
            "benefit": "complement_wheatish",
            "reason": "that will not overpower your skin tone but will complement it"
        },
        "dark": {
            "benefit": "complement_dark",
            "reason": "that will not overpower your skin tone but will complement it"
        },
        "fair": {
            "benefit": "complement_fair",
            "reason": "that will not overpower your skin tone but will complement it"
        }
    },
    "women_sweaters": {
        "Broad Shoulders": {
          "benefit": "body_neutralise_look",
          "reason": "that will soften your shoulders, thereby taking the attention away from them. We avoided well-defined sleeves"
        },
        "Large Busts": {
          "benefit": "body_proportionate_look",
          "reason": "to divert attention away from your bust. The selected ones will make your arms and neck more prominent"
        },
        "Big Arms": {
          "benefit": "body_slim_look",
          "reason": "with patterns that create an illusion of thinner arms. Further, to divert the attention from the arms we opted for open necklines and avoided short sleeves"
        },
        "Tummy": {
          "benefit": "body_flawless_look",
          "reason": "that will conceal your tummy area by opting for right styles"
        },
        "Small Hips": {
          "benefit": "body_shapely_look",
          "reason": "which make you look proportionate by opting for styles which are a proper fit"
        },
        "Narrow Shoulders": {
          "benefit": "body_broader_look",
          "reason": "to create an illusion of broadening shoulders by opting for well defined sleeves"
        },
        "Small Busts": {
          "benefit": "body_curvier_look",
          "reason": "to make you look fuller by choosing the right styles."
        },
        "Wide Hips": {
          "benefit": "body_slimmer_look",
          "reason": "that will drive the attention to your top half by making the shoulders broader and hence making you look proportionate"
        },
        "Small Torso": {
          "benefit": "body_even_look",
          "reason": "that will make your torso appear elongated, making it proportionate to your legs"
        },
        "Long Torso": {
          "benefit": "body_shorter_look",
          "reason": "will create the illusion to shorten your torso and to make you look proportionate."
        },
        "18-27": {
            "benefit": "",
            "reason": ""
        },
        "28-38": {
            "benefit": "classic_trendy",
            "reason": "which are trendy keeping your comfort zone in mind. Classic style would be Apt"
        },
        "39+": {
            "benefit": "classic_graceful",
            "reason": "which are classic, graceful and encorporating the applicable trends"
        },
        "tall": {
            "benefit": "complement_height",
            "reason": "that will not make your frame look shorter but anything that will complement or elongate your frame"
        },
        "average": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance and make you look taller"
        },
        "short": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance and make you look taller"
        },
        "apple": {
            "benefit": "even_shape",
            "reason": "which divert attention from your mid section, evens out the body shape and gives a slimmer or shapey look"
        },
        "rectangle": {
            "benefit": "thinner_waist",
            "reason": "that draw attention to your waist, make it appear thinner and give you that curvy look"
        },
        "pear": {
            "benefit": "proportionate_top",
            "reason": "that will draw attention to the upper half, highlight the waist and make the top half look proportionate giving a balanced shape"
        },
        "hourglass": {
            "benefit": "defining_waist",
            "reason": "that will highlight your perfect body shape by defining your waist. This will flaunt your curves"
        },
        "wheatish": {
            "benefit": "complement_wheatish",
            "reason": "that will not overpower your skin tone but will complement it"
        },
        "dark": {
            "benefit": "complement_dark",
            "reason": "that will not overpower your skin tone but will complement it"
        },
        "fair": {
            "benefit": "complement_fair",
            "reason": "that will not overpower your skin tone but will complement it"
        }
    },
    "women_shorts": {
        "Small Hips": {
          "benefit": "body_shapely_look",
          "reason": "that will make your hips look prominent by opting the right colors and patterns"
        },
        "Big Thighs": {
          "benefit": "body_slenderize_look",
          "reason": "that will make your thighs look less prominent by opting for right colors and patterns"
        },
        "Wide Hips": {
          "benefit": "body_slimmer_look",
          "reason": "that will take away the attention from the lower body by choosing right styles"
        },
        "Thin Legs": {
          "benefit": "body_fuller_look",
          "reason": "that will create an illusion of having shapely legs by choosing styles which add volume to lower body"
        },
        "Short Legs": {
          "benefit": "body_elongated_look",
          "reason": "will create an illusion of elongation of legs."
        },
        "Small Torso": {
          "benefit": "body_even_look",
          "reason": "that will make your torso appear elongated, making it proportionate to your legs"
        },
        "Long Legs": {
          "benefit": "body_highlight_look",
          "reason": "that will make your torso appear elongated, making it proportionate to your legs"
        },
        "Long Torso": {
          "benefit": "body_shorter_look",
          "reason": "will create an illusion of elongation of legs."
        },
        "18-27": {
            "benefit": "",
            "reason": ""
        },
        "28-38": {
            "benefit": "classic_trendy",
            "reason": "which are trendy keeping your comfort zone in mind. Classic style would be Apt"
        },
        "39+": {
            "benefit": "classic_graceful",
            "reason": "which are classic, graceful and encorporating the applicable trends"
        },
        "tall": {
            "benefit": "complement_height",
            "reason": "that will not make your frame look shorter but anything that will complement or elongate your frame"
        },
        "average": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance to your legs and make you look taller"
        },
        "short": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance to your legs and make you look taller"
        },
        "apple": {
            "benefit": "proportionate_legs",
            "reason": "which will make your legs look broader and hence appear proportionate with your mid section and give that shapey/Slimmer look"
        },
        "rectangle": {
            "benefit": "curvy_legs",
            "reason": "that are figure hugging, making your legs look shapy. Brings out the curves."
        },
        "pear": {
            "benefit": "slim_legs",
            "reason": "with dark colors that will take away the attention from lower half and will give you a slimmer look"
        },
        "hourglass": {
            "benefit": "waist_fitting",
            "reason": "that will highlight your perfect body shape by defining your waist. This will flaunt your curves"
        },
        "wheatish": {
            "benefit": "complement_wheatish",
            "reason": "that will not overpower your skin tone but will complement it"
        },
        "dark": {
            "benefit": "complement_dark",
            "reason": "that will not overpower your skin tone but will complement it"
        },
        "fair": {
            "benefit": "complement_fair",
            "reason": "that will not overpower your skin tone but will complement it"
        }
    },
    "women_jeggings": {
        "Small Hips": {
          "benefit": "body_shapely_look",
          "reason": "that will make your hips look prominent by opting the right colors and patterns"
        },
        "Big Thighs": {
          "benefit": "body_slenderize_look",
          "reason": "that will make your thighs look less prominent by opting for right colors and patterns"
        },
        "Wide Hips": {
          "benefit": "body_slimmer_look",
          "reason": "that will take away the attention from the lower body by choosing right styles"
        },
        "Thin Legs": {
          "benefit": "body_fuller_look",
          "reason": "that will create an illusion of having shapely legs by choosing styles which add volume to lower body"
        },
        "Short Legs": {
          "benefit": "body_elongated_look",
          "reason": "will create an illusion of elongation of legs."
        },
        "Small Torso": {
          "benefit": "body_even_look",
          "reason": "that will make your torso appear elongated, making it proportionate to your legs"
        },
        "Long Legs": {
          "benefit": "body_highlight_look",
          "reason": "that will make your torso appear elongated, making it proportionate to your legs"
        },
        "Long Torso": {
          "benefit": "body_shorter_look",
          "reason": "will create an illusion of elongation of legs."
        },
        "18-27": {
            "benefit": "",
            "reason": ""
        },
        "28-38": {
            "benefit": "",
            "reason": ""
        },
        "39+": {
            "benefit": "classic_graceful",
            "reason": "which are classic, graceful and encorporating the applicable trends"
        },
        "tall": {
            "benefit": "",
            "reason": ""
        },
        "average": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance to your legs and make you look taller"
        },
        "short": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance to your legs and make you look taller"
        },
        "apple": {
            "benefit": "proportionate_legs",
            "reason": "which will make your legs look broader and hence appear proportionate with your mid section and give that shapey/Slimmer look"
        },
        "rectangle": {
            "benefit": "",
            "reason": ""
        },
        "pear": {
            "benefit": "slim_legs",
            "reason": "with dark colors that will take away the attention from lower half and will give you a slimmer look"
        },
        "hourglass": {
            "benefit": "",
            "reason": ""
        },
        "wheatish": {
            "benefit": "",
            "reason": ""
        },
        "dark": {
            "benefit": "",
            "reason": ""
        },
        "fair": {
            "benefit": "",
            "reason": ""
        }
    },
    "women_capris": {
        "Tummy": {
          "benefit": "body_flawless_look",
          "reason": "that will conceal your tummy area by opting for right styles"
        },
        "Small Hips": {
          "benefit": "body_shapely_look",
          "reason": "that will make your hips look prominent by opting the right colors and patterns"
        },
        "Big Thighs": {
          "benefit": "body_slenderize_look",
          "reason": "that will make your thighs look less prominent by opting for right colors and patterns"
        },
        "Wide Hips": {
          "benefit": "body_slimmer_look",
          "reason": "that will take away the attention from the lower body by choosing right styles"
        },
        "Thin Legs": {
          "benefit": "body_fuller_look",
          "reason": "that will create an illusion of having shapely legs by choosing styles which add volume to lower body"
        },
        "Short Legs": {
          "benefit": "body_elongated_look",
          "reason": "will create an illusion of elongation of legs."
        },
        "Small Torso": {
          "benefit": "body_even_look",
          "reason": "that will make your torso appear elongated, making it proportionate to your legs"
        },
        "Long Legs": {
          "benefit": "body_even_look",
          "reason": "that will make your torso appear elongated, making it proportionate to your legs"
        },
        "Long Torso": {
          "benefit": "body_elongated_look",
          "reason": "will create an illusion of elongation of legs."
        },
        "18-27": {
            "benefit": "",
            "reason": ""
        },
        "28-38": {
            "benefit": "classic_trendy",
            "reason": "which are trendy keeping your comfort zone in mind. Classic style would be Apt"
        },
        "39+": {
            "benefit": "classic_graceful",
            "reason": "which are classic and encorporating the applicable trends"
        },
        "tall": {
            "benefit": "complement_height",
            "reason": "that will not make your frame look shorter but anything that will complement or elongate your frame"
        },
        "average": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance to your legs and make you look taller"
        },
        "short": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance to your legs and make you look taller"
        },
        "apple": {
            "benefit": "proportionate_legs",
            "reason": "which will make your legs look broader and hence appear proportionate with your mid section and give that shapey/Slimmer look"
        },
        "rectangle": {
            "benefit": "curvy_legs",
            "reason": "that are figure hugging, making your legs look shapy. Brings out the curves."
        },
        "pear": {
            "benefit": "slim_legs",
            "reason": "with dark colors that will take away the attention from lower half and will give you a slimmer look"
        },
        "hourglass": {
            "benefit": "waist_fitting",
            "reason": "that will highlight your perfect body shape by defining your waist. This will flaunt your curves"
        },
        "wheatish": {
            "benefit": "complement_wheatish",
            "reason": "that will not overpower your skin tone but will complement it"
        },
        "dark": {
            "benefit": "complement_dark",
            "reason": "that will not overpower your skin tone but will complement it"
        },
        "fair": {
            "benefit": "complement_fair",
            "reason": "that will not overpower your skin tone but will complement it"
        }
    },
    "women_jumpsuits": {
        "Broad Shoulders": {
          "benefit": "body_neutralise_look",
          "reason": "that will soften your shoulders, thereby taking the attention away from them. We avoided well-defined sleeves"
        },
        "Large Busts": {
          "benefit": "body_proportionate_look",
          "reason": "to divert attention away from your bust. The selected ones will make your arms and neck more prominent"
        },
        "Big Arms": {
          "benefit": "body_slim_look",
          "reason": "with patterns that create an illusion of thinner arms. Further, to divert the attention from the arms we opted for open necklines and avoided short sleeves"
        },
        "Tummy": {
          "benefit": "body_flawless_look",
          "reason": "that will conceal your tummy area by opting for right styles"
        },
        "Small Hips": {
          "benefit": "body_shapely_look",
          "reason": "that will make your hips look prominent by opting the right fits and patterns"
        },
        "Big Thighs": {
          "benefit": "body_slenderize_look",
          "reason": "that will make your thighs look less prominent by opting for right colors and patterns"
        },
        "Narrow Shoulders": {
          "benefit": "body_broader_look",
          "reason": "to create an illusion of broadening shoulders by opting for well defined sleeves"
        },
        "Small Busts": {
          "benefit": "body_curvier_look",
          "reason": "to make you look fuller by choosing the right styles."
        },
        "Wide Hips": {
          "benefit": "body_slimmer_look",
          "reason": "that will take away the attention from the lower body by choosing right styles"
        },
        "Thin Legs": {
          "benefit": "body_fuller_look",
          "reason": "that will create an illusion of having shapely legs by choosing styles which add volume to lower body"
        },
        "Short Legs": {
          "benefit": "body_elongated_look",
          "reason": "will create an illusion of elongation of legs."
        },
        "Small Torso": {
          "benefit": "body_even_look",
          "reason": "that will make your torso appear elongated, making it proportionate to your legs"
        },
        "Long Legs": {
          "benefit": "body_highlight_look",
          "reason": "that will make your torso appear elongated, making it proportionate to your legs"
        },
        "Long Torso": {
          "benefit": "body_shorter_look",
          "reason": "will create an illusion of elongation of legs."
        },
        "18-27": {
            "benefit": "",
            "reason": ""
        },
        "28-38": {
            "benefit": "classic_trendy",
            "reason": "which are trendy keeping your comfort zone in mind. Classic style would be Apt"
        },
        "39+": {
            "benefit": "classic_graceful",
            "reason": "which are classic, graceful and encorporating the applicable trends"
        },
        "tall": {
            "benefit": "complement_height",
            "reason": "that will not make your frame look shorter but anything that will complement or elongate your frame"
        },
        "average": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance and make you look taller"
        },
        "short": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance and make you look taller"
        },
        "apple": {
            "benefit": "even_shape",
            "reason": "which divert attention from your mid section, evens out the body shape and gives a slimmer or shapey look"
        },
        "rectangle": {
            "benefit": "thinner_waist",
            "reason": "that draw attention to your waist, make it appear thinner and give you that curvy look"
        },
        "pear": {
            "benefit": "proportionate_top",
            "reason": "that will draw attention to the upper half, highlight the waist and make the top half look proportionate giving a balanced shape"
        },
        "hourglass": {
            "benefit": "defining_waist",
            "reason": "that will highlight your perfect body shape by defining your waist. This will flaunt your curves"
        },
        "wheatish": {
            "benefit": "complement_wheatish",
            "reason": "that will not overpower your skin tone but will complement it"
        },
        "dark": {
            "benefit": "complement_dark",
            "reason": "that will not overpower your skin tone but will complement it"
        },
        "fair": {
            "benefit": "complement_fair",
            "reason": "that will not overpower your skin tone but will complement it"
        }
    },
    "women_blazers": {
        "Broad Shoulders": {
          "benefit": "body_neutralise_look",
          "reason": "that will soften your shoulders, thereby taking the attention away from them. We avoided well-defined sleeves"
        },
        "Large Busts": {
          "benefit": "body_proportionate_look",
          "reason": "to divert attention away from your bust. The selected ones will make your arms and neck more prominent"
        },
        "Big Arms": {
          "benefit": "body_slim_look",
          "reason": "to divert the attention away from the arms by avoiding short sleeves"
        },
        "Tummy": {
          "benefit": "body_flawless_look",
          "reason": "that will conceal your tummy area by opting for right styles"
        },
        "Small Hips": {
          "benefit": "body_shapely_look",
          "reason": "which make you look proportionate by opting for styles which are a proper fit"
        },
        "Big Thighs": {
          "benefit": "body_slenderize_look",
          "reason": "which are longer in length, to make your thighs look slender and also to give you a proportionate frame"
        },
        "Narrow Shoulders": {
          "benefit": "body_broader_look",
          "reason": "to create an illusion of broadening shoulders by opting for well defined sleeves"
        },
        "Small Busts": {
          "benefit": "body_curvier_look",
          "reason": "to make you look fuller by choosing the right styles."
        },
        "Wide Hips": {
          "benefit": "body_slimmer_look",
          "reason": "that will drive the attention to your top half by making the shoulders broader and hence making you look proportionate"
        },
        "Small Torso": {
          "benefit": "body_even_look",
          "reason": "that will make your torso appear elongated, making it proportionate to your legs"
        },
        "Long Torso": {
          "benefit": "body_elongated_look",
          "reason": "will create the illusion to shorten your torso and to make you look proportionate."
        },
        "18-27": {
            "benefit": "",
            "reason": ""
        },
        "28-38": {
            "benefit": "",
            "reason": ""
        },
        "39+": {
            "benefit": "classic_graceful",
            "reason": "which are classic, graceful and encorporating the applicable trends"
        },
        "tall": {
            "benefit": "complement_height",
            "reason": "that will not make your frame look shorter but anything that will complement or elongate your frame"
        },
        "average": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance and make you look taller"
        },
        "short": {
            "benefit": "elongated_appearance",
            "reason": "that will give an elongated appearance and make you look taller"
        },
        "apple": {
            "benefit": "even_shape",
            "reason": "which divert attention from your mid section, evens out the body shape and gives a slimmer or shapey look"
        },
        "rectangle": {
            "benefit": "thinner_waist",
            "reason": "that draw attention to your waist, make it appear thinner and give you that curvy look"
        },
        "pear": {
            "benefit": "proportionate_top",
            "reason": "that will draw attention to the upper half and highlight the waist giving a balanced shape"
        },
        "hourglass": {
            "benefit": "defining_waist",
            "reason": "that will highlight your perfect body shape by defining your waist. This will flaunt your curves"
        },
        "wheatish": {
            "benefit": "complement_wheatish",
            "reason": "that will not overpower your skin tone but will complement it"
        },
        "dark": {
            "benefit": "complement_dark",
            "reason": "that will not overpower your skin tone but will complement it"
        },
        "fair": {
            "benefit": "complement_fair",
            "reason": "that will not overpower your skin tone but will complement it"
        }
    }
};
const benefit_name=
{
    "women_kurta": {
        "body_neutralise_look": "For Broad Shoulders",
        "body_proportionate_look": "For Large Busts",
        "body_slim_look": "For Big Arms",
        "body_flawless_look": "For Big Tummy",
        "body_shapely_look": "For Small Hips",
        "body_slenderize_look": "For Big Thighs",
        "body_broader_look": "For Narrow Shoulders",
        "body_curvier_look": "For Small Busts",
        "body_slimmer_look": "For Wide Hips",
        "body_even_look": "For Short Upper Body",
        "body_elongated_look": "For Long Upper Body",
        //Profile Benefit Names
        "classic_trendy": "Suits your age",
        "classic_graceful": "Suits your age",
        "complement_height": "Complements Height",
        "elongated_appearance": "Tall Look",
        "even_shape": "Slim Look",
        "thinner_waist": "Curvy Look",
        "proportionate_top": "Proportionate Shape",
        "defining_waist": "Highlights Curves",
        "complement_wheatish": "For Wheatish Skin",
        "complement_dark": "For Dark Skin",
        "complement_fair": "For Fair Skin",

        //other than benefits
        "comfortable_look": "Casual Look",
        "less_blingy_look": "For Birthday/Anniversary",
        "graceful_look": "For Wedding",
        "chic_look": "For Special Occasion",
        "dressy_look": "Casual Look",
        "trendy_look": "For Daily Wear/College",
        "professional_look": "Formal Look",
        "smart_look": "Semi-formal Look",
        "comfortable_stylish_feel": "Office Casual Look",
        "night_look": "For Night Events",
        "simple_look": "Special Occasions - Simple",
        "heavy_look": "Special Occasions - Heavy",
        "breatheable_feel": "For Hot Weather",
        "cozy_feel": "Warm",
        "day_look": "For Day Events",
        "powerful_look": "Powerful Color",
        "feminine_look": "Feminine Color",
        "bright_look": "Bright Color",
        "relaxing_look": "Relaxing Color",
        "colorful_look": "Colorful",
        "daring_look": "Bold Look",
        "conservative_look": "Modest Look",
        "intermediate_look": ""
    },
    "women_casual_shoes": {
        "body_fuller_look": "For Thin Legs",
        "body_elongated_look": "For Short Legs",
        "body_even_look": "For Long Legs",
        //profile benefits
        "classic_graceful_fit": "Suits your age",
        "complement_height": "Complements Height",
        "taller_appearance": "Tall Look",
        "bright_colored": "Slim Look",
        "curvy_appearance": "Curvy Look",
        "elongated_appearance": "Highlights Curves",
        //other than profile benfits
        "professional_look": "Semi-formal Look",
        "comfortable_stylish_feel": "Office Casual Look",
        "classy_regular_look": "Casual Look",
        "all_season_use": "Beach Wear",
        "functional_look": "Casual Look",
        "classy_delicate_look": "Party Wear",
        "blingy_look": "For Clubbing/House Party",
        "warm_feel": "For Winter",
        "colorful_look": "Colorful",
        "bright_look": "Bright Color",
        "classic_look": "Elegant Color",
        "charming_look": "Subtle Color",
        "dressy": "Dressy Look",
        "cute": "Cute Look",
        "blingy": "Simple Look"
    },
    "women_handbags": {
        "body_proportionate_look": "For Large Busts",
        "body_flawless_look": "For Big Tummy",
        "body_slenderize_look": "For Big Thighs",
        "body_slimmer_look": "For Wide Hips",
        "body_elongated_look": "For Short Legs",
        "body_even_look": "For Short Upper Body",
        //profile benefits
        "functional_trendy": "Suits your age",
        "balanced_height": "Complements Height",
        "taller_appearance": "Tall Look",
        "slimmer_look": "Slim Look",
        "curvy_appearance": "Curvy Look",
        "proportionate_top": "Proportionate Shape",

        //other than profile benefits
        "classy_regular_look": "Casual Look",
        "cool_big_look": "Casual Look",
        "experimental_look": "For Holiday Trips",
        "washable_big_use": "For Beach Use",
        "classy_minimal_look": "For College Party",
        "blingy_minimal_look": "For Clubbing/House Party",
        "detailing_look": "Party Wear",
        "professional_look": "Formal Look",
        "comfortable_stylish_feel": "Office Casual Look",
        "functional": "Roomy Bags",
        "functional_small": "Bags for Essentials",
        "aesthetic": "Good Look",
        "fuctional_aesthetic": "Functional & Good Look",
        "colorful_look": "Colorful",
        "bright_look": "Bright Color",
        "classic_look": "Elegant Color",
        "charming_look": "Subtle Color"
    },
    "women_flats": {
        "body_fuller_look": "For Thin Legs",
        "body_elongated_look": "For Short Legs",
        "body_even_look": "For Long Legs",
        //profile benefits
        "classic_graceful_fit": "Suits your age",
        "complement_height": "Complements Height",
        "taller_appearance": "Tall Look",
        "bright_colored": "Slim Look",
        "curvy_appearance": "Curvy Look",
        "elongated_appearance": "Highlights Curves",

        //other than profile benefits
        "classy_regular_look": "Casual Look",
        "functional_look": "Casual Look",
        "all_season_use": "Beach Wear",
        "classy_delicate_look": "Party Wear",
        "blingy_sturdy_look": "Party Wear",
        "detailing_look": "For Special Occasion",
        "detailing_blingy_look": "For Festival/Weddings",
        "professional_look": "Formal Look",
        "comfortable_stylish_feel": "Office Casual Look",
        "dressy": "Dressy Look",
        "cute": "Cute Look",
        "simple": "Simple Look",
        "colorful_look": "Colorful",
        "bright_look": "Bright Color",
        "classic_look": "Elegant Color",
        "charming_look": "Subtle Color"
    },
    "women_jackets": {
        "body_neutralise_look": "For Broad Shoulders",
        "body_proportionate_look": "For Large Busts",
        "body_slim_look": "For Big Arms",
        "body_flawless_look": "For Big Tummy",
        "body_shapely_look": "For Small Hips",
        "body_slenderize_look": "For Big Thighs",
        "body_broader_look": "For Narrow Shoulders",
        "body_curvier_look": "For Small Busts",
        "body_slimmer_look": "For Wide Hips",
        "body_even_look": "For Short Upper Body",
        "body_elongated_look": "For Long Upper Body",
        //profile benefits
        "classic_trendy": "Suits your age",
        "classic_graceful": "Suits your age",
        "complement_height": "Complements Height",
        "elongated_appearance": "Tall Look",
        "even_shape": "Slim Look",
        "thinner_waist": "Curvy Look",
        "proportionate_top": "Proportionate Shape",
        "defining_waist": "Highlights Curves",
        "complement_wheatish": "For Wheatish Skin",
        "complement_dark": "For Dark Skin",
        "complement_fair": "For Fair Skin",

        //other than profile benefits
        "sporty_look": "For Workout",
        "professional_look": "Semi-formal Look",
        "comfortable_stylish_feel": "Office Casual Look",
        "dressy_look": "Casual Look",
        "trendy_look": "Casual Look",
        "classy_delicate_look": "Party Wear",
        "less_blingy_look": "For Birthday/Anniversary/Date",
        "detailed_look": "Party Wear",
        "all_season_use": "",
        "cozy_feel": "For Mild Cold",
        "warm_feel": "For Moderate Cold",
        "functional_look": "For Extreme Cold",
        "wind_resistant": "For Windy Conditions",
        "water_resistant": "For Rainy Conditions",
        "lightweight_feel": "Lightweight",
        "powerful_look": "Powerful Color",
        "feminine_look": "Feminine Color",
        "bright_look": "Bright Color",
        "relaxing_look": "Relaxing Color",
        "colorful_look": "Colorful"
    },
    "women_tops": {
        "body_neutralise_look": "For Broad Shoulders",
        "body_proportionate_look": "For Large Busts",
        "body_slim_look": "For Big Arms",
        "body_flawless_look": "For Big Tummy",
        "body_shapely_look": "For Small Hips",
        "body_slenderize_look": "For Big Thighs",
        "body_broader_look": "For Narrow Shoulders",
        "body_curvier_look": "For Small Busts",
        "body_slimmer_look": "For Wide Hips",
        "body_even_look": "For Short Upper Body",
        "body_elongated_look": "For Long Upper Body",
        //profile benefits
        "classic_trendy": "Suits your age",
        "classic_graceful": "Suits your age",
        "complement_height": "Complements Height",
        "elongated_appearance": "Tall Look",
        "even_shape": "Slim Look",
        "thinner_waist": "Curvy Look",
        "proportionate_top": "Proportionate Shape",
        "defining_waist": "Highlights Curves",
        "complement_wheatish": "For Wheatish Skin",
        "complement_dark": "For Dark Skin",
        "complement_fair": "For Fair Skin",
        //other than profile benefits
        "comfortable_look": "",
        "moderately_blingy_look": "For Special Occasion",
        "graceful_look": "For Festivals",
        "professional_look": "Formal Look",
        "smart_look": "Semi-formal Look",
        "comfortable_stylish_feel": "Office Casual Look",
        "dressy_look": "Casual Look",
        "trendy_look": "Casual Look",
        "breezy_look": "For Beach/Pool Party",
        "experimental_look": "For Holiday Trips",
        "less_blingy_look": "For College Party",
        "chic_look": "Party Wear",
        "detailed_look": "For House Party",
        "blingy_look": "",
        "simple_look": "Special Occasions - Simple",
        "heavy_look": "Special Occasions - Heavy",
        "breatheable_feel": "For Hot Weather",
        "cozy_feel": "Warm",
        "day_look": "For Day Events",
        "night_look": "For Night Events",
        "powerful_look": "Powerful Color",
        "feminine_look": "Feminine Color",
        "bright_look": "Bright Color",
        "relaxing_look": "Relaxing Color",
        "colorful_look": "Colorful",
        "daring_look": "Bold Look",
        "conservative_look": "Modest Look",
        "intermediate_look": ""
    },
    "women_dresses": {
        "body_neutralise_look": "For Broad Shoulders",
        "body_proportionate_look": "For Large Busts",
        "body_slim_look": "For Big Arms",
        "body_flawless_look": "For Big Tummy",
        "body_shapely_look": "For Small Hips",
        "body_slenderize_look": "For Big Thighs",
        "body_broader_look": "For Narrow Shoulders",
        "body_curvier_look": "For Small Busts",
        "body_slimmer_look": "For Wide Hips",
        "body_fuller_look": "For Thin Legs",
        "body_elongated_look": "For Short Legs",
        "body_even_look": "For Short Upper Body",
        //profile_benefits
        "classic_trendy": "Suits your age",
        "classic_graceful": "Suits your age",
        "complement_height": "Complements Height",
        "elongated_appearance": "Tall Look",
        "even_shape": "Slim Look",
        "thinner_waist": "Curvy Look",
        "proportionate_top": "Proportionate Shape",
        "defining_waist": "Highlights Curves",
        "complement_wheatish": "For Wheatish Skin",
        "complement_dark": "For Dark Skin",
        "complement_fair": "For Fair Skin",
        //body concerns
        "body_neutralise_look": "For Broad Shoulders",
        "body_proportionate_look": "For Large Busts",
        "body_slim_look": "For Big Arms",
        "body_flawless_look": "For Tummy",
        "body_shapely_look": "For Small Hips",
        "body_slenderize_look": "For Big Thighs",
        "body_broader_look": "For Narrow Shoulders",
        "body_curvier_look": "For Small Busts",
        "body_slimmer_look": "For Wide Hips",
        "body_fuller_look": "For Thin Legs",
        "body_elongated_look": "For Short Legs",
        "body_even_look": "For Small Torso",

        //other than profile_benefits
        "breezy_look": "For Beach/Pool Party",
        "professional_look": "Formal Look",
        "smart_look": "Semi-formal Look",
        "comfortable_stylish_feel": "Office Casual Look",
        "powerful_look": "Powerful Color",
        "feminine_look": "Feminine Color",
        "bright_look": "Bright Color",
        "relaxing_look": "Relaxing Color",
        "colorful_look": "Colorful",
        "daring_look": "Bold Look",
        "conservative_look": "Modest Look",
        "intermediate_look": "",
        "breatheable_feel": "All Season Wear",
        "cozy_feel": "Warm",
        "dressy_look": "Casual Look",
        "trendy_look": "Casual Look",
        "simple_look": "Wedding - Simple",
        "heavy_look": "Wedding - Heavy",
        "night_look": "For Night Events",
        "chic_look": "Party Wear",
        "detailed_look": "Party Wear",
        "less_blingy_look": "For Birthday/Anniversary",
        "day_look": "For Day Events"
    },
    "women_jeans": {
        "body_flawless_look": "For Big Tummy",
        "body_shapely_look": "For Small Hips",
        "body_slenderize_look": "For Big Thighs",
        "body_slimmer_look": "For Wide Hips",
        "body_fuller_look": "For Thin Legs",
        "body_elongated_look": "For Short Legs",
        "body_even_look": "For Long Legs",
        //profile benefits
        "classic_trendy": "Suits your age",
        "classic_graceful": "Suits your age",
        "complement_height": "Complements Height",
        "elongated_appearance": "Tall Look",
        "proportionate_legs": "Slim Look",
        "curvy_legs": "Curvy Look",
        "slim_legs": "Proportionate Shape",
        "waist_fitting": "Highlights Curves",

        //other than profile benefits
        "comfortable_look": "Casual Look",
        "professional_look": "Semi-formal Look",
        "comfortable_stylish_feel": "Office Casual Look",
        "dressy_look": "For Birthday/Anniversary/Date",
        "chic_look": "Party Wear",
        "detailed_look": "Party Wear",
        "powerful_look": "Blacks",
        "feminine_look": "Blues",
        "relaxing_look": "Light Colored",
        "colorful_look": "Colorful",
        "daring_look": "Bold Look",
        "conservative_look": "Modest Look",
        "intermediate_look": ""
    },
    "women_tshirts": {
        "body_neutralise_look": "For Broad Shoulders",
        "body_proportionate_look": "For Large Busts",
        "body_slim_look": "For Big Arms",
        "body_flawless_look": "For Big Tummy",
        "body_broader_look": "For Narrow Shoulders",
        "body_curvier_look": "For Small Busts",
        "body_even_look": "For Short Upper Body",
        "body_elongated_look": "For Long Upper Body",
        //profile benefits
        "classic_trendy": "Suits your age",
        "classic_graceful": "Suits your age",
        "complement_height": "Complements Height",
        "elongated_appearance": "Tall Look",
        "even_shape": "Slim Look",
        "thinner_waist": "Curvy Look",
        "proportionate_top": "Proportionate Shape",
        "tight_fitting": "Highlights Curves",
        "complement_wheatish": "For Wheatish Skin",
        "complement_dark": "For Dark Skin",
        "complement_fair": "For Fair Skin",
        //other than profile benefits
        "comfortable_look": "Casual Look",
        "sporty_look": "Sports Wear",
        "professional_look": "Office Casual Look",
        "dressy_look": "Casual Look",
        "trendy_look": "For Daily Wear/College",
        "experimental_look": "For Holiday Trips",
        "loose_fit_sporty": "For Indoor Activities",
        "tight_fit_sporty": "For Outdoor Activities",
        "blingy_look": "For Indoor Events",
        "breatheable_feel": "For Hot Weather",
        "cozy_feel": "Warm",
        "day_look": "For Day Events",
        "night_look": "For Night Events",
        "daring_look": "Bold Look",
        "conservative_look": "Modest Look",
        "intermediate_look": "",
        "powerful_look": "Powerful Color",
        "feminine_look": "Feminine Color",
        "bright_look": "Bright Color",
        "relaxing_look": "Relaxing Color",
        "colorful_look": "Colorful",
        "detailed_look": "Party Wear",
        "less_blingy_look": "Party Wear"
    },
    "women_heels": {
        "body_fuller_look": "For Thin Legs",
        "body_elongated_look": "For Short Legs",
        "body_even_look": "For Long Legs",
        //profile benefits
        "classic_graceful_fit": "Suits your age",
        "complement_height": "Complements Height",
        "taller_appearance": "Tall Look",
        "bright_colored": "Slim Look",
        "curvy_appearance": "Curvy Look",
        "elongated_appearance": "Highlights Curves",

        //other than profile benefits
        "classy_regular_look": "Casual Look",
        "functional_look": "Casual Look",
        "all_season_use": "Beach Wear",
        "classy_delicate_look": "Party Wear",
        "blingy_sturdy_look": "Party Wear",
        "detailing_look": "For Special Occasion",
        "detailing_blingy_look": "For Festival/Weddings",
        "professional_look": "Formal Look",
        "comfortable_stylish_feel": "Office Casual Look",
        "dressy": "Dressy Look",
        "cute": "Cute Look",
        "simple": "Simple Look",
        "colorful_look": "Colorful",
        "bright_look": "Bright Color",
        "classic_look": "Elegant Color",
        "charming_look": "Subtle Color"
    },

    "women_shirts": {
        "body_neutralise_look": "For Broad Shoulders",
        "body_proportionate_look": "For Large Busts",
        "body_slim_look": "For Big Arms",
        "body_flawless_look": "For Big Tummy",
        "body_shapely_look": "For Small Hips",
        "body_broader_look": "For Narrow Shoulders",
        "body_curvier_look": "For Small Busts",
        "body_slimmer_look": "For Wide Hips",
        "body_even_look": "For Short Upper Body",
        "body_shorter_look": "For Long Upper Body",
        //profile benefits
        "classic_trendy": "Suits your age",
        "classic_graceful": "Suits your age",
        "complement_height": "Complements Height",
        "elongated_appearance": "Tall Look",
        "even_shape": "Slim Look",
        "thinner_waist": "Curvy Look",
        "proportionate_top": "Proportionate Shape",
        "defining_waist": "Highlights Curves",
        "complement_wheatish": "For Wheatish Skin",
        "complement_dark": "For Dark Skin",
        "complement_fair": "For Fair Skin",
        //non profile benefits
        "professional_look": "Formal Look",
        "smart_look": "Semi-formal Look",
        "comfortable_stylish_feel": "Office Casual Look",
        "detailed_look": "All Season Wear",
        "elegant_looks": "For Lunch/Brunch/Dinner/Movie",
        "trendy_look": "For Daily Wear/College",
        "experimental_look": "For Holiday Trips",
        "breezy_look": "Beach Wear",
        "stylish_looks": "Casual Look",
        "powerful_look": "Powerful Color",
        "feminine_look": "Feminine Color",
        "bright_look": "Bright Color",
        "relaxing_look": "Relaxing Color",
        "colorful_look": "Colorful",
        "daring_look": "Bold Look",
        "conservative_look": "Modest Look",
        "intermediate_look": ""
    },
    "women_skirts": {
        "body_shapely_look": "For Small Hips",
        "body_slenderize_look": "For Big Thighs",
        "body_slimmer_look": "For Wide Hips",
        "body_fuller_look": "For Thin Legs",
        "body_elongated_look": "For Short Legs",
        "body_even_look": "For Short Upper Body",
        "body_highlight_look": "For Long Legs",
        "body_shorter_look": "For Long Upper Body",
        //profile benefits
        "classic_trendy": "Suits your age",
        "classic_graceful": "Suits your age",
        "complement_height": "Complements Height",
        "elongated_appearance": "Tall Look",
        "proportionate_legs": "Slim Look",
        "curvy_legs": "Curvy Look",
        "slim_legs": "Proportionate Shape",
        "waist_fitting": "Highlights Curves",
        "complement_wheatish": "For Wheatish Skin",
        "complement_dark": "For Dark Skin",
        "complement_fair": "For Fair Skin",

        //non profile benefits
        "professional_look": "Formal Look",
        "smart_look": "For Cocktail/Office Party",
        "comfortable_stylish_feel": "Office Casual Look",
        "breatheable_feel": "For Lunch/Brunch/Dinner/Movie",
        "cozy_feel": "For Daily Wear/College",
        "beach_looks": "Beach Wear",
        "alluring_look": "For Holiday Trips",
        "beauty_looks": "For a Date",
        "elegant_look": "Casual Look",
        "clubbing_look": "For Clubbing/House Party",
        "voguish_look": "For College Party",
        "classy_look": "For Birthday/Anniversary",
        "poolparty_look": "For Pool Party",
        "sophisticated_look": "Party Look",
        "conservative_look": "Modest Look",
        "bold_looks": "Bold Look",
        "blingy_look": "For Night Events",
        "day_look": "For Day Events",
        "hot_skirt": "For Hot Weather",
        "powerful_look": "Powerful Color",
        "feminine_look": "Feminine Color",
        "bright_look": "Bright Color",
        "relaxing_look": "Relaxing Color",
        "colorful_look": "Colorful",
        "daring_look": "Bold Look",
        "intermediate_look": ""
    },
    "women_trousers": {
        "body_shapely_look": "For Small Hips",
        "body_slenderize_look": "For Big Thighs",
        "body_slimmer_look": "For Wide Hips",
        "body_fuller_look": "For Thin Legs",
        "body_elongated_look": "For Short Legs",
        "body_even_look": "For Short Upper Body",
        "body_highlight_look": "For Long Legs",
        "body_shorter_look": "For Long Upper Body",
        //profile benefits
        "classic_trendy": "Suits your age",
        "classic_graceful": "Suits your age",
        "complement_height": "Complements Height",
        "elongated_appearance": "Tall Look",
        "proportionate_legs": "Slim Look",
        "curvy_legs": "Curvy Look",
        "slim_legs": "Proportionate Shape",
        "waist_fitting": "Highlights Curves",
        //non profile benefits
        "professional_look": "Semi-formal Look",
        "comfortable_stylish_feel": "Office Casual Look",
        "beach_looks": "Beach Wear",
        "elegant_look": "For Lunch/Brunch/Dinner/Movie",
        "trendy_look": "For Daily Wear/College",
        "experimental_look": "For Holiday Trips",
        "sophisticated_look": "Casual Look",
        "chic_look": "For Office Party",
        "voguish_look": "For College Party",
        "classy_look": "For Birthday/Anniversary",
        "party_look": "Party Look",
        "alluring_look": "For Night Events",
        "day_look": "For Day Events",
        "breathable_feel": "For Hot Weather",
        "warm_looks": "Warm",
        "powerful_look": "Powerful Color",
        "feminine_look": "Feminine Color",
        "bright_look": "Bright Color",
        "relaxing_look": "Relaxing Color",
        "colorful_look": "Colorful"
    },
    "women_shorts": {
        "body_shapely_look": "For Small Hips",
        "body_slenderize_look": "For Big Thighs",
        "body_slimmer_look": "For Wide Hips",
        "body_fuller_look": "For Thin Legs",
        "body_elongated_look": "For Short Legs",
        "body_even_look": "For Short Upper Body",
        "body_highlight_look": "For Long Legs",
        "body_shorter_look": "For Long Upper Body",
        //profile benefits
        "classic_trendy": "Suits your age",
        "classic_graceful": "Suits your age",
        "complement_height": "Complements Height",
        "elongated_appearance": "Tall Look",
        "proportionate_legs": "Slim Look",
        "curvy_legs": "Curvy Look",
        "slim_legs": "Proportionate Shape",
        "waist_fitting": "Highlights Curves",
        "complement_wheatish": "For Wheatish Skin",
        "complement_dark": "For Dark Skin",
        "complement_fair": "For Fair Skin",
        //non profile benefits
        "sporty_looks": "Sports Wear",
        "beach_looks": "Beach Wear",
        "elegant_look": "For Lunch/Brunch/Dinner/Movie",
        "trendy_look": "For Daily Wear/College",
        "experimental_look": "For Holiday Trips",
        "sophisticated_look": "Casual Look",
        "poolparty_look": "For Pool Party",
        "clubbing_look": "For Clubbing/House Party",
        "voguish_look": "For College Party",
        "party_look": "Party Look",
        "alluring_look": "For Night Events",
        "day_look": "For Day Events",
        "powerful_look": "Powerful Color",
        "feminine_look": "Feminine Color",
        "bright_look": "Bright Color",
        "relaxing_look": "Relaxing Color",
        "colorful_look": "Colorful",
        "daring_look": "Bold Look",
        "intermediate_look": "Moderately Bold"
    },
    "women_sweatshirts": {
        "body_neutralise_look": "For Broad Shoulders",
        "body_proportionate_look": "For Large Busts",
        "body_slim_look": "For Big Arms",
        "body_flawless_look": "For Big Tummy",
        "body_shapely_look": "For Small Hips",
        "body_broader_look": "For Narrow Shoulders",
        "body_curvier_look": "For Small Busts",
        "body_slimmer_look": "For Wide Hips",
        "body_even_look": "For Short Upper Body",
        "body_shorter_look": "For Long Upper Body",
        //profile benefits
        "classic_trendy": "Suits your age",
        "classic_graceful": "Suits your age",
        "complement_height": "Complements Height",
        "elongated_appearance": "Tall Look",
        "even_shape": "Slim Look",
        "thinner_waist": "Curvy Look",
        "proportionate_top": "Proportionate Shape",
        "defining_waist": "Highlights Curves",
        "complement_wheatish": "For Wheatish Skin",
        "complement_dark": "For Dark Skin",
        "complement_fair": "For Fair Skin",
        //non profile benefits
        "active_look": "Active/Sports Wear",
        "trendy_look": "Daily Wear",
        "voguish_look": "College wear",
        "classy_look": "For Lunch/Brunch/Movie",
        "elegant_look": "Casual Look",
        "powerful_look": "Powerful Color",
        "feminine_look": "Feminine Color",
        "bright_look": "Bright Color",
        "relaxing_look": "Relaxing Color",
        "colorful_look": "Colorful",
        "daring_look": "Bold Look",
        "conservative_look": "Modest Look"
    },
    "women sweaters": {
        "body_neutralise_look": "For Broad Shoulders",
        "body_proportionate_look": "For Large Busts",
        "body_slim_look": "For Big Arms",
        "body_flawless_look": "For Big Tummy",
        "body_shapely_look": "For Small Hips",
        "body_broader_look": "For Narrow Shoulders",
        "body_curvier_look": "For Small Busts",
        "body_slimmer_look": "For Wide Hips",
        "body_even_look": "For Short Upper Body",
        "body_shorter_look": "For Long Upper Body",
        //profile benefits
        "classic_trendy": "Suits your age",
        "classic_graceful": "Suits your age",
        "complement_height": "Complements Height",
        "elongated_appearance": "Tall Look",
        "even_shape": "Slim Look",
        "thinner_waist": "Curvy Look",
        "proportionate_top": "Proportionate Shape",
        "defining_waist": "Highlights Curves",
        "complement_wheatish": "For Wheatish Skin",
        "complement_dark": "For Dark Skin",
        "complement_fair": "For Fair Skin",
        //non profile benefits
        "comfortable_stylish_feel": "Office Wear",
        "trendy_look": "Daily Casual",
        "voguish_look": "College wear",
        "classy_look": "Casual Look",
        "cozy_feel": "For Holiday Trips",
        "dressy_look": "For Special Events",
        "powerful_look": "Powerful Color",
        "feminine_look": "Feminine Color",
        "bright_look": "Bright Color",
        "relaxing_look": "Relaxing Color",
        "colorful_look": "Colorful",
    },
    "women_capris": {
        "body_flawless_look": "For Big Tummy",
        "body_shapely_look": "For Small Hips",
        "body_slenderize_look": "For Big Thighs",
        "body_slimmer_look": "For Wide Hips",
        "body_fuller_look": "For Thin Legs",
        "body_elongated_look": "For Short Legs",
        "body_even_look": "For Short Upper Body",
        //profile benefits
        "classic_trendy": "Suits your age",
        "classic_graceful": "Suits your age",
        "complement_height": "Complements Height",
        "elongated_appearance": "Tall Look",
        "proportionate_legs": "Slim Look",
        "curvy_legs": "Curvy Look",
        "slim_legs": "Proportionate Shape",
        "waist_fitting": "Highlights Curves",
        "complement_wheatish": "For Wheatish Skin",
        "complement_dark": "For Dark Skin",
        "complement_fair": "For Fair Skin",

        //non profile benefits
        "beach_looks": "Beach Wear",
        "elegant_look": "For Lunch/Brunch/Dinner/Movie",
        "trendy_look": "For Daily Wear/College",
        "experimental_look": "For Holiday Trips",
        "sophisticated_look": "Casual Look",
        "day_look": "For Day Events",
        "alluring_look": "For Night Events",
        "powerful_look": "Powerful Color",
        "feminine_look": "Feminine Color",
        "bright_look": "Bright Color",
        "relaxing_look": "Relaxing Color",
        "colorful_look": "Colorful",
        "daring_look": "Bold Look",
        "intermediate_look": "Moderately Bold"
    },
    "women_jeggings": {
        "body_shapely_look": "For Small Hips",
        "body_slenderize_look": "For Big Thighs",
        "body_slimmer_look": "For Wide Hips",
        "body_fuller_look": "For Thin Legs",
        "body_elongated_look": "For Short Legs",
        "body_even_look": "For Short Upper Body",
        "body_highlight_look": "For Long Legs",
        "body_shorter_look": "For Long Upper Body",
        //profile benefits
        "classic_graceful": "Suits your age",
        "elongated_appearance": "Tall Look",
        "proportionate_legs": "Slim Look",
        "slim_legs": "Proportionate Shape",
        //non profile benefits
        "comfortable_stylish_feel": "Office Wear",
        "voguish_look": "For Daily Wear/College",
        "beauty_looks": "For Holiday Trips",
        "elegant_look": "Casual Look",
        "clubbing_look": "For Clubbing/House Party",
        "alluring_look": "For Birthday/Anniversary",
        "party_look": "Party Look",
        "powerful_look": "Powerful Color",
        "feminine_look": "Feminine Color",
        "bright_look": "Bright Color",
        "relaxing_look": "Relaxing Color",
        "colorful_look": "Colorful"
    },
    "women_jumpsuits": {
        "body_neutralise_look": "For Broad Shoulders",
        "body_proportionate_look": "For Large Busts",
        "body_slim_look": "For Big Arms",
        "body_flawless_look": "For Big Tummy",
        "body_shapely_look": "For Small Hips",
        "body_slenderize_look": "For Big Thighs",
        "body_broader_look": "For Narrow Shoulders",
        "body_curvier_look": "For Small Busts",
        "body_slimmer_look": "For Wide Hips",
        "body_fuller_look": "For Thin Legs",
        "body_elongated_look": "For Short Legs",
        "body_even_look": "For Short Upper Body",
        "body_highlight_look": "For Long Legs",
        "body_shorter_look": "For Long Upper Body",
        //profile benefits
        "classic_trendy": "Suits your age",
        "classic_graceful": "Suits your age",
        "complement_height": "Complements Height",
        "elongated_appearance": "Tall Look",
        "even_shape": "Slim Look",
        "thinner_waist": "Curvy Look",
        "proportionate_top": "Proportionate Shape",
        "defining_waist": "Highlights Curves",
        "complement_wheatish": "For Wheatish Skin",
        "complement_dark": "For Dark Skin",
        "complement_fair": "For Fair Skin",
        //non profile benefits
        "comfortable_stylish_feel": "Office Casual Look",
        "elegant_look": "For Lunch/Brunch/Dinner/Movie",
        "beach_look": "Beach Wear",
        "trendy_look": "For Daily Wear/College",
        "alluring_look": "For Holiday Trips",
        "date_look": "For a Date",
        "voguish_look": "Casual Look",
        "allseason_yes": "All Season Wear",
        "clubbing_look": "For Clubbing/House Party",
        "stylish_look": "For Birthday/Anniversary",
        "party_look": "Party Look",
        "sophisticated_look": "For Night Events",
        "day_look": "For Day Events",
        "powerful_look": "Powerful Color",
        "feminine_look": "Feminine Color",
        "bright_look": "Bright Color",
        "relaxing_look": "Relaxing Color",
        "colorful_look": "Colorful"
    },
    "women_blazers": {
        "body_neutralise_look": "For Broad Shoulders",
        "body_proportionate_look": "For Large Busts",
        "body_slim_look": "For Big Arms",
        "body_flawless_look": "For Big Tummy",
        "body_shapely_look": "For Small Hips",
        "body_slenderize_look": "For Big Thighs",
        "body_broader_look": "For Narrow Shoulders",
        "body_curvier_look": "For Small Busts",
        "body_slimmer_look": "For Wide Hips",
        "body_even_look": "For Short Upper Body",
        "body_elongated_look": "For Long Upper Body",
        //profile benefits
        "classic_graceful": "Suits your age",
        "complement_height": "Complements Height",
        "elongated_appearance": "Tall Look",
        "even_shape": "Slim Look",
        "thinner_waist": "Curvy Look",
        "proportionate_top": "Proportionate Shape",
        "defining_waist": "Highlights Curves",
        "complement_wheatish": "For Wheatish Skin",
        "complement_dark": "For Dark Skin",
        "complement_fair": "For Fair Skin",
        //non profile benefits
        "comfortable_look": "Casual Look",
        "professional_look": "Semi-formal Look",
        "comfortable_stylish_feel": "Office Casual Look",
        "classy_delicate_look": "Party Wear",
        "less_blingy_look": "For Birthday/Anniversary/Date",
        "detailed_look": "Party Wear",
        "warm_feel": "For Hot Weather",
        "functional_look": "Warm",
        "powerful_look": "Powerful Color",
        "feminine_look": "Feminine Color",
        "bright_look": "Bright Color",
        "relaxing_look": "Relaxing Color",
        "colorful_look": "Colorful"
    }
};

function checkForConflict(sessionId, callback)
{
    let user_context = Sessions.getContext(sessionId);
    let product_line = Mapping.product_line_to_db_keys[user_context["product_line"]];
    //console.log(JSON.stringify(entities, null, 2));
    if(product_line && user_context.hasOwnProperty("attribute_values"))
    {
        let benefit_key, display_name;
        if(user_context.hasOwnProperty("broad_occasion"))
        {
            benefit_key = user_context["broad_occasion"]["benefit_entity_key"];
            display_name = user_context["broad_occasion"]["key"];
        }
        if(user_context.hasOwnProperty("occasion"))
        {
            benefit_key = user_context["occasion"]["benefit_entity_key"];
            display_name = user_context["occasion"]["key"];
        }
        if(benefit_key && display_name)
        {
            let benefit_query = {"match_phrase":{"benefits":benefit_key}};
            let entity_attributes = user_context["filters"].concat();
            let aggs_query = {};
            let attributes = {};
            console.log(entity_attributes);
            entity_attributes.forEach(function(a){
                let attribute = Object.keys(a)[0];
                if(attribute!="range")
                {
                    let value =  a[attribute];
                    if(!attributes.hasOwnProperty(attribute))
                        attributes[attribute] = [];
                    if(attributes[attribute].indexOf(value)==-1)
                        attributes[attribute].push(value);

                    if(!aggs_query.hasOwnProperty(attribute))
                    {
                        aggs_query[attribute] = {
                            "filter":benefit_query,
                            "aggs":{"count":{"terms":{"field":attribute,"size":10000}}}
                        };
                    }
                }
            });
            console.log(attributes);
            console.log(aggs_query);
            if(Object.keys(aggs_query).length==0)
            {
                callback();
                return;
            }
            let attribute_query = {
                index : "product_data",
                type : product_line,
                body : {
                    size : 0,
                    aggs : aggs_query
                }
            };
            Elasticsearch.getElasticResults(attribute_query, function(response, total, error)
            {
                if(!error)
                {
                    let aggregations = response.aggregations;
                    console.log(JSON.stringify(aggregations, null,2));
                    let attribute_keys = Object.keys(aggregations);
                    let db_attribute_values = {};
                    let filters = [];
                    attribute_keys.forEach(function(att){
                        filters = filters.concat(attributes[att]);
                        let buckets = aggregations[att]["count"]["buckets"];
                        buckets = buckets.map(function(val){return val.key;});
                        db_attribute_values[att] = buckets;
                    });
                    let conflict_status = false;
                    attribute_keys.forEach(function(att){
                        let array1 = attributes[att];
                        let array2 = db_attribute_values[att];
                        let array3 = Helper.array_intersection(array1, array2);
                        if(array3.length==0)
                        {
                            conflict_status = true;
                            return false;
                        }
                    });
                    if(conflict_status)
                    {
                        callback(filters.join(", "), display_name, benefit_key);
                    }
                    else callback();
                }
                else callback();
            });
        }
        else callback();
    }
    else callback();
}
module.exports = {
    profile_benefits : profile_benefits,
    benefit_name : benefit_name,
    checkForConflict : checkForConflict
};
