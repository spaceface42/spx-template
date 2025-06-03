document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');

    // Check if Three.js is loaded
    if (typeof THREE === 'undefined') {
        console.error('Three.js is not loaded. Please ensure it is included in your HTML.');
        return;
    }

    // Initialize the background animation
    try {
        window.backgroundInstance = new Background();
        console.log('Background animation initialized successfully.');
    } catch (error) {
        console.error('Failed to initialize background animation:', error);
    }
});

//********************** ready ****************************
document.addEventListener('DOMContentLoaded', function() {
    var init = function() {
        addSmoothScroll();
        imageLoaded();
        startAnimation();
        setupPjax();
        setupAudio();
    }
    init();
});

var addSmoothScroll = function() {
    const links = document.querySelectorAll("a[href^='#']");
    links.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            var href = this.getAttribute('href');
            var targetId = href === '#_top' ? 'body' : href;
            var target = document.querySelector(targetId);

            if (target) {
                scrollToTarget(target, 600, -100);
            }
        });
    });
}

var scrollToTarget = function(target, duration, offset) {
    var start = window.pageYOffset;
    var targetPosition = target.getBoundingClientRect().top + start + offset;
    var startTime = null;

    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        var timeElapsed = currentTime - startTime;
        var run = easeInOutExpo(timeElapsed, start, targetPosition - start, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
    }

    // Easing function (from jQuery UI)
    function easeInOutExpo(t, b, c, d) {
        if (t == 0) return b;
        if (t == d) return b + c;
        if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
        return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
    }

    requestAnimationFrame(animation);
}

var imageLoaded = function() {
    const images = document.querySelectorAll("#wrap img");
    let loadedCount = 0;

    function imageLoadedHandler() {
        loadedCount++;
        if (loadedCount === images.length) {
            // All images loaded
        }
    }

    images.forEach(img => {
        if (img.complete) {
            imageLoadedHandler();
        } else {
            img.onload = imageLoadedHandler;
            img.onerror = imageLoadedHandler; // Handle errors as well
        }
    });
}

var startAnimation = function() {
    Background();
}

var setupPjax = function() {
    setupNavi();
    setupPjaxBtn();

    var href = location.href.replace(baseURL, '');
    pageShowEvent(href);
}

var setupAudio = function() {
    var audio = document.querySelector('audio');
    var onBtn = document.querySelector('.sound > a:nth-child(1)');
    var offBtn = document.querySelector('.sound > a:nth-child(2)');

    var init = function() {
        if (audio) { // Add defensive check
            debug(audio);
            audio.volume = 0.5;
            if (cookieCheck() == 'true') {
                playAudio();
            } else {
                stopAudio();
            }
            addBtnHandler();
        } else {
            console.warn('No <audio> element found in the DOM.');
        }
    }

    var playAudio = function() {
        onBtn.classList.add('on');
        offBtn.classList.remove('on');
        if (audio) audio.play(); // Add defensive check
    }

    var stopAudio = function() {
        onBtn.classList.remove('on');
        offBtn.classList.add('on');
        if (audio) audio.pause(); // Add defensive check
    }

    var addBtnHandler = function() {
        onBtn.addEventListener('click', function(event) {
            event.preventDefault();
            if (!this.classList.contains('on')) playAudio();
        });

        offBtn.addEventListener('click', function(event) {
            event.preventDefault();
            if (!this.classList.contains('on')) stopAudio();
        });
    }

    var removeBtnHandler = function() {
        onBtn.removeEventListener('click', playAudio);
        offBtn.removeEventListener('click', stopAudio);
    }

    // cookie
    var cookieCheck = function() {
        var c = getCookie('hys_autoplay');
        debug('c = ' + c);

        if (c === undefined) {
            setCookie('hys_autoplay', 'false', 365);
        }
        return c;
    }

    init();
}


//********************** debug ****************************
// debug
var debug = function($obj) {
    if (window.console && window.console.log) {
        window.console.log($obj);
    }
}


//********************** param ****************************
// param
var getParams = function() {
    var obj = [];
    var params = location.href.split('?')[1];
    if (!params) return obj; // Handle case with no query parameters
    params = params.split('&');

    for (var i = 0; i < params.length; i++) {
        obj[i] = [];
        var p = params[i].split('=');
        obj[i].key = p[0];
        obj[i].value = p[1];
    }

    return obj;
}

/**
 *  ブラウザ名を取得
 *
 *  @return     ブラウザ名(ie6、ie7、ie8、ie9、ie10、ie11、chrome、safari、opera、firefox、unknown)
 *
 */
var getBrowser = function() {
    var ua = window.navigator.userAgent.toLowerCase();
    var ver = window.navigator.appVersion.toLowerCase();
    var name = 'unknown';

    if (ua.indexOf("msie") != -1) {
        if (ver.indexOf("msie 6.") != -1) {
            name = 'ie6';
        } else if (ver.indexOf("msie 7.") != -1) {
            name = 'ie7';
        } else if (ver.indexOf("msie 8.") != -1) {
            name = 'ie8';
        } else if (ver.indexOf("msie 9.") != -1) {
            name = 'ie9';
        } else if (ver.indexOf("msie 10.") != -1) {
            name = 'ie10';
        } else {
            name = 'ie';
        }
    } else if (ua.indexOf('trident/7') != -1) {
        name = 'ie11';
    } else if (ua.indexOf('chrome') != -1) {
        name = 'chrome';
    } else if (ua.indexOf('safari') != -1) {
        name = 'safari';
    } else if (ua.indexOf('opera') != -1) {
        name = 'opera';
    } else if (ua.indexOf('firefox') != -1) {
        name = 'firefox';
    }
    return name;
};

var isSmartDevice = function() {
    var ua = navigator.userAgent;
    var flag = false;

    if ((ua.indexOf('iPhone') > 0 && ua.indexOf('iPad') == -1) || ua.indexOf('iPod') > 0 || ua.indexOf('Android') > 0 && ua.indexOf('Mobile') > 0) {
        flag = 'smartphone';
    } else if (ua.indexOf('iPad') > 0 || ua.indexOf('Android') > 0) {
        flag = 'tablet';
    }
    return flag;
}


/**
 *  対応ブラウザかどうか判定
 *
 *  @param  browsers    対応ブラウザ名を配列で渡す(ie6、ie7、ie8、ie9、ie10、ie11、chrome、safari、opera、firefox)
 *  @return             サポートしてるかどうかをtrue/falseで返す
 *
 */
var isSupported = function(browsers) {
    var thusBrowser = getBrowser();
    for (var i = 0; i < browsers.length; i++) {
        if (browsers[i] == thusBrowser) {
            return true;
            exit;
        }
    }
    return false;
};


//********************** prototype ****************************
// set prototype.method to Function(object)
Function.prototype.method = function(name, func) {
    if (!this.prototype[name]) {
        this.prototype[name] = func;
        return this;
    }
};

//********************** AnimationFrame ****************************
//set requestAnimationFrame to window (with vendor prefixes)
(function(w, r) {
    w['r' + r] = w['r' + r] || w['webkitR' + r] || w['mozR' + r] || w['msR' + r] || w['oR' + r] || function(c) {
        w.setTimeout(c, 1000 / 60);
    };
})(window, 'equestAnimationFrame');

// Cookie functions (from MDN)
function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name) {
    document.cookie = name + '=; Max-Age=-99999999;';
}

// setupNavi, setupPjaxBtn, pageShowEvent, baseURL are missing.
// Add dummy functions to prevent errors.
function setupNavi() {}

function setupPjaxBtn() {}

function pageShowEvent(href) {}

const baseURL = '';