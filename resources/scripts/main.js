
 $(function() {
  var opts = {
    lines: 13, // The number of lines to draw
    length: 7, // The length of each line
    width: 4, // The line thickness
    radius: 10, // The radius of the inner circle
    corners: 1, // Corner roundness (0..1)
    rotate: 0, // The rotation offset
    color: '#000', // #rgb or #rrggbb
    speed: 1, // Rounds per second
    trail: 60, // Afterglow percentage
    shadow: false, // Whether to render a shadow
    hwaccel: false, // Whether to use hardware acceleration
    className: 'spinner', // The CSS class to assign to the spinner
    zIndex: 2e9, // The z-index (defaults to 2000000000)
    top: '-10px', // Top position relative to parent in px
    left: '-50px' // Left position relative to parent in px
    };
    var target = document.getElementById('spinner');
    var spinner = new Spinner(opts).spin(target);
			
});

var socket = io.connect(serverIP + ':' + window.location.port);

//onces they connected we give them the objects for the map
socket.on('connect', function(){
      $("#spinner-text").html("Getting Map Data...");
      socket.emit('getElements');
  });

//renders all the elements and shows the game
socket.on('setElements', function (ElementsIn) {
    $(".gameView").show();
    $("#connecting").hide();
    for (var Element in ElementsIn)
    {
      renderMapElement(ElementsIn[Element]);
    }
    bindUIEvents();
});

//this is so we can see when others update the map
socket.on('setElement', function (ElementIn) {
   renderMapElement(ElementIn);
 
});

//removes the element with the incoming id
socket.on('removeElement', function (id) {
    $("#"+id, ".map").remove();
});

function bindUIEvents() {
  //stuff that needs to happen when the window resizes
  $(window).resize(function () {
        $(".tool-bar").sbscroller('refresh'); //makes it so the toolbar scroller checks is hieght agian
       
    });

  //action menu stuff
  $('.action-menu').on('click','li', function(e) {
    e.preventDefault();

    var action = $(this).attr("data-action");
   
    actionMenuAction(action, this);
  });

  $('#layer-up').on("click", function(e){
      actionMenuActionLayerUpdate("up");
      e.preventDefault();
    });

  $('#layer-down').on("click", function(e){
    actionMenuActionLayerUpdate("down");
    e.preventDefault();
  });
  
  //lets you scroll the tool bar
  $(".tool-bar").sbscroller();
 
 
  //lets the players move the objects to the map
  $( ".tool-item",".tool-bar" ).draggable({
     start: function( event, ui ) {
       deselectMapElements();
     },
     stop: function( event, ui ) {
      $(this).attr("style","position: relative;");
     },
     grid: [ 16, 16 ]
  });

  //lets the user move the map round.
  $('.map').draggable({
     start: function( event, ui ) {
           deselectMapElements();
         },
      grid: [ 16, 16 ]
  });

  //makes it so you can hide the action menu by click the map
  $('.map').on("click", function(){
        deselectMapElements();
    });

 //makes it so when the drop the items over the map view the show up in the map
 $( ".map-view" ).droppable({
        accept: ".tool-item",
        drop: function( event, ui ) {
             mapDroppable(event, ui);
        }
  });

}

function actionMenuHide()
{
  $(".action-menu-wrapper").hide();
  $(".action-submenu-wrapper").hide();
}

function actionMenuAction(action, target){
  $(".action-submenu-wrapper").hide();

  switch(action){
    case 'delete':
          actionMenuActionDelete();
      break;
    case 'info':
          actionMenuActionInfo(target);
    break;
    case 'layer':
          actionMenuActionLayer(target);
    break;
    default:
      alert(action);
  }

}

function actionMenuActionLayerUpdate(directon)
{
  var element =  $(".selected",".map");
  var z = element.css( "z-index");

  z = parseInt(z);

  if (isNaN(z) || z < 0){
    z = 0;
  }
  if (z > 9999){
    z = 9999;
  }

  switch(directon){
    case 'up':
          z = z + 1;
      break;
    case 'down':
           z = z - 1;
    break;
    default:
      alert("error");
  }

  if (z < 0){
    z = 0;
  }
  if (z > 9999){
    z = 9999;
  }

  element.css( "z-index", z);
  sendElement(element);
}

function actionMenuActionLayer(target)
{
  var element =  $(".selected",".map");

  var z = element.css( "z-index");
  z = parseInt(z);

  if (isNaN(z) || z < 0){
    z = 0;
  }
  if (z > 9999){
    z = 9999;
  }

  $(target).find("#layer-text").html(z);


  $(target).find(".action-submenu-wrapper").show();


}


//Tells a little into about the item
function actionMenuActionInfo(target)
{
  var element =  $(".selected",".map");
  var id = element.attr('id');
   
  id = id.replace("ME-","");
  id = parseInt(id);

  var date = new Date(id);
   
  var hours = date.getHours();
  var AMPM = "A.M.";

  if (hours > 12)
  {
    hours = hours - 12;
    AMPM  = "P.M.";
  }

  var dataString = "at " + hours  + ":"+ date.getMinutes() + " "+ AMPM  +" on " + ( date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();

  
  var html = "This object was created "+ dataString;

  $(target).find(".action-submenu").html(html);
  $(target).find(".action-submenu-wrapper").show();
}

//removes the object locally and then sends the delete command to the server
function actionMenuActionDelete()
{
  var element =  $(".selected",".map");
  
  element.remove();
  
  socket.emit('deleteElement', element.attr("id"));

  actionMenuHide();
}

function mapDroppable(event, ui){
    var size = 64;
    var element = ui.draggable.clone();
    var id = new Date().getTime();
    var map = $('.map');

    //adds an id so we know what to change later
    element.attr('id','ME-'+id);
    element.removeClass("tool-item");

    //changes the left and top to make it be placed in the correct spaot
    adjustToMapSpaces(element, ui.draggable.index());

    //makes sure that its in side the size of the map
    //have to use css becuase offset isnt made yet
    var top = element.css("top");
    var left = element.css("left");
    
    //gets ride of the px and makes an int
    top = top.replace('px');
    left = left.replace('px');
    top = parseInt(top);
    left = parseInt(left);
    
    if (top > ( -1 * size) && top < map.height() && left >  ( -1 * size)  && left < map.width())
    {
      element.appendTo( ".map" );
      mapElementBindings(element);
      sendElement(element);

      //by default draggable sets to relitive we want absolute
      element.css("position","absolute");
    }
}

function deselectMapElements()
{
  actionMenuHide();

  $(".selected",".map").each(function(index) {
        $(this).removeClass("selected");
        
         sendElement(this);
    });

}

//binds for elements that go into the map
function mapElementBindings(juqeryElement)
{
  //makes element draggable
  juqeryElement.draggable({
    grid: [ 16, 16 ],
    start: function( event ) {
      deselectMapElements();
      juqeryElement.addClass("selected");
      juqeryElement.removeClass("selected-other");
      sendElement(juqeryElement);
    },
    stop: function( event, ui ) {
      sendElement(juqeryElement);
     }
  });
 

  juqeryElement.on("click", function(event){
        deselectMapElements();

        juqeryElement.addClass("selected");

        sendElement(juqeryElement);

        $(".action-menu-wrapper").show();
        event.stopPropagation();
    });
}


//looks at the keys and move the map 16px at a time
function moveMap(direction){

  var map = $('.map');
  var top = map.offset().top;
  var left = map.offset().left;
  var space = 16;

  switch(direction){
      case 'right':
         left =  left + space;
        break;
      case 'left':
         left = left - space;
        break;
      case 'up':
       top = top - space;
      break;
      case 'down':
       top =top + space;
      break;
      default:
        //for debugging
  }

  map.offset({top: top, left: left});

}

//takes the obejcets items and display an element
function renderMapElement(ElementIn){
    $("#"+ElementIn.id, ".map").remove();
    
    var juqeryElement = $('<div id="'+ ElementIn.id +'"" class="'+ElementIn.classes+'"> </div>');
    
    juqeryElement.appendTo( ".map" );

    mapElementBindings(juqeryElement);
    
    juqeryElement.attr("style",ElementIn.style);
}


//makes it so when itmes are dragged from the ui they get the correct offset
function adjustToMapSpaces(element, offset){
  var size = 64;
  var space = 16;
  var top  = $(element).offset().top ;
  var left = $(element).offset().left;

//makes sure that its in side the size of the map
//have to use css becuase offset gives us the window offset
  var mapTop = $('.map').css("top");
  var mapLeft = $('.map').css("left");
  var toolBarTop = $('.scroll-content').css("top");
  
  if (toolBarTop == "auto")
    toolBarTop = "0px";
  //gets ride of the px and makes an int
  mapTop = mapTop.replace('px');
  mapLeft = mapLeft.replace('px');
  toolBarTop = toolBarTop.replace('px');

  mapTop = parseInt(mapTop);
  mapLeft = parseInt(mapLeft);
  toolBarTop = parseInt(toolBarTop);

  //for too bar
  left = (left + 32) - mapLeft ;
                                                     
  top = (top + (size * offset)) - mapTop + toolBarTop;
 
  // makes sure its in the grid
  top = Math.round((top / space)) * space;
  left = (Math.round((left / space)) * space) -2 ;

  $(element).offset({left: left, top: top});
}


 //makes an object on the fly from the dom element and sends it to the server
 function sendElement(element){
  var classes = $(element).attr("class");
  classes = classes.replace("selected-other","");
  classes = classes.replace(" selected"," selected-other");
  
  var object = {
    style:  $(element).attr("style"),
    classes: classes,
    id: $(element).attr("id")
  };

  socket.emit('sendElement', object);
 }

