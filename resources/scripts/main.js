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
socket.on('connect', function(){
      $("#spinner-text").html("Getting Map Data...");
      socket.emit('getElements');
  });
  
 socket.on('setElements', function (ElementsIn) {
      $(".gameView").show();
      $("#connecting").hide();
      for (var Element in ElementsIn)
      {
        renderMapElement(ElementsIn[Element]);
      }
      bindUIEvents();
  });

  socket.on('setElement', function (ElementIn) {
     renderMapElement(ElementIn);
   
  });


function bindUIEvents(){
  $( ".tool-item",".tool-bar" ).draggable({
             stop: function( event, ui ) { 
              $(this).attr("style","position: relative;")
             },
             grid: [ 16, 16 ]
    });

$('.map').draggable({
                  grid: [ 16, 16 ]
                  
                });

 $( ".map-view" ).droppable({
        accept: ".tool-item",
        drop: function( event, ui ) {
           
          var element = ui.draggable.clone();
          
          var id = new Date().getTime(); 
          
          element.attr('id','ME-'+id)
          element.removeClass("tool-item");
          element.appendTo( ".map" );
          element.draggable({
              grid: [ 16, 16 ], 
              stop: function( event, ui ) { 
                sendElement(this);
               }
            });
          adjustToMapSpaces(element, ui.draggable.index());
          sendElement(element);
          element.css("position","absolute");
        
        }
  });

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

function adjustToMapSpaces(element, offset){
	var mapOffset = $('.map').offset();
  var space = 64;
	var top  = $(element).offset().top ;
 	var left = $(element).offset().left;
                                              //for too bar
 	left = (left - space - 7) - (mapOffset.left - 76);
                                              //for too bar            
  top = (top + (space * offset  )) - (mapOffset.top - 6);
 
  $(element).offset({left: left, top: top});
}
 
 function sendElement(element){
  
 	var object = {
 		top:  $(element).css("top"),
 		left: $(element).css("left"),
 		classes: $(element).attr("class"),
    id: $(element).attr("id")
 	};

  socket.emit('sendElement', object);
 }

