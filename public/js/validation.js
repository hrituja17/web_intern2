var fname = document.getElementById('fname');
var lname = document.getElementById('lname');
var email = document.getElementById('email');
var pwd = document.getElementById('password');
var cpwd = document.getElementById('confirmpassword');
var pwdHelp = document.getElementById('passwordHelp');
var cpwdHelp = document.getElementById('confirmpasswordHelp');


function fnameValidation(){
    if (fname.value.length == 0){
        fname.style.boxShadow = "0 0 6px 1px red";
    } else {
        fname.style.boxShadow = "0 0 6px 1px green";
    }
}

function lnameValidation(){
    if (lname.value.length == 0){
        lname.style.boxShadow = "0 0 6px 1px red";
    } else {
        lname.style.boxShadow = "0 0 6px 1px green";
    }
}

function emailValidation(){
    var atposition = email.value.indexOf("@");      
    var dotposition = email.value.lastIndexOf(".");  
    if (email.value.length == 0){
        email.style.boxShadow = "0 0 6px 1px red";
    } else if(atposition < 1 || dotposition < atposition + 2 || dotposition + 2 >= email.value.length){
        email.style.boxShadow = "0 0 6px 1px red";
    } else {
        email.style.boxShadow = "0 0 6px 1px green";
    }
}

function passwordValidation(){
    var strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{6,})");
    var mediumRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{6,})");
    var weakRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.{6,})");
    var capitalWeak = new RegExp("^(?=.*[A-Z])(?=.{6,})");
    var smallWeak = new RegExp("^(?=.*[a-z])(?=.{6,})");
    if (pwd.value.length < 6){
        pwd.style.boxShadow = "0 0 6px 1px red";
        pwdHelp.innerHTML = "Too Short";
    } else if(pwd.value.length >= 6){
        if(strongRegex.test(pwd.value)){
            pwd.style.boxShadow = "0 0 6px 1px green";
            pwdHelp.innerHTML = "Strong";
        } else if(mediumRegex.test(pwd.value)){
            pwd.style.boxShadow = "0 0 6px 1px #999900";
            pwdHelp.innerHTML = "Medium";
        } else if(weakRegex.test(pwd.value) || smallWeak.test(pwd.value) || capitalWeak.test(pwd.value)){
            pwd.style.boxShadow = "0 0 6px 1px orange";
            pwdHelp.innerHTML = "Weak";
        } 
    }
}


function cpasswordValidation(){
    if (cpwd.value.length < 6){
        cpwd.style.boxShadow = "0 0 6px 1px red";
        cpwdHelp.style.display = "block";
        cpwdHelp.innerHTML = "Passwords do not match.";
    } else {
        if(cpwd.value !== pwd.value){
            cpwd.style.boxShadow = "0 0 6px 1px red";
            cpwdHelp.style.display = "block";
            cpwdHelp.innerHTML = "Passwords do not match.";
        }
        else{
            cpwd.style.boxShadow = "0 0 6px 1px green";
            cpwdHelp.style.display = "none";
            cpwdHelp.innerHTML = "";
        }
    }
}