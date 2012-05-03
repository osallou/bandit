/**
* The BandIt module provides methods to draw a workflow
* @module BandIt
* @requires RaphaelJS, JQuery
*
*/



/**
* BandIt is a library above RaphaelJS to create workflows in HTML/JS.
* @class BandIt
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
	this.inlinks = {};
	this.outlinks = {};
	this.paths = {};
	this.zoom = 1;
	// Node properties object
	this.properties = {};

        this.selectCallbacks = [];
        this.deleteCallbacks = [];
        this.addCallbacks = [];
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
	console.log("Switch to mode "+this.mode);
}


/**
* Update the properties of a node
* @param nodeid {int} ID of the node
* @param props {Object} Properties of the node
*
*/

BandIt.prototype.setProperties = function(nodeid,props) {
	this.nodes[nodeid]["properties"] = props;
}

BandIt.prototype.setDefaultProperties = function(props) {
	this.properties = props;
}


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
			console.log("mode: "+mybandit.mode);
			if (mybandit.mode==1) {
			// Link mode , nothing to do
			return;
			}
			if (mybandit.mode==2) {
			// Delete mode, delete node
			mybandit.deletenode(node);
			return;
			}
			console.log("node "+node.id+" selected");
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
			//TODO check there is no existing link
			xpos = startnode.attr("x") + startnode.attr("width")/2;
			ypos = startnode.attr("y") + startnode.attr("height")/2;
			xend = node.attr("x") + node.attr("width")/2;
			yend = node.attr("y") + node.attr("height")/2;
			path = mybandit.paper.path("M"+xpos+","+ypos+"L"+xend+","+yend);
			path.mousedown(function(e) {
				if(mybandit.mode==2) {
				path = mybandit.paper.getElementByPoint(e.x,e.y);
				mybandit.deletepaths(path);
				}
				});
			path.toBack();
			if (mybandit.outlinks[node.id] == null) {
				mybandit.outlinks[node.id] = []
			}
			mybandit.outlinks[node.id].push({ path : path.id, node : startnode.id });
			if (mybandit.inlinks[startnode.id] == null) { 
				mybandit.inlinks[startnode.id] = []
			}
			mybandit.inlinks[startnode.id].push( { path : path.id, node : node.id });
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
BandIt.prototype.redrawpaths = function(nodeid) {
	node = this.paper.getById(nodeid);
	if (node == null ) {
		return;
	}
	if (this.inlinks[nodeid]!=null) {
		for(var i=0;i<this.inlinks[nodeid].length;i++) {
			this.redrawpath(this.inlinks[nodeid][i], node);
		}
	}
	if (this.outlinks[nodeid]!=null) {
		for(var i=0;i<this.outlinks[nodeid].length;i++) {
			this.redrawpath(this.outlinks[nodeid][i],node);
		}
	}
} // end redrawpaths

BandIt.prototype.deletenode = function(node) {
	console.log("delete node "+node.id);
        // callbacks
        for(var i in mybandit.deleteCallbacks) {
         mybandit.deleteCallbacks[i](node.id);
        }

	paths = this.inlinks[node.id];
	// Delete text
	text = this.paper.getById(this.nodes[node.id]["child"]["text"]);
	if(text!=null) {
		text.remove();
	}
	// Remove paths linked to node, if any
	for(var i in paths) {
		if(paths[i]!=null) {
			var pathobject =  this.paper.getById(paths[i]["path"]);
			this.deletepaths(pathobject);
		}
	}
	delete this.inlinks[node.id]; 

	paths = this.outlinks[node.id];
	for(var i in paths) {
		if(paths[i]!=null) {
			var pathobject =  this.paper.getById(paths[i]["path"]); 
			this.deletepaths(pathobject);
		}
	}
	delete this.outlinks[node.id];

	delete this.nodes[node.id];
	node.remove();

} // end deletenode


BandIt.prototype.deletepaths = function(path) {
	console.log("Delete link "+path.id);
	pathid = path.id;
	for(var node in this.inlinks) {
		links = this.inlinks[node];
		for(var i in links) {
			if(links[i]!=null && links[i]["path"]==pathid) {
				console.log("remove inlinks path "+i);
				links[i]=null;
			}
		}
	}
	for(var node in this.outlinks) {
		links = this.outlinks[node];
		for(var i in links) {
			if(links[i]!=null && links[i]["path"]==pathid) {
				console.log("remove outlinks path "+i);
				links[i]=null;
			}
		}
	}
	path.remove();

} // end deletepaths

// Redraw a path element
BandIt.prototype.redrawpath = function(link,node) {
	if(link==null) {
		// A deleted path
		return;
	}
	path = this.paper.getById(link["path"]);
	//console.log("path:" + path.id);
	remotenode = this.paper.getById(link["node"]);
	//console.log("remote:" + remotenode.id);
	xend = remotenode.attr("x") + remotenode.attr("width")/2;
	yend = remotenode.attr("y") + remotenode.attr("height")/2;
	xpos = node.attr("x") + node.attr("width")/2;
	ypos = node.attr("y") + node.attr("height")/2;
	path.attr("path","M"+xpos+","+ypos+"L"+xend+","+yend);

} // end updatepath

BandIt.prototype.zoomIn = function() {
	this.zoom = this.zoom * 2;
	console.log("zoom with "+this.zoom);
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


BandIt.prototype.zoomOut = function() {
	this.zoom = this.zoom * 0.5;
	console.log("zoom with "+this.zoom);
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
*  Eval an arg, return default if undefined
*/
function pick(arg, def) {
   return (typeof arg == 'undefined' ? def : arg);
}

