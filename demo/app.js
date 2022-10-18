const fs = require('fs')
const text2graphml = require('../index')

const args = process.argv.slice(2)

if( args.length != 2 ){
    console.log( '\nUsage: node app.js config-file.json input-file.txt [ > output-file.graphml ]\n' )
}else{
    try {
        const configObject  = JSON.parse( fs.readFileSync( args[0] , 'utf8') )
        let inputText = fs.readFileSync( args[1] , 'utf8')
        console.log( text2graphml( configObject , inputText ) )
    } catch (err) {
        console.error( err )
    }
}
