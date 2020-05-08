var bars = $('#bars');
var chat = $('#chat');
var videoarea = $('#videoarea');
var icon = $('#bars i');

bars.on("click",function(){
    chat.toggleClass("moreheight");
    videoarea.toggleClass("lessheight");
    if(icon.hasClass('fa-bars')){
        icon.removeClass('fa-bars');
        icon.addClass('fa-close');
    } else {
        icon.removeClass('fa-close');
        icon.addClass('fa-bars');
    } 
})



var createdesc = document.getElementById('createdesc');

function createMeetingMessage(){
    createdesc.style.display = "block";
    createdesc.innerHTML = "Create your own meeting..";
}