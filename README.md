# plain-text-to-graphml

This modeule creates GraphML(XML) output form plain text as follows:
1. Blank lines split the text in nodes.
2. Enumarated indexes form a tree structure, starting from the very first node as a root. 
3. Each node has a property 'name' which is taken from the first lines of each text block.
4. The rest of the lines are stored in property 'text'.
5. When a text block is a single line, it's assumed as a middle node in the tree. Otherwise it's assumed as a leaf.
6. A configuration file provides parametes for creating each node based on it's type in the tree structure. The assumed types can be overwritten for each node. 
7. Cross links can be made by using @ and the enumareted indexes.

The demo folder contains an example text document (demo.txt) and the output (demo.graphml) as well as screenshot of the graph (demo.png).
