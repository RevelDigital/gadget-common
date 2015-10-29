(function ($) {
    "use strict";
    /// <summary>takes a string and repeats it "n" times.</summary>
    /// <param name="num" type="Number">times to repeat the string</param>
    /// <returns>rep = '*'.repeat(5);    // rep = '*****'</returns>
    String.prototype.repeat = function (num) {
        return new Array(num + 1).join(this);
    };

    /// <summary>Removes duplicates from concatenated strings</summary>
    /// <returns>Array</returns>
    Array.prototype.unique = function () {
        var a, // array
            i, // incremental counter
            j; // next incremental counter

        a = this.concat();
        for (i = 0; i < a.length; ++i) {
            for (j = i + 1; j < a.length; ++j) {
                if (a[i] === a[j]){
                    a.splice(j, 1);
                }
            }
        }

        return a;
    };

    /// <summary>Default settings for profanityFilter plugin</summary>
    var defaults = {
        replaceWith: '*',
        customSwears: null,
        externalSwears: null,
        filter: true,
        profaneText: function () {}
    };

    defaults.customSwears = [
      "2g1c",
      "2 girls 1 cup",
      "acrotomophilia",
      "anal",
      "anilingus",
      "anus",
      "arsehole",
      "ass",
      "asshole",
      "assmunch",
      "assface",
      "auto erotic",
      "autoerotic",
      "babeland",
      "baby batter",
      "ball gag",
      "ball gravy",
      "ball kicking",
      "ball licking",
      "ball sack",
      "ball sucking",
      "bangbros",
      "bareback",
      "barely legal",
      "barenaked",
      "bastardo",
      "bastinado",
      "bbw",
      "bdsm",
      "beaver cleaver",
      "beaver lips",
      "bestiality",
      "bi curious",
      "big black",
      "big breasts",
      "big knockers",
      "big tits",
      "bimbos",
      "birdlock",
      "bitch",
      "black cock",
      "blonde action",
      "blonde on blonde action",
      "blow j",
      "blow your l",
      "blue waffle",
      "blumpkin",
      "bollocks",
      "bondage",
      "boner",
      "boob",
      "boobs",
      "booty call",
      "brown showers",
      "brunette action",
      "bukkake",
      "bulldyke",
      "bullet vibe",
      "bung hole",
      "bunghole",
      "busty",
      "butt",
      "buttcheeks",
      "butthole",
      "camel toe",
      "camgirl",
      "camslut",
      "camwhore",
      "carpet muncher",
      "carpetmuncher",
      "chocolate rosebuds",
      "circlejerk",
      "cleveland steamer",
      "clit",
      "clitoris",
      "clover clamps",
      "clusterfuck",
      "cock",
      "cocks",
      "coprolagnia",
      "coprophilia",
      "cornhole",
      "cum",
      "cumming",
      "cunnilingus",
      "cunt",
      "darkie",
      "date rape",
      "daterape",
      "deep throat",
      "deepthroat",
      "dick",
      "dildo",
      "dirty pillows",
      "dirty sanchez",
      "dog style",
      "doggie style",
      "doggiestyle",
      "doggy style",
      "doggystyle",
      "dolcett",
      "domination",
      "dominatrix",
      "dommes",
      "donkey punch",
      "double dong",
      "double penetration",
      "dp action",
      "eat my ass",
      "ecchi",
      "ejaculation",
      "erotic",
      "erotism",
      "escort",
      "ethical slut",
      "eunuch",
      "faggot",
      "fecal",
      "felch",
      "fellatio",
      "feltch",
      "female squirting",
      "femdom",
      "figging",
      "fingering",
      "fisting",
      "foot fetish",
      "footjob",
      "frotting",
      "fuck",
      "fucking",
      "fucker",
      "fuck buttons",
      "fudge packer",
      "fudgepacker",
      "futanari",
      "g-spot",
      "gang bang",
      "gay sex",
      "genitals",
      "giant cock",
      "girl on",
      "girl on top",
      "girls gone wild",
      "goatcx",
      "goatse",
      "gokkun",
      "golden shower",
      "goo girl",
      "goodpoop",
      "goregasm",
      "grope",
      "group sex",
      "guro",
      "hand job",
      "handjob",
      "hard core",
      "hardcore",
      "hentai",
      "homoerotic",
      "honkey",
      "hooker",
      "hot chick",
      "how to kill",
      "how to murder",
      "huge fat",
      "humping",
      "incest",
      "intercourse",
      "jack off",
      "jail bait",
      "jailbait",
      "jerk off",
      "jigaboo",
      "jiggaboo",
      "jiggerboo",
      "jizz",
      "juggs",
      "kike",
      "kinbaku",
      "kinkster",
      "kinky",
      "knobbing",
      "leather restraint",
      "leather straight jacket",
      "lemon party",
      "lolita",
      "lovemaking",
      "make me come",
      "male squirting",
      "masturbate",
      "menage a trois",
      "milf",
      "missionary position",
      "motherfucker",
      "mound of venus",
      "mr hands",
      "muff diver",
      "muffdiving",
      "nambla",
      "nawashi",
      "negro",
      "neonazi",
      "nig nog",
      "nigga",
      "nigger",
      "nimphomania",
      "nipple",
      "nipples",
      "nsfw images",
      "nude",
      "nudity",
      "nympho",
      "nymphomania",
      "octopussy",
      "omorashi",
      "one cup two girls",
      "one guy one jar",
      "orgasm",
      "orgy",
      "paedophile",
      "panties",
      "panty",
      "pedobear",
      "pedophile",
      "pegging",
      "penis",
      "phone sex",
      "piece of shit",
      "piss pig",
      "pissing",
      "pisspig",
      "playboy",
      "pleasure chest",
      "pole smoker",
      "ponyplay",
      "poof",
      "poop chute",
      "poopchute",
      "porn",
      "porno",
      "pornography",
      "prince albert piercing",
      "pthc",
      "pubes",
      "pussy",
      "queef",
      "raghead",
      "raging boner",
      "rape",
      "raping",
      "rapist",
      "rectum",
      "reverse cowgirl",
      "rimjob",
      "rimming",
      "rosy palm",
      "rosy palm and her 5 sisters",
      "rusty trombone",
      "s&m",
      "sadism",
      "scat",
      "schlong",
      "scissoring",
      "semen",
      "sex",
      "sexo",
      "sexy",
      "shaved beaver",
      "shaved pussy",
      "shemale",
      "shibari",
      "shit",
      "shota",
      "shrimping",
      "slanteye",
      "slut",
      "smut",
      "snatch",
      "snowballing",
      "sodomize",
      "sodomy",
      "spic",
      "spooge",
      "spread legs",
      "strap on",
      "strapon",
      "strappado",
      "strip club",
      "style doggy",
      "suck",
      "sucks",
      "suicide girls",
      "sultry women",
      "swastika",
      "swinger",
      "tainted love",
      "taste my",
      "tea bagging",
      "threesome",
      "throating",
      "tied up",
      "tight white",
      "tit",
      "tits",
      "titties",
      "titty",
      "tongue in a",
      "topless",
      "tosser",
      "towelhead",
      "tranny",
      "tribadism",
      "tub girl",
      "tubgirl",
      "tushy",
      "twat",
      "twink",
      "twinkie",
      "two girls one cup",
      "undressing",
      "upskirt",
      "urethra play",
      "urophilia",
      "vagina",
      "venus mound",
      "vibrator",
      "violet wand",
      "vorarephilia",
      "voyeur",
      "vulva",
      "wank",
      "wet dream",
      "wetback",
      "white power",
      "women rapping",
      "wrapping men",
      "wrinkled starfish",
      "xx",
      "xxx",
      "yaoi",
      "yellow showers",
      "yiffy",
      "zoophilia"
    ];

    /// <summary>jQuery plugin used to filter profanity on the attached element</summary>
    /// <param name="settings">user overridden settings</param>
    /// <returns>text from an element but blots out the swear words</returns>
    $.fn.profanityFilter = function (settings, callback) {

        var options = $.extend({}, defaults, settings),
            localStorageIsEnabled;

        localStorageIsEnabled = function() {
              var uid = new Date(),
                  result;

              try {
                localStorage.setItem("uid", uid);
                result = localStorage.getItem("uid") === uid;
                localStorage.removeItem("uid");
                return result && localStorage;
              } catch(e) {}
        }();

        function allTextNodes(parent) {
            function getChildNodes(parent) {
                var x,
                    out = [];

                for (x = 0; x < parent.childNodes.length; x += 1) {
                    out[x] = parent.childNodes[x];
                }

                return out;
            }

            var cursor,
                closed = [],
                open = getChildNodes(parent);

            while (open.length) {
                cursor = open.shift();
                if (cursor.nodeType === 1) {
                    open.unshift.apply(open, getChildNodes(cursor));
                }
                if (cursor.nodeType === 3) {
                    closed.push(cursor);
                }
            }

            return closed;
        }

        function readJsonFromController(file) {
            var request = new XMLHttpRequest();
            request.open('GET', file, false);
            request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            request.send(null);
            try {
                return JSON.parse(request.responseText);
            } catch (e) {
                return '';
            }
        }

        var lastRandomNumber = null;
        function generateRandomNumber(max) {
          var randomNumber = Math.floor((Math.random()*(max)));
          if (lastRandomNumber == null) {
            lastRandomNumber = randomNumber;
          } else {
            if (randomNumber == lastRandomNumber && max !=0) {
              randomNumber +=1;
            }
          }

          if (randomNumber > max) {
            //set it back to zero
            randomNumber = 0;
          }

          lastRandomNumber = randomNumber;

          return randomNumber;
        }


        return this.each(function () {

            var badWords,
                i,
                nodes = allTextNodes(this),
                re,
                rep,
                x,
                inputs = $(this).find(':input'),
                profane = false,
                data = [];

            if (options.externalSwears !== null) {
                if (localStorageIsEnabled) {
                    if (localStorage.getItem('localSwears') === null) {
                        // stringify the array so that it can be stored in local storage
                        localStorage.setItem('localSwears', JSON.stringify(readJsonFromController(options.externalSwears)));
                    }
                    badWords = JSON.parse(localStorage.getItem('localSwears'));
                } else {
                    badWords = readJsonFromController(options.externalSwears);
                }
                if (options.customSwears !== null) {
                    badWords = badWords.concat(options.customSwears).unique();
                }
            } else {
                if (options.customSwears !== null) {
                    badWords = options.customSwears;
                }
            }

            // GET OUT, there are no Swears set either custom, external OR local.
            if (badWords === null) {
                return;
            }

            // We've got an array of swears, let's proceed with removing them from the element.
            for (i = 0; i < badWords.length; i += 1) {
                re = new RegExp('\\b' + badWords[i] + '\\b', 'gi');

                var rand = generateRandomNumber(options.replaceWith.length -1);

                rep = options.replaceWith[rand];
                if (typeof options.replaceWith == 'string') {
                  rep = options.replaceWith[rand].repeat(badWords[i].length);
                }

                // Text nodes
                for (x = 0; x < nodes.length; x += 1) {
                    if (re.test(nodes[x].nodeValue)) {
                        profane = true;
                        data.push(badWords[i]);
                        if (options.filter) {
                            nodes[x].nodeValue = nodes[x].nodeValue.replace(re, rep);
                        }
                    }
                }

                // Text input values
                for (var x = 0; x < inputs.length; x++) {
                    if (re.test(inputs[x].value)) {
                        profane = true;
                        data.push(badWords[i]);
                        if (options.filter) {
                            $(inputs[x]).val(inputs[x].value.replace(re, rep));
                        }
                    }
                }
            }

            if (profane) {
                options.profaneText(data.unique());
            };
        });
    };
})(jQuery);