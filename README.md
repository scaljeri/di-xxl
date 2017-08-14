[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/scaljeri/javascript-dependency-injection?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

## Javascript Dependency Injection library written in ES2015 

### Build the page

    $> ./node_modules/.bin/browserify main.js -o bundle.js -t [ babelify --presets [ es2015 stage-0 ] ]
    
Next start a webserver, for example

    $> python -m SimpleHTTPServer

