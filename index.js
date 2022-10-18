/*

    Text2graphml converts plain text document into GraphML, using a configuration object
    For more information read READMe.md

*/

const text2graphml = ( config , input ) => {
    
    // Make the input text XML compliant
    input = input.replaceAll( '<' , '&lt;' )
    input = input.replaceAll( '>' , '&gt;' )

    /* Split the input text into nodes (each paragraph is a node). 
       In the input text, the paragraps are split by one or more empty lines */
    let nodes = []
    input.split( /\n{2,}/g ).forEach( para => {     // Split paragraphs
        let lines = para.split( /\n/ )              // Split each paragraph in [lines]
        let name  = lines.shift()                   // Get the first line in [name]

        let nodeConfig = { ...config }              // Set default configuration for each node
        let nodeConfigMatch = name.match( /\s\/\/\{(.*)\}(.*)$/ )
        if( nodeConfigMatch ){                      // Set node specific configuration if specified 
            name = name.substring( 0 , nodeConfigMatch.index )
            nodeConfig = { ...nodeConfig , ...JSON.parse( nodeConfigMatch[0].substring( 3 ) ) }
        }

        let text  = lines.join('\n')                // Join the rest of the lines into [text]
        
        /* From the first line of each paragraph [name] get enumerated indexes (current and parent) 
           For example: if first line starts with 1.2.3_, the current index is 1.2.3 and the parent is 1.2
           Then add letter 'n' so the indexes will turn to n1.2.3 and n1.2.
           The root indexes are 'n' (current) and null (parent)*/
        let currIndex = name.match( /^([0-9\.]*)/ )
        if( currIndex && !nodeConfig.renderIndexes ) name = name.substring( currIndex[0].length + 1 ) // Delete the enumerator from the name if configred

        let parentIndex = null
        if( currIndex && currIndex[0]!='' ){
            currIndex   = currIndex[0]
            parentIndex = currIndex.match(/([0-9\.])[0-9]*$/)
            parentIndex = currIndex.substring( 0 , parentIndex.index )
            currIndex = 'n' + currIndex
            parentIndex = 'n' + parentIndex
        }else{ currIndex='n' }                       // Root current enumerator is 'n' and parent is null (initial value)

        // Determine the node type 
        let type
        if( parentIndex === null ){    type = 'root'   }
        else if ( nodeConfig.type ) { type = nodeConfig.type }
        else if ( text.length == 0 ){ type = 'middle' }   // By default, single line paragraphs are assumed middle leaves. 
                                                          // This can be overwritten by adding node specific configuration at
                                                          // the end of the line like //{"type":"leaf"}
        else {                        type = 'leaf' }

        // Find any cross links from the [text] parts - find text like '(@1.2.3)' and put all matches in an array
        let crossLinks = []
        let findCrossLinks = text.match( /\(@[0-9\.]*\)/g )
        if( findCrossLinks ){
            findCrossLinks.forEach( link => {
                let index = link.slice(2, -1)             // remove the brackets and @, and put 'n' in front
                crossLinks.push( 'n' + index )
                text = text.replaceAll( link , '(' + index +')')
            }) 
        }

        // Add node object in the nodes array
        nodes.push( { type , currIndex , parentIndex , name , text , crossLinks } )
    })

    /* Generate output XML from the nodes
       Start with a header */
    let output = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">
<key id="name"   for="node" attr.name="name"/>
<key id="text"   for="node" attr.name="text"/>
<key id="labels" for="node" attr.name="labels"/>
<graph id="G" edgedefault="directed">`
    // Add all nodes
    nodes.forEach( node => {
        output += `
<node id="${ node.currIndex }">
<data key="labels">${ config[node.type + 'Labels' ]}</data>
<data key="name">${ node.name }</data>
<data key="text">${ node.text }</data>
</node>`
    })
    output += `\n`
    // Add all edges 
    nodes.forEach( node => {
        if( node.parentIndex ) output += `<edge source="${ node.parentIndex }" target="${ node.currIndex }" label="${ config.treeLinkLabels }" />\n`
        if( config.renedrCrossLinks ){
            node.crossLinks.forEach( link => {
                output += `<edge source="${ node.currIndex }" target="${ link }" label="${ config.crossLinkLabels }" />\n`
            })
        }
    })
    // Finish with a footer
    output += `</graph>\n</graphml>`

    return output
}

module.exports = text2graphml
