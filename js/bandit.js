/**
 * The BandIt module provides methods to draw a workflow<br/>
 * Author: Olivier Sallou <olivier.sallou@irisa.fr></br>
 * License: CeCILL-B
 * @module BandIt
 * @requires RaphaelJS, JQuery
 *
 */

CONTAINER=1;


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
	 * 3 : group
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
        this.options = {};

	this.selectCallbacks = [];
	this.deleteCallbacks = [];
	this.addCallbacks = [];
	
	this.name = "bandit";
	this.description = "";
	
	// selectgroup is assigned the rect node id of the selection
	this.selectgroup = 0;
	this.selectionx = -1;
	this.selectiony = -1;
	// contains the list of node ids selected
	this.selectnodes = [];
	
	mybandit = this;
	$('#'+diveditor).mousedown(function(e) {
	    if(mybandit.mode!=3) {
	      return;
	    }
	    divposition = $('#'+diveditor).position();
	    
	    var match=false;
	    mybandit.selectionx = e.pageX - divposition.left;
	    mybandit.selectiony = e.pageY -divposition.top;
	    mybandit.paper.forEach(function (el) {
	    if(mybandit.nodes[el.id]!=null) { // do not select text elements
	      var xselect = false;
	      var yselect = false;
	      if((mybandit.selectionx>=el.attr("x"))&&(mybandit.selectionx<=(el.attr("x")+el.attr("width")))) {
	        xselect = true;
	      }
	      if((mybandit.selectiony>=el.attr("y"))&&(mybandit.selectiony<=(el.attr("y")+el.attr("height")))) {
	        yselect = true;
	      }
	      
    	  if(xselect && yselect) {
    	    match=true;
    	  }
    	  
    	}
    	});	    
		if(match==true) {
		  return;
		}

	      // Click on empty location
	      
	    if(mybandit.selectnodes.length>0) {
	      // Reset group
	      mybandit.clearSelection();
	    }
	    else {
	      banditLogger.DEBUG('start selection at '+(e.pageX - divposition.left)+":"+(e.pageY -divposition.top));
	      mybandit.selectionx = e.pageX - divposition.left;
	      mybandit.selectiony = e.pageY -divposition.top;
	      mybandit.selectgroup = mybandit.paper.rect(mybandit.selectionx,mybandit.selectiony,1,1).id;
	    }
	    
     	
	});
	
	$('#'+diveditor).mousemove(function(e) {
		if(mybandit.mode!=3) {
	      return;
	    }
	    
	    if(mybandit.selectgroup == 0) {
	      return;
	    }
	    divposition = $('#'+diveditor).position();
		destx = e.pageX - divposition.left;
		desty = e.pageY -divposition.top;
	    selectrect = mybandit.paper.getById(mybandit.selectgroup);
	    if(destx>mybandit.selectionx) {
	      posx = mybandit.selectionx;
	    }
	    else {
	      posx = destx;
	    }
	    if(desty>mybandit.selectiony) {
	      posy = mybandit.selectiony;
	    }
	    else {
	      posy = desty;
	    }
	    selectrect.attr({ x: posx, y : posy, width: (Math.abs(destx - mybandit.selectionx))  , height: (Math.abs(desty - mybandit.selectiony)) });    	
	});
	
	
	$('#'+diveditor).mouseup(function(e) {
		if(mybandit.mode!=3) {
	      return;
	    }
	    if(mybandit.selectgroup == 0) {
	      return;
	    }
	    
	    mybandit.paper.getById(mybandit.selectgroup).remove();
	    divposition = $('#'+diveditor).position();
		destx = e.pageX - divposition.left;
		desty = e.pageY -divposition.top;
	    
	    mybandit.paper.forEach(function (el) {
	    if(mybandit.nodes[el.id]!=null) { // do not select text elements

	    var xselect = false;
	    var yselect = false;
	    if(destx>mybandit.selectionx) { 
	      if((mybandit.selectionx <= el.attr("x"))&&(el.attr("x") <= destx)) {
	        xselect = true;
	      }
	    }
	    else {
	      if((mybandit.selectionx >= el.attr("x"))&&(el.attr("x") >= destx)) {
	        xselect = true;
	      }	    
	    }
	    if(desty>mybandit.selectiony) { 
	      if((mybandit.selectiony <= el.attr("y"))&&(el.attr("y") <= desty)) {
	        yselect = true;
	      }
	    }
	    else {
	      if((mybandit.selectiony >= el.attr("y"))&&(el.attr("y") >= desty)) {
	        yselect = true;
	      }	    
	    }	    
    	  if(xselect && yselect) {
    	    mybandit.selectnodes.push({ id : el.id, x: el.attr('x'), y: el.attr('y') });
    	    mybandit.paper.getById(el.id).attr("opacity",0.6);
    	  }
    	} // end if not text
		});
	    mybandit.selectgroup = 0;
     	mybandit.selectionx = -1;
	    mybandit.selectiony = -1;
	});
}

/**
* Clear group selection
* @method clearSelection
*/
BandIt.prototype.clearSelection = function() {
  // Reset group
  for(var i in this.selectnodes) {
    groupnode = mybandit.paper.getById(this.selectnodes[i]["id"]);
	if(groupnode!=null) {
	  if(mybandit.isContainer(this.selectnodes[i]["id"])) {
	    groupnode.attr("opacity",0.8);
	  }
	  else {
	    groupnode.attr("opacity",1);
	  }
	}
  }
  this.selectnodes = [];
}

/**
* Sets workflow name and description
* @method info
* @param name {String} Name of the workflow
* @param description {String} Description of the workflow
*
*/
BandIt.prototype.info = function(name,description) {
  banditLogger.DEBUG("Update info: "+name+","+description);
  this.name = name;
  this.description = description;
}

/**
* Adds an arrow to a path
* @method arrow
* @param x1 {int} X coordinate of start path
* @param y1 {int} Y coordinate of start path
* @param x2 {int} X coordinate of start path
* @param y2 {int} Y coordinate of start path
* @param size {int} Size of the arrow
* @return {Path} Arrow object
*
*/
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
    if(this.mode==3 && this.mode!=newmode) {
    // Special case, unselect any group
      if(this.selectnodes.length>0) {
	    // Reset group
	    this.clearSelection();
	  }
    }
	this.mode = newmode;
    banditLogger.DEBUG("Switch to mode "+this.mode);
}

/**
* Sets global workflow options
* @method setOptions
* @param options {Object} HashMap of options
*
*/
BandIt.prototype.setOptions = function(options) {
  this.options = options;
}

/**
* Update the properties of a node
* @method setProperties
* @param nodeid {int} ID of the node
* @param props {Object} Properties of the node
*
*/

BandIt.prototype.setProperties = function(nodeid,props) {
    if(props["name"]!=null && this.nodes[nodeid]["properties"]["name"]!=null && props["name"]!=this.nodes[nodeid]["properties"]["name"]) {
        banditLogger.DEBUG("Change name of node "+nodeid+" to "+props["name"]);
      	oldtext = this.paper.getById(this.nodes[nodeid]["child"]["text"]);
      	oldtext.remove();
      	var node = this.paper.getById(nodeid);
      	xpos = node.attr("x") + node.attr("width")/2;
		ypos = node.attr("y") + node.attr("height")/2;
      	var nodetext = this.paper.text(xpos,ypos,props["name"]).attr("fill","#FBFBEF");
		nodetext.attr("font-size",16*this.zoom);
		nodetext.toFront();
		this.nodes[node.id]["child"]["text"]=nodetext.id;
    }
	this.nodes[nodeid]["properties"] = props;
}

BandIt.prototype.setAttributes = function(nodeid,attrs) {
    this.paper.getById(nodeid).attr(attrs);
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
BandIt.prototype.link = function(startnodeid,endnodeid) {
  banditLogger.DEBUG("Link nodes "+startnodeid+" <-> "+endnodeid);
  startnode = this.paper.getById(startnodeid);
  endnode = this.paper.getById(endnodeid);
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
* Gets a node id by its name
* @method getByName
* @param name {String} name of the node
* @return {int} Id of the node
*
*/
BandIt.prototype.getByName = function(name) {
  var nodeid = null;
  for(var node in this.nodes) {
    if(name == this.nodes[node]["properties"]["name"]) {
      nodeid = node;
      break;
    }
  }
  return nodeid;
}

/**
* Check if node is a container
* @method isContainer
* @param {integer} node id
* @return {boolean} True if it is a container, else returns false
*/
BandIt.prototype.isContainer = function(nodeid) {
  if(this.nodes[nodeid]["type"]!=null && this.nodes[nodeid]["type"]==CONTAINER) {
    return true;
  }
  return false;
}

/**
* Adds a new node container on paper. A container acts as a node except it cannot be used
* for links, and nodes dropped in a container will be linked to the container (parent property of the node).
* @method addContainer
* @param name {string}  Unique name of the node (optional). If undefined, a default counter is used
* @param atts {Object}  Element properties (optional). For properties, look at Raphael Element documentation.
* @return {Node} Node element
*
*/
BandIt.prototype.addContainer = function(name,attrs) {
	var node = this.add(name,attrs);
	node.attr("width",200*this.zoom);
	node.attr("height",200*this.zoom);
	node.attr("opacity",0.8);
	node.attr("fill","#01DF01");
	node.toBack();
	this.nodes[node.id]["type"]=CONTAINER;
    return node;
}

/**
* Adds a new node on paper
* @method add
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
			currentnode = node.id;
			if (mybandit.mode==1) {
			  // Link mode , nothing to do
			  return;
			}
			if (mybandit.mode==3) {
			  // Group mode , nothing to do
			  return;
			}
			if (mybandit.mode==2) {
			  // Delete mode, delete node
			  if(mybandit.selectnodes.length>0) {
			    for(var i in selectnodes) {
			      mybandit.deletenode(selectnodes[i]["id"]);
			    }
			    mybandit.clearSelection();
			  }
			  else {
			    mybandit.deletenode(node.id);
			  }
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
			if (mybandit.mode==3) {
			return; 
			}
			if (mybandit.mode==1) {
			  node = mybandit.paper.getElementByPoint(e.x,e.y);
			  if(node.id == currentnode) {
			    return; // Do not link same node
			  }
			  startnode = mybandit.paper.getById(currentnode);
			  if(!mybandit.isContainer(node.id)  && !mybandit.isContainer(startnode.id)) {
			    mybandit.link(startnode.id, node.id);
			  }
			  else {
			    banditLogger.DEBUG("destination is container, drop link");
			  }
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
		    var isselected = false;
		    for(var i in mybandit.selectnodes) {
		      if (mybandit.selectnodes[i]["id"]==this.id) {
		        isselected = true;
		        break;
		      }
		    }
			if(!isselected) {
			  deltax = (this.ox + dx) - this.attr("x");
			  deltay = (this.oy + dy) - this.attr("y");
			  this.attr({x: this.ox + dx, y: this.oy + dy});
			  xpos = this.ox + dx + this.attr("width")/2;
			  ypos = this.oy + dy + this.attr("height")/2;

			  mybandit.paper.getById(mybandit.nodes[this.id]["child"]["text"]).attr({x: xpos, y: ypos});
			  mybandit.redrawpaths(this.id);
			  // If container, move childs
			  if(mybandit.nodes[this.id]["type"]==CONTAINER) {
			    mybandit.moveChilds(this.id,deltax ,deltay);
			  }
			}
			else {
			 // move all elements
			 for(var i in mybandit.selectnodes) {
			    nodeposx=this.ox + dx;
			    nodeposy=this.oy + dy;
			    deltax = (this.ox + dx) - this.attr("x");
			    deltay = (this.oy + dy) - this.attr("y");
			    var node = mybandit.paper.getById(mybandit.selectnodes[i]["id"]);
			 	node.attr({x: mybandit.selectnodes[i]["x"] + dx, y: mybandit.selectnodes[i]["y"] + dy});
			    xpos = mybandit.selectnodes[i]["x"] + dx + node.attr("width")/2;
			    ypos = mybandit.selectnodes[i]["y"] + dy + node.attr("height")/2;
			    mybandit.paper.getById(mybandit.nodes[mybandit.selectnodes[i]["id"]]["child"]["text"]).attr({x: xpos, y: ypos});
			    mybandit.redrawpaths(mybandit.selectnodes[i]["id"]);
			    // If container, move childs
			    if(mybandit.selectnodes[i]["type"]==CONTAINER) {
			      mybandit.moveChilds(mybandit.selectnodes[i]["id"],deltax ,deltay );
			    }			 
			 }
			}
		}
	};
	var up = function () {
		if(mybandit.mode == 2 || mybandit.mode ==3) {
			return;
		}
		if(mybandit.isContainer(this.id)) {
		  this.animate({ opacity: 0.8}, 500, ">");
		}
		else {
		  this.animate({ opacity: 1}, 500, ">");
		}
		var nbox = mybandit.paper.getById(this.id).getBBox();
		var intersect = false;
		for(var container in mybandit.nodes) {
		  if(container != this.id && mybandit.isContainer(container)) {
		    var cbox = mybandit.paper.getById(container).getBBox();
		    if(Raphael.isBBoxIntersect(nbox,cbox) && (mybandit.nodes[container]["parent"]==null || mybandit.nodes[container]["parent"]!=this.id)) {
		      banditLogger.DEBUG("attach node to container "+container);
		      mybandit.nodes[this.id]["parent"] = container;
		      mybandit.paper.getById(container).toBack();
		      intersect = true;
		    }
		  }
		  if(intersect) {
		    break;
		  }
		  else {
		   // Was in a container? remove it
		   if(mybandit.nodes[this.id]["parent"] != null) {
		     banditLogger.DEBUG("detach node from container "+mybandit.nodes[this.id]["parent"]);
		     mybandit.nodes[this.id]["parent"] = null;
		   }
		  }
		}
	};

	node.drag(move,start,up);

       // callbacks
      for(var i in mybandit.addCallbacks) {
        mybandit.addCallbacks[i](node.id);
      }

	return node;

} // end add

/**
* Move childs of a container
* @method moveChidls
* @param {int} id of the container
* @param {int} X translation
* @param {int} Y translation
*/
BandIt.prototype.moveChilds = function(id,dx,dy) {

  for(var i in this.nodes) {
    if(this.nodes[i]["parent"] == id ) {
      //banditLogger.DEBUG("move child "+i+" - "+dx+","+dy);
      var node = this.paper.getById(i);
      node.attr({x: node.attr("x")+ dx, y: node.attr("y") + dy});
	  xpos = this.nodes[i]["x"] + dx + node.attr("width")/2;
	  ypos = this.nodes[i]["y"] + dy + node.attr("height")/2;
	  var textnode = this.paper.getById(this.nodes[i]["child"]["text"]);
	  textnode.attr({x: textnode.attr("x")+ dx, y: textnode.attr("y") + dy});
	  //banditLogger.DEBUG("redraw links for "+i);
	  if(this.nodes[i]["type"]==CONTAINER) {
	   // Recursive move
	   this.moveChilds(i,dx,dy);
	  }
	  this.redrawpaths(i);
	}
  }

}

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
    var node = this.paper.getById(nodeid);
	banditLogger.DEBUG("delete node "+node.id);
        // callbacks
        for(var i in this.deleteCallbacks) {
          this.deleteCallbacks[i](node.id);
        }


    if(this.nodes[node.id]["type"] == CONTAINER) {
     // Delete childs of container
     for(var cnode in this.nodes) {
       if(this.nodes[cnode]["parent"] == node.id) {
         console.log("should delete "+cnode);
         this.deletenode(cnode);
       }
     }
    
    }

	paths = this.outlinks[node.id];
	// Delete text
	if(this.nodes[node.id]!=null) {
	  text = this.paper.getById(this.nodes[node.id]["child"]["text"]);
	  if(text!=null) {
		text.remove();
	  }
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
        arrow = this.paths[path.id]["arrow"];
        this.paper.getById(arrow).remove();
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
* Resets the workflow
* @method clean
*
*/
BandIt.prototype.clean = function() {
	this.currentnode = null;
	this.nodes = {};
	this.outlinks = {};
	this.inlinks = {};
	this.paths = {};
	this.paper.clear();
}

/**
* Loads a workflow
* @method load
* @param data {String} Workflow data
* @param clean {boolean} Clean exiting data or append to existing workflow
* @return {Array} Name and Description of the workflow
*/
BandIt.prototype.load = function (data,clean) {
  // If not clean, skip root
  wflow = JSON.parse($.base64.decode(data));
  this.zoomFit();
  if(clean) {
	this.clean();
  }
  var wlinks = {}; // list of node id / node names to link with
  var wnodes = {}; // list of node name/node id pairs
  var wparents = {} // parent reference for containers
  this.name = wflow["workflow"]["name"];
  this.description = wflow["workflow"]["description"];
  for(var node in wflow["workflow"]) {
    if(node=="name" || node=="description") {
      continue;
    }
    var nexts = null;
    var newnode = null;
    if(!clean && node=="root") {
      // This is root and we are in append, so do not add/draw the root node
      var nexts = wflow["workflow"][node]["next"];
      var nextnodes = nexts.split(',');
      // Get root node
      var rootnodeid = this.getByName("root");
      banditLogger.DEBUG("Root node id:" +rootnodeid);
      wlinks[rootnodeid] = nextnodes; // register future links
      newnodeid = rootnodeid;
    }
    else {
      var newnode;
      if(wflow["workflow"][node]["type"]!=null && wflow["workflow"][node]["type"]==CONTAINER) {
        newnode = this.addContainer(node,wflow["workflow"][node]["graph"]);
      }
      else {
        newnode = this.add(node,wflow["workflow"][node]["graph"]);
      }
      banditLogger.DEBUG("Load node: "+node+","+newnode.id);
      for(var prop in this.properties) {
        this.nodes[newnode.id]["properties"][prop]=wflow["workflow"][node][prop];
      }
      // is node contained in container?
      if(wflow["workflow"][node]["parent"]!=null) {
        wparents[newnode.id] = wflow["workflow"][node]["parent"];
      }
      wnodes[node] = newnode.id;
      newnodeid = newnode.id;
    }
    var nexts = wflow["workflow"][node]["next"];
    var nextnodes = nexts.split(',');
    if(nextnodes.length>0 && nextnodes[0]!="") {
      banditLogger.DEBUG("register link from "+newnodeid+" to "+nextnodes);
      wlinks[newnodeid] = nextnodes; // register future links
    }
  } // end for wflow
  
  // Set parents
  for(var wparent in wparents) {
    banditLogger.DEBUG("Set parent of node "+wparent);
    for(var containernode in this.nodes) {
      if(this.nodes[containernode]["properties"]["name"] == wparents[wparent]) {
        this.nodes[wparent]["parent"] = containernode;
        break;
      }
    }
  }
  
  // Add the links
  for(var wlink in wlinks) {
    banditLogger.DEBUG("Add links of node "+wlink);
    for(var i in wlinks[wlink]) {
      remotenodeid = wnodes[wlinks[wlink][i]];
      originnodeid = wlink;
      this.link(originnodeid,remotenodeid); 
    }
  }
  return [this.name,this.workflow];
}

/**
* Zoom back to 1
* @method zoomFit
*
*/
BandIt.prototype.zoomFit = function() {
  if(this.zoom>1) {
    this.zoomOut();
    this.zoomFit();
  }
  if(this.zoom<1) {
    this.zoomIn();
    this.zoomFit();
  }
}

/**
* Export diagram to GraphML
* @method exportGraphML
* @return {String} GraphML workflow
*/
BandIt.prototype.exportGraphML = function() {
  console.log("not yet implemented");
  var graph = '<?xml version="1.0" encoding="UTF-8"?><graphml xmlns="http://graphml.graphdrawing.org/xmlns" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://graphml.graphdrawing.org/xmlnshttp://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">\n';
  i = 0;
  // Define properties
  for(var key in this.properties) {
    graph += '<key id="prop'+i+'" for="node" attr.name="'+key+'" attr.type="string"><default>'+this.properties[key]+'</default></key>\n';
    i += 1;
  }
  graph += '<key id="type" for="node" attr.name="type" attr.type="string"><default></default></key>';
  graph += '<key id="parent" for="node" attr.name="parent" attr.type="string"><default></default></key>';
  graph += '<graph id="'+this.name+'" edgedefault="directed">\n';
  graph += '<desc>'+this.description+'</desc>';
  // Now manage nodes
  for(var i in this.nodes)  {
    var node = this.nodes[i];
    graph += '<node id="'+node["properties"]["name"]+'">';
    //var attrs = this.paper.getById(i).attr();
    for(var prop in node["properties"]) {
        graph += '<data key="'+prop+'">'+node["properties"][prop]+'</data>\n';
    }
    if(node["type"]==CONTAINER) {
      graph += '<data key="type">'+CONTAINER+'</data>\n';
    }
    if(node["parent"]!=null) {
      graph += '<data key="parent">'+this.nodes[node["parent"]]["properties"]["name"]+'</data>\n';
    }
    
    
    graph += '</node>\n';
    // Now manage links
    var nexts = this.outlinks[i];

    if(node["properties"]["name"]!="root") {
      if(this.inlinks[i]==undefined && node["type"]!=CONTAINER) { alert("Warning, the node "+node["properties"]["name"]+" is not linked to root node");}
    }
    var next = "";
    var nbnext = 0;
    for (var j in nexts) {
      if(nexts[j]!=null) {
        next = this.nodes[nexts[j]["node"]]["properties"]["name"];
	graph += '<edge id="'+i+'-'+j+'" source="'+node["properties"]["name"]+'" target="'+next+'"/>\n';
        nbnext += 1;
      }
    }
  }
  graph += '</graph>\n';
  graph += '</graphml>';
  return graph;
}

/**
* Export diagram to YAML format with all information
* @method export
* @return {String} YAML export of the workflow
*/
BandIt.prototype.export = function() {
  var exportobject = {};
  exportobject["options"] = {};
  for(var option in this.options) {
    exportobject["options"][option] = this.options[option];
  }
  exportobject["workflow"] = {};
  exportobject["workflow"]["name"] = this.name;
  exportobject["workflow"]["description"] = this.description;
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
      if(this.inlinks[i]==undefined && node["type"]!=CONTAINER) { alert("Warning, the node "+node["properties"]["name"]+" is not linked to root node");}
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
    
    if(node["type"]==CONTAINER) {
      nodeprops["type"] = CONTAINER;
    }
    
    if(node["parent"]!=null) {
      nodeprops["parent"] = this.nodes[node["parent"]]["properties"]["name"];
    }

    exportobject["workflow"][node["properties"]["name"]] = nodeprops;
  }
  banditLogger.DEBUG(JSON.stringify(exportobject));

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

banditLogger = new BanditLogger(2);



