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


function bindUIEvents(){

  //lets you scroll the tool bar
   $(".tool-bar" ).draggable({
             stop: function( event, ui ) { 
              if ($(this).offset().top > 0)
                  $(this).offset({top: 0, left: $(this).offset().left })
              else if ( (-1 * $(this).offset().top) > ($(this).height() - $(window).height()))
                  $(this).offset({top: -1 * ($(this).height() - $(window).height()), left: $(this).offset().left })
             },
             grid: [ 0, 64 ] //makes it so it scroll for each object
  });

  //lets the players move the objects to the map
  $( ".tool-item",".tool-bar" ).draggable({
             stop: function( event, ui ) { 
              $(this).attr("style","position: relative;")
             },
             grid: [ 16, 16 ]
  });

  //lets the user maove the map round.
  $('.map').draggable({
                    grid: [ 16, 16 ]
  });

 //makes it so when the drop the items over the map view the show up in the map
 $( ".map-view" ).droppable({
        accept: ".tool-item",
        drop: function( event, ui ) {
          var size = 64;
          var element = ui.draggable.clone();
          var id = new Date().getTime(); 
          var map = $('.map')

          //adds an id so we know what to change later
          element.attr('id','ME-'+id)
          element.removeClass("tool-item");

          //changes the left and top to make it be placed in the correct spaot
          adjustToMapSpaces(element, ui.draggable.index());

          //makes sure that its in side the size of the map
          //have to use css becuase offset isnt made yet
          var top = element.css("top"); 
          var left = element.css("left");
          
          //gets ride of the px and makes an int
          top = parseInt(top.replace('px'));
          left = parseInt(left.replace('px'));
          
          if (top > ( -1 * size) && top < map.height() && left >  ( -1 * size)  && left < map.width())
          {
            element.appendTo( ".map" );
            element.draggable({
                grid: [ 16, 16 ], 
                stop: function( event, ui ) { 
                  sendElement(this);
                 }
              });
           
            sendElement(element);

            //by default draggable sets to relitive we want absolute
            element.css("position","absolute");
          }
        }
  });

  //this is just right now for move incase there isnt any whtiespace
  $(window).keypress(function(e) {

    switch(e.which){
      case 100: //d
        moveMap('right');
        break;
      case 97://a
         moveMap('left');
        break;
      case 119://w
       moveMap('up');
      break;
      case 115://s
       moveMap('down');
      break;
      default:
        //for debugging
    }

  });
}


//looks at the keys and move the map 16px at a time
function moveMap(direction){

  var map = $('.map')
    ,top = map.offset().top
    , left = map.offset().left
    , space = 16;
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

//takes the obejcets itmes and display an object
function renderMapElement(ElementIn){
    $("#"+ElementIn.id, ".map").remove();
    var jqeryElement = $('<div id="'+ ElementIn.id +'"" class="'+ElementIn.classes+'"> </div>');
    jqeryElement.appendTo( ".map" );
    jqeryElement.draggable({
                  grid: [ 16, 16 ], 
                  stop: function( event, ui ) { 
                    sendElement(this);
                   }
                });
    jqeryElement.attr("style",'top: '+ElementIn.top+'; left: '+ElementIn.left+'; position: absolute;');
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

    //gets ride of the px and makes an int
  mapTop = parseInt(mapTop.replace('px'));
  mapLeft = parseInt(mapLeft.replace('px'));

  //for too bar
  left = (left - size - 7) - mapLeft;
                                                     
  top = (top + (size * offset)) - mapTop;
 
  // makes sure its in the grid
  top = Math.round((top / space)) * space;
  left = (Math.round((left / space)) * space) - 7;

  $(element).offset({left: left, top: top});
}


 //makes an object on the fly from the dom element and sends it to the server
 function sendElement(element){
  
 	var object = {
 		top:  $(element).css("top"),
 		left: $(element).css("left"),
 		classes: $(element).attr("class"),
    id: $(element).attr("id")
 	};

  socket.emit('sendElement', object);
 }

