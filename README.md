![Get this with Bower](https://camo.githubusercontent.com/06c5d22b7908c0c4928071ac314e75c3da29d750/687474703a2f2f62656e7363687761727a2e6769746875622e696f2f626f7765722d6261646765732f62616467654032782e706e67)

[![Build Status][travis-url]][travis-image] [![Coverage Status][coveralls-url]][coveralls-image] [![Dependency Status][depstat-image]][depstat-url] [![devDependency Status][depstat-dev-image]][depstat-dev-url] 
[![Code Climate][code-climate-url]][code-climate-image]
[![Inline docs](http://inch-ci.org/github/scaljeri/javascript-dependency-injection.svg?branch=master&style=flat-square)](http://inch-ci.org/github/scaljeri/javascript-dependency-injection)

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/scaljeri/javascript-dependency-injection?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

## Javascript Dependency Injection library written in ES2015 

### Build the page

    $> ./node_modules/.bin/browserify main.js -o bundle.js -t [ babelify --presets [ es2015 stage-0 ] ]
    
Next start a webserver, for example

    $> python -m SimpleHTTPServer

