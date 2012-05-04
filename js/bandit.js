/**
 * The BandIt module provides methods to draw a workflow<br/>
 * Author: Olivier Sallou <olivier.sallou@irisa.fr></br>
 * License: CeCILL-B
 * @module BandIt
 * @requires RaphaelJS, JQuery
 *
 */



/**
 * BandIt is a library above RaphaelJS to create workflows in HTML/JS.
 * @class BandIt
 * @constructor
 * @param diveditor Name of the div where editor will be put
 * @param width Width of the div
 * @param height Height of the div
 */

function BandIt(diveditor,width,height) {
	// Raphael SVG
	this.paper = Raphael(diveditor,width,height);
	/**
	 * Operation mode:
	 * 0 : drag and drop, selection
	 * 1 : link
	 * 2 : delete
	 */
	this.mode = 0;
	this.count = 0;
	this.currentnode = null;
	this.nodes = {};
	this.outlinks = {};
	this.inlinks = {};
	this.paths = {};
	this.zoom = 1;
	// Node properties object
	this.properties = {};

	this.selectCallbacks = [];
	this.deleteCallbacks = [];
	this.addCallbacks = [];
}

BandIt.prototype.arrow = function(x1, y1, x2, y2, size) {
    var angle = Math.atan2(x1-x2,y2-y1);
    angle = (angle / (2 * Math.PI)) * 360;
    ax2 = x1 + (x2 - x1) /2;
    ay2 = y1 + (y2 - y1) /2;
    var arrowPath = this.paper.path("M" + ax2 + " " + ay2 + " L" + (ax2 - size) + " " + (ay2 - size) + " L" + (ax2 - size) + " " + (ay2 + size) + " L" + ax2 + " " + ay2 ).attr("fill","black").rotate((90+angle),ax2,ay2);
    return arrowPath;
}


/**
* Register a callback when a node is selected
* @method registerSelect
* @param callback Function to use when a node is selected, function(nodeid, nodeproperties)
*/
BandIt.prototype.registerSelect = function(callback) {
  this.selectCallbacks.push(callback);
}

/**
* Register a callback when a node is deleted
* @method registerDelete
* @param callback Function to use when a node is deleted, function(nodeid)
*/

BandIt.prototype.registerDelete = function(callback) {
  this.deleteCallbacks.push(callback);
}

/**
* Register a callback when a node is added
* @method registerAdd
* @param callback Function to use when a node is added, function(nodeid)
*/
BandIt.prototype.registerAdd = function(callback) {
  this.addCallbacks.push(callback);
}



/**
* Gets current edition mode
* @method getMode
* @return current {int}  mode
*
*/
BandIt.prototype.getMode = function() {
	return this.mode;
}

/**
* Sets current edition mode
* @method setMode
* @param newmode {int}  new edition mode
*
*/
BandIt.prototype.setMode = function(newmode) {
	this.mode = newmode;
        banditLogger.DEBUG("Switch to mode "+this.mode);
}


/**
* Update the properties of a node
* @method setProperties
* @param nodeid {int} ID of the node
* @param props {Object} Properties of the node
*
*/

BandIt.prototype.setProperties = function(nodeid,props) {
	this.nodes[nodeid]["properties"] = props;
}

/**
* Sets default list of properties
* @method setDefaultProperties
* @param props {Object}  Key/value pairs of properties
*
*/

BandIt.prototype.setDefaultProperties = function(props) {
	this.properties = props;
}

/**
* get Rapahel Paper element
* @method getPaper
* @return {Paper} paper used for the draw
*/
BandIt.prototype.getPaper = function() {
  return this.paper;
}

/**
* Creates a directed link between two nodes
* @method link
* @param startnode {int} Id of start node
* @param endnode {int} Id of end node
* @return {int} Id of the graph link
*/
BandIt.prototype.link = function(startnode,endnode) {
  xpos = startnode.attr("x") + startnode.attr("width")/2;
  ypos = startnode.attr("y") + startnode.attr("height")/2;
  xend = endnode.attr("x") + endnode.attr("width")/2 ;
  yend = endnode.attr("y") + endnode.attr("height")/2 ;
  path = this.paper.path("M"+xpos+","+ypos+"L"+xend+","+yend);
  arrowpath = this.arrow(xpos,ypos,xend,yend,10);
  banditLogger.DEBUG("add arrow "+arrowpath.id);
  this.paths[path.id] =  { arrow : arrowpath.id, direction: endnode.id };
  mybandit = this;
  path.mousedown(function(e) {
    if(mybandit.mode==2) {
      path = mybandit.paper.getElementByPoint(e.x,e.y);
      mybandit.deletepath(path);
    }
  });
  path.toBack();
  if (this.inlinks[endnode.id] == null) {
    this.inlinks[endnode.id] = [];
  }
  this.inlinks[endnode.id].push({ path : path.id, node : startnode.id });
  if (this.outlinks[startnode.id] == null) { 
    this.outlinks[startnode.id] = [];
  }
  this.outlinks[startnode.id].push( { path : path.id, node : endnode.id });
  return path.id;
}

/**
* Adds a new node on paper
* @method addnode
* @param name {string}  Unique name of the node (optional). If undefined, a default counter is used
* @param atts {Object}  Element properties (optional). For properties, look at Raphael Element documentation.
* @return {Node} Node element
*
*/

BandIt.prototype.add = function(name,attrs) {
	var node = this.paper.rect(50,50, 100*this.zoom,60*this.zoom);
        nodeattr = pick(attrs,{ fill : "#f00" });
        node.attr(nodeattr);

	this.nodes[node.id] = {};
        this.nodes[node.id]["properties"] = {};
        for(var p in this.properties) {
	this.nodes[node.id]["properties"][p] = this.properties[p];
        }

	xpos = node.attr("x") + node.attr("width")/2;
	ypos = node.attr("y") + node.attr("height")/2;

        nodename = pick(name, "node"+this.count);
        this.count += 1;

	var nodetext = this.paper.text(xpos,ypos,nodename).attr("fill","#FBFBEF");
	nodetext.attr("font-size",16*this.zoom);
	nodetext.toFront();
	this.nodes[node.id]["child"] = {}
	this.nodes[node.id]["child"]["text"]=nodetext.id;
	this.nodes[node.id]["properties"]["name"]=nodename;

	var mybandit = this;

	node.mousedown(function(e) {
			node = mybandit.paper.getElementByPoint(e.x,e.y);
			currentnode = node.id
			banditLogger.DEBUG("mode: "+mybandit.mode);
			if (mybandit.mode==1) {
			// Link mode , nothing to do
			return;
			}
			if (mybandit.mode==2) {
			// Delete mode, delete node
			mybandit.deletenode(node.id);
			return;
			}
			("node "+node.id+" selected");
                        // callbacks
                        for(var i in mybandit.selectCallbacks) {
                           mybandit.selectCallbacks[i](node.id,mybandit.nodes[node.id]["properties"]);
                        }
			});

	node.mouseup(function(e) {
			if (mybandit.mode==2) {
			return; 
			}
			if (mybandit.mode==1) {
			node = mybandit.paper.getElementByPoint(e.x,e.y);
			if(node.id == currentnode) {
			return; // Do not link same node
			}
			startnode = mybandit.paper.getById(currentnode);
			mybandit.link(startnode, node);
			}
	});

	var start = function () {
		if(mybandit.mode == 2) {
			return;
		}
		this.ox = this.attr("x");
		this.oy = this.attr("y");
		this.animate({ opacity: .25}, 500, ">"); 
	};
	var move = function (dx, dy,x,y) {
		if(mybandit.mode == 1 || mybandit.mode==2) {
		}
		else {
			this.attr({x: this.ox + dx, y: this.oy + dy});
			xpos = this.ox + dx + this.attr("width")/2;
			ypos = this.oy + dy + this.attr("height")/2;
			mybandit.paper.getById(mybandit.nodes[this.id]["child"]["text"]).attr({x: xpos, y: ypos});
			mybandit.redrawpaths(this.id);
		}
	};
	var up = function () {
		if(mybandit.mode == 2) {
			return;
		}
		this.animate({ opacity: 1}, 500, ">");
	};

	node.drag(move,start,up);

       // callbacks
      for(var i in mybandit.addCallbacks) {
        mybandit.addCallbacks[i](node.id);
      }

	return node;

} // end addnode



// Redraw all path linked to current dragged node
/**
* Redraw all paths linked to a node
* @method redrawpaths
* @param nodeid {int}  Id of the Node
*
*/

BandIt.prototype.redrawpaths = function(nodeid) {
	node = this.paper.getById(nodeid);
	if (node == null ) {
		return;
	}
	if (this.outlinks[nodeid]!=null) {
		for(var i=0;i<this.outlinks[nodeid].length;i++) {
			this.redrawpath(this.outlinks[nodeid][i], node);
		}
	}
	if (this.inlinks[nodeid]!=null) {
		for(var i=0;i<this.inlinks[nodeid].length;i++) {
			this.redrawpath(this.inlinks[nodeid][i],node);
		}
	}
} // end redrawpaths

/**
* Delete a node
* @method deletenode
* @param nodeid {int} Node id to delete
*
*/

BandIt.prototype.deletenode = function(nodeid) {
        node = this.paper.getById(nodeid);
	banditLogger.DEBUG("delete node "+node.id);
        // callbacks
        for(var i in this.deleteCallbacks) {
          this.deleteCallbacks[i](node.id);
        }

	paths = this.outlinks[node.id];
	// Delete text
	text = this.paper.getById(this.nodes[node.id]["child"]["text"]);
	if(text!=null) {
		text.remove();
	}
	// Remove paths linked to node, if any
	for(var i in paths) {
		if(paths[i]!=null) {
			var pathobject =  this.paper.getById(paths[i]["path"]);
			this.deletepath(pathobject);
		}
	}
	delete this.outlinks[node.id]; 

	paths = this.inlinks[node.id];
	for(var i in paths) {
		if(paths[i]!=null) {
			var pathobject =  this.paper.getById(paths[i]["path"]); 
			this.deletepath(pathobject);
		}
	}
	delete this.inlinks[node.id];

	delete this.nodes[node.id];
	node.remove();

} // end deletenode

/**
* Delete a path
* @methode deletepath
* @param path {Path} Path element to delete
*
*/

BandIt.prototype.deletepath = function(path) {
	banditLogger.DEBUG("Delete link "+path.id);
	pathid = path.id;
	for(var node in this.outlinks) {
		links = this.outlinks[node];
		for(var i in links) {
			if(links[i]!=null && links[i]["path"]==pathid) {
				banditLogger.DEBUG("remove outlinks path "+i);
				links[i]=null;
			}
		}
	}
	for(var node in this.inlinks) {
		links = this.inlinks[node];
		for(var i in links) {
			if(links[i]!=null && links[i]["path"]==pathid) {
				banditLogger.DEBUG("remove inlinks path "+i);
				links[i]=null;
			}
		}
	}
        arrow = this.paths[path.id];
        arrow.remove();
	path.remove();

} // end deletepath

// Redraw a path element
/**
* Redraw a path
* @methode redrawpath
* @param link {Path} Path element to delete
* @param node {int} Id of the node the path is linked as origin
*
*/

BandIt.prototype.redrawpath = function(link,node) {
	if(link==null) {
		// A deleted path
		return;
	}
	path = this.paper.getById(link["path"]);
	banditLogger.DEBUG("path:" + path.id);
        arrow = this.paths[path.id]["arrow"];
        banditLogger.DEBUG("arrow:" + arrow);
        this.paper.getById(arrow).remove();
	remotenode = this.paper.getById(link["node"]);
	banditLogger.DEBUG("remote:" + remotenode.id);
	xend = remotenode.attr("x") + remotenode.attr("width")/2;
	yend = remotenode.attr("y") + remotenode.attr("height")/2;
	xpos = node.attr("x") + node.attr("width")/2;
	ypos = node.attr("y") + node.attr("height")/2;
	path.attr("path","M"+xpos+","+ypos+"L"+xend+","+yend);
        arrowdirection = this.paths[path.id]["direction"];
	if(arrowdirection!=node.id) { 
          newarrow = this.arrow(xpos,ypos,xend,yend,10);
        }
        else {
          newarrow = this.arrow(xend,yend,xpos,ypos,10);
        }
        this.paths[path.id] = { arrow: newarrow.id, direction: arrowdirection } ;

} // end redrawpath

/**
* Zoom in the workflow
* @methode zoomIn
*
*/

BandIt.prototype.zoomIn = function() {
	this.zoom = this.zoom * 2;
	banditLogger.DEBUG("zoom with "+this.zoom);
	mybandit = this;
	mybandit.paper.forEach(function (el) {
			if(mybandit.nodes[el.id]!=null) {
			el.attr("x", el.attr("x") * 2);
			el.attr("y", el.attr("y") * 2);
			el.attr({ width : el.attr("width") * 2, height: el.attr("height") * 2 });
			xpos = el.attr("x") + el.attr("width")/2;
			ypos = el.attr("y") + el.attr("height")/2;
			text = mybandit.paper.getById(mybandit.nodes[el.id]["child"]["text"]);
			text.attr({x: xpos, y: ypos}).attr("font-size",text.attr("font-size") * 2);
			mybandit.redrawpaths(el.id);
			}
			});

}

/**
* Zoom out the workflow
* @methode zoomOut
*
*/

BandIt.prototype.zoomOut = function() {
	this.zoom = this.zoom * 0.5;
	banditLogger.DEBUG("zoom with "+this.zoom);
	mybandit = this;
	mybandit.paper.forEach(function (el) {
			if(mybandit.nodes[el.id]!=null) {
			el.attr({x: el.attr("x") * 0.5, y: el.attr("y") * 0.5});
			el.attr({ width : el.attr("width") * 0.5, height: el.attr("height") * 0.5});
			xpos = el.attr("x") + el.attr("width")/2;
			ypos = el.attr("y") + el.attr("height")/2;
			text = mybandit.paper.getById(mybandit.nodes[el.id]["child"]["text"]);
			text.attr({x: xpos, y: ypos}).attr("font-size",text.attr("font-size")*0.5);
			mybandit.redrawpaths(el.id);
			}
			});

}

/**
* Translate on the left the workflow
* @methode moveLeft
* @param step {int} Step of the move
*
*/

BandIt.prototype.moveLeft = function(step) {
	mybandit = this;
	mybandit.paper.forEach(function (el) {
			if(mybandit.nodes[el.id]!=null) {
			el.attr({ x: el.attr("x") - step });
			xpos = el.attr("x") + el.attr("width")/2;
			ypos = el.attr("y") + el.attr("height")/2;
			mybandit.paper.getById(mybandit.nodes[el.id]["child"]["text"]).attr({x: xpos, y: ypos});
			mybandit.redrawpaths(el.id);
			}
			});
}

/**
* Translate on the right the workflow
* @methode moveRight
* @param step {int} Step of the move
*
*/
BandIt.prototype.moveRight = function(step) {
	mybandit = this;
	mybandit.paper.forEach(function (el) {
			if(mybandit.nodes[el.id]!=null) {
			el.attr({ x: el.attr("x") + step });
			xpos = el.attr("x") + el.attr("width")/2;
			ypos = el.attr("y") + el.attr("height")/2;
			mybandit.paper.getById(mybandit.nodes[el.id]["child"]["text"]).attr({x: xpos, y: ypos});
			mybandit.redrawpaths(el.id);
			}
			});
}

/**
* Translate to the up the workflow
* @methode moveUp
* @param step {int} Step of the move
*
*/
BandIt.prototype.moveUp = function(step) {
	mybandit = this;
	mybandit.paper.forEach(function (el) {
			if(mybandit.nodes[el.id]!=null) {
			el.attr({ y: el.attr("y") - step });
			xpos = el.attr("x") + el.attr("width")/2;
			ypos = el.attr("y") + el.attr("height")/2;
			mybandit.paper.getById(mybandit.nodes[el.id]["child"]["text"]).attr({x: xpos, y: ypos});
			mybandit.redrawpaths(el.id);
			}
			});
}

/**
* Translate to the down the workflow
* @methode moveDown
* @param step {int} Step of the move
*
*/
BandIt.prototype.moveDown = function(step) {
	mybandit = this;
	mybandit.paper.forEach(function (el) {
			if(mybandit.nodes[el.id]!=null) {
			el.attr({ y: el.attr("y") + step });
			xpos = el.attr("x") + el.attr("width")/2;
			ypos = el.attr("y") + el.attr("height")/2;
			mybandit.paper.getById(mybandit.nodes[el.id]["child"]["text"]).attr({x: xpos, y: ypos});
			mybandit.redrawpaths(el.id);
			}
			});
}

/**
* Export diagram to YAML format with all information
* @method export
* @return {String} YAML export of the workflow
*/
BandIt.prototype.export = function() {
  var exportobject = {};
  exportobject["options"] = {};
  exportobject["options"]["store"] = "none";
  exportobject["workflows"] = {};
  for(var i in this.nodes)  {
    var node = this.nodes[i];
    banditLogger.DEBUG("export node "+i);
    var attrs = this.paper.getById(i).attr();
    nodeprops = {};
    nodeprops["graph"] = attrs;
    for(var prop in node["properties"]) {
      if(prop!="name") {
        nodeprops[prop] = node["properties"][prop];
      }
    }
    // Now manage links
    var nexts = this.outlinks[i];
    
    if(node["properties"]["name"]!="root") {
      //banditLogger.DEBUG(this.inlinks[i]);
      if(this.inlinks[i]==undefined) { alert("Warning, the node "+node["properties"]["name"]+" is not linked to root node");}
    }
     
    var next = "";
    var nbnext = 0;
    for (var j in nexts) {
      if(nexts[j]!=null) {
        if(nbnext>0) {
          next += ",";
        }
        next += this.nodes[nexts[j]["node"]]["properties"]["name"]; 
        nbnext += 1;
      }
    }
    nodeprops["next"] = next;
    // TODO add next elts
    exportobject["workflows"][node["properties"]["name"]] = nodeprops;
  }
  banditLogger.DEBUG(JSON.stringify(exportobject));

  /*  
  var recipe =  window.open('','MyWorkflow','width=600,height=400');
    var html = '<html><head><title>MyWorkflow</title></head><body><div style="width:600px;word-wrap:break-word;">' + $.base64.encode(JSON.stringify(exportobject)) + '</div></body></html>';
    recipe.document.open();
    recipe.document.write(html);
    recipe.document.close();
  */
  return JSON.stringify(exportobject);

}



/**
* Eval an argument.
* @class pick
* @param arg {Object} Value to test
* @param def {Object} Default value
* @return {Object} default is undefined
*
*/
function pick(arg, def) {
   return (typeof arg == 'undefined' ? def : arg);
}

/**
* BanditLogger
* @class BanditLogger
* @constructor
* @param level {int} Level of log: 0:DEBUG, 1:INFO, 2: ERROR
*
*/
var level = 2; // Error

function BanditLogger(newlevel) {
  level = newlevel;
}

/**
* Log a debug level message
* @method DEBUG
* @param msg {String} message to log
*
*/
BanditLogger.prototype.DEBUG = function(msg) {
  if (level<=0) {
    date = new Date
    console.log("#DEBUG "+date.toString()+": "+msg);
  }
}

/**
* Log an info level message
* @method INFO
* @param msg {String} message to log
*
*/

BanditLogger.prototype.INFO = function(msg) {
  if (level<=1) {
    date = new Date
    console.log("#INFO "+date.toString()+": "+msg);
  }
}

/**
* Log an error level message
* @method ERROR
* @param msg {String} message to log
*
*/

BanditLogger.prototype.ERROR = function(msg) {
  if (level<=2) {
    date = new Date
    console.log("#ERROR "+date.toString()+": "+msg);
  }
}

banditLogger = new BanditLogger(0);


