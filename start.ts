"use strict"
import fs from 'fs'
import  _ from 'lodash'
import jetpack from 'fs-jetpack';
var unpathify = require('./tools/transforms/aliasify')
var tsify = require('./tools/transforms/tsify')
var sucrasify = require('./tools/transforms/sucrasify')
import {createSirver} from './tools/devserver/sirv'

//import {LiveReactloadPlugin} from './tools/transforms/livereactload'

import  hmr from './tools/browserify/hmr'
import cssify from './tools/browserify/cssify/cssify'
import watchify from './tools/browserify/watchify'
import browserify from './tools/browserify'

//const browserifyMiddleware = require('./middleware');
//var app = require("express")()


const b = watchify(browserify({
    entries:["./src/app.tsx"],
    extensions: ['.js', '.jsx', '.tsx', '.ts', '.mjs', '.json'],
    grep: /\.[tj]sx?$/,
    plugin:[hmr],
    transform: [
        //tsxify(),
        //filenameStream,
        //deamdify,
        cssify,
        tsify,
        //unpathify,
        sucrasify,
        unpathify,
    ],
    cache: {},
    packageCache: {},
    debug: true,
    //sourceMaps: false,
    //fullPaths: false

}))

//b.require('axios', {expose: 'axios'})



function clean() {
  async function _clean() {
  await jetpack.remove('dist')
  return jetpack.dir('dist')
  }
  return _clean()
}

clean()

function copy(){
  //jetpack.copy("node_modules/axios/lib", "dist/lib")
  return jetpack.copy("src/index.html", "dist/index.html")
}
copy()

//b.plugin(tsify)
//b.transform(cssify)
//b.plugin(LiveReactloadPlugin(), { host: 'localhost', port: 1337 })

b.on('update', bundle)



const _firstLaunch = () => createSirver('dist')
const launch = _.once(_firstLaunch)

async function bundle() {
  b.bundle()
    .on('syntax', e => console.warn(e))
    .on('error', (e) => console.error(e))
    .pipe(fs.createWriteStream("dist/coglite.js"))
    .on('close', launch) //<- webserver or electron 
}

bundle()



require('./tools/tsdk/check.js')
