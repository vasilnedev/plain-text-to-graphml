/*

    text2graphml converts plain text to GraphML, using configuration object

*/

const text2graphml = ( config , input ) => {
    
    // Make the input text XML compliant
    input = input.replaceAll( '<' , '&lt;' )
    input = input.replaceAll( '>' , '&gt;' )

    /* Split the input text into nodes (each paragraph is a node). 
       In the input text, the paragraps are split by one or more empty lines */
    let nodes = []
    input.split( /\n{2,}/g ).forEach( para => {     // Split paragraphs
        let lines = para.split( /\n/ )              // Split each paragraph into lines
        let name  = lines.shift()                   // Get the first line into [name]

        let nodeConfig = { ...config }              // Set default configuration for each node
        let nodeConfigMatch = name.match( /\s\/\/\{(.*)\}(.*)$/ )
        if( nodeConfigMatch ){                      // Node specific configuration overwrites the defaults
            name = name.substring( 0 , nodeConfigMatch.index )
            nodeConfig = { ...nodeConfig , ...JSON.parse( nodeConfigMatch[0].substring( 3 ) ) }
        }

        let text=''
        let notes=''
        if( nodeConfig.extractNotes && lines.length >0 ){
            text  = lines.shift()                   // Get the second line into [text]
            notes = lines.join('\n')                // Join the rest of the lines into [notes]
        }else{ text  = lines.join('\n') }           // Join the rest of the lines into [text]
        
        /* From the first line of each paragraph [name] get enumerators (current and parent) 
           For example: if first line starts with 1.2.3_, the current enumerator is 1.2.3 and the parent is 1.2
           Then add letter 'n' so the enumarators are n1.2.3 and n1.2.
           The root enumarators are 'n' (current) and null (parent)*/
        let currEnum = name.match( /^([0-9\.]*)/ )
        if( currEnum && !nodeConfig.renderIndexes ) name = name.substring( currEnum[0].length + 1 ) // Delete the enumerator from the name if configred

        let parentEnum = null
        if( currEnum && currEnum[0]!='' ){
            currEnum   = currEnum[0]
            parentEnum = currEnum.match(/([0-9\.])[0-9]*$/)
            parentEnum = currEnum.substring( 0 , parentEnum.index )
            currEnum = 'n' + currEnum
            parentEnum = 'n' + parentEnum
        }else{ currEnum='n' }                           // Root current enumerator is 'n' and parent is null (initial value)

        // Determine the node type 
        let type
        if( parentEnum === null ){    type = 'title'   }
        else if ( nodeConfig.type ) { type = nodeConfig.type }
        else if ( text.length == 0 ){ type = 'heading' }
        else {                        type = 'content' }

        // Find any cross links from the text parts - find text like '(1.2.3)' and put all matches in an array
        let crossLinks = []
        let findCrossLinks = text.match( /\([0-9\.]*\)/g )
        if( findCrossLinks ){
            findCrossLinks.forEach( link => crossLinks.push( 'n' + link.slice(1, -1) ) ) // remove the brackets and put 'n' in front
        }

        // Add node object in the nodes array
        nodes.push( { type , currEnum , parentEnum , name , text , notes , crossLinks } )
    })

    /* Generate output XML from the nodes
       Start with a header */
    let output = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">
<key id="name"   for="node" attr.name="name"/>
<key id="text"   for="node" attr.name="text"/>
<key id="notes"  for="node" attr.name="notes"/>
<key id="labels" for="node" attr.name="labels"/>
<graph id="G" edgedefault="directed">`
    // Add all nodes
    nodes.forEach( node => {
        output += `
<node id="${ node.currEnum }">
<data key="labels">${ config[node.type + 'Labels' ]}</data>
<data key="name">${ node.name }</data>
<data key="text">${ node.text }</data>
<data key="notes">${ node.notes }</data>
</node>`
    })
    output += `\n`
    // Add all edges 
    nodes.forEach( node => {
        if( node.parentEnum ) output += `<edge source="${ node.parentEnum }" target="${ node.currEnum }" label="${ config.treeLinkLabels }" />\n`
        if( config.renedrCrossLinks ){
            node.crossLinks.forEach( link => {
                output += `<edge source="${ node.currEnum }" target="${ link }" label="${ config.crossLinkLabels }" />\n`
            })
        }
    })
    // Finish with a footer
    output += `</graph>\n</graphml>`

    return output
}

module.exports = text2graphml
